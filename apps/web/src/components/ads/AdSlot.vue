<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { AdPage, AdPosition, AdSlotConfig } from '@casual-game-world/shared';

import { trackAdEvent } from '@/api/ads.api';
import { useAdStore } from '@/stores/ad.store';
import { loadAdsense, requestAdsenseAd } from '@/utils/adsense';
import { useDevice } from '@/utils/device';

const props = defineProps<{
  page: AdPage;
  position: AdPosition;
  gameSlug?: string;
}>();

const adStore = useAdStore();
const trackedSlotId = ref('');
const adsenseElement = ref<HTMLElement | null>(null);
const requestedAdsenseKey = ref('');
const adsenseStatus = ref<'idle' | 'loading' | 'filled' | 'unfilled' | 'failed'>('idle');
const { isMobile } = useDevice();
let adsenseStatusTimerId: number | undefined;
let adsenseStatusChecks = 0;

type AdsenseSlot = AdSlotConfig & {
  provider: 'adsense';
  clientId: string;
};

async function loadSlots() {
  await adStore.load(props.page, props.gameSlug);
}

function clearAdsenseStatusTimer() {
  if (adsenseStatusTimerId) {
    window.clearTimeout(adsenseStatusTimerId);
    adsenseStatusTimerId = undefined;
  }
}

function inspectAdsenseStatus() {
  const element = adsenseElement.value;
  const googleStatus = element?.getAttribute('data-ad-status');

  if (googleStatus === 'filled') {
    adsenseStatus.value = 'filled';
    return;
  }

  if (googleStatus === 'unfilled') {
    adsenseStatus.value = 'unfilled';
    return;
  }

  if (element?.querySelector('iframe')) {
    adsenseStatus.value = 'filled';
    return;
  }

  if (adsenseStatusChecks < 2) {
    adsenseStatusChecks += 1;
    adsenseStatusTimerId = window.setTimeout(inspectAdsenseStatus, 1800);
    return;
  }

  adsenseStatus.value = 'unfilled';
}

function scheduleAdsenseStatusCheck() {
  clearAdsenseStatusTimer();
  adsenseStatusChecks = 0;
  adsenseStatusTimerId = window.setTimeout(inspectAdsenseStatus, 1800);
}

const slot = computed(() => {
  const candidate = adStore.getSlot(props.page, props.position, props.gameSlug);
  if (!candidate) {
    return null;
  }
  return candidate.devices.includes(isMobile.value ? 'mobile' : 'desktop') ? candidate : null;
});

const impressionLabel = computed(() => slot.value?.label ?? '파트너 슬롯');
const adsenseSlot = computed<AdsenseSlot | null>(() => {
  const candidate = slot.value;
  if (candidate?.provider === 'adsense' && candidate.clientId && candidate.unitId) {
    return candidate as AdsenseSlot;
  }
  return null;
});
const showFallback = computed(() => !adsenseSlot.value || adsenseStatus.value === 'unfilled' || adsenseStatus.value === 'failed');
const fallbackBody = computed(() => {
  if (adsenseSlot.value) {
    return '현재 표시 가능한 광고가 없어 기본 광고 영역을 보여줍니다.';
  }
  return slot.value?.unitId ?? '';
});
const fallbackMeta = computed(() => {
  if (!slot.value) {
    return '';
  }

  if (adsenseSlot.value) {
    return 'SPONSOR · FALLBACK';
  }

  return `${slot.value.provider.toUpperCase()} · ${slot.value.devices.join(' / ')}`;
});

onMounted(loadSlots);

watch(() => [props.page, props.gameSlug] as const, () => {
  void loadSlots();
});

watch(
  slot,
  (value) => {
    if (!value || trackedSlotId.value === value.id) {
      return;
    }
    trackedSlotId.value = value.id;
    void trackAdEvent({
      type: 'impression',
      page: props.page,
      gameSlug: props.gameSlug,
      slotId: value.id,
    });
  },
  { immediate: true },
);

watch(
  adsenseSlot,
  async (value) => {
    if (!value) {
      clearAdsenseStatusTimer();
      requestedAdsenseKey.value = '';
      adsenseStatus.value = 'idle';
      return;
    }

    const requestKey = `${value.id}:${value.clientId}:${value.unitId}`;
    if (requestedAdsenseKey.value === requestKey) {
      return;
    }

    requestedAdsenseKey.value = requestKey;
    adsenseStatus.value = 'loading';
    clearAdsenseStatusTimer();
    await nextTick();

    if (!adsenseElement.value) {
      requestedAdsenseKey.value = '';
      adsenseStatus.value = 'failed';
      return;
    }

    try {
      await loadAdsense(value.clientId);
      requestAdsenseAd();
      scheduleAdsenseStatusCheck();
    } catch (error) {
      requestedAdsenseKey.value = '';
      adsenseStatus.value = 'failed';
      console.warn('AdSense request failed', error);
    }
  },
  { immediate: true },
);

onBeforeUnmount(clearAdsenseStatusTimer);
</script>

<template>
  <aside
    v-if="slot"
    class="ad-slot"
    :data-position="position"
    :data-provider="slot.provider"
    :data-ad-state="adsenseSlot ? adsenseStatus : 'demo'"
  >
    <span class="ad-slot-label">광고</span>
    <template v-if="adsenseSlot && !showFallback">
      <ins
        ref="adsenseElement"
        class="adsbygoogle ad-slot-unit"
        style="display: block"
        :data-ad-client="adsenseSlot.clientId"
        :data-ad-slot="adsenseSlot.unitId"
        :data-ad-format="adsenseSlot.format ?? 'auto'"
        :data-full-width-responsive="String(adsenseSlot.fullWidthResponsive ?? true)"
      />
    </template>
    <div v-else class="ad-slot-fallback">
      <strong>{{ impressionLabel }}</strong>
      <p>{{ fallbackBody }}</p>
      <span>{{ fallbackMeta }}</span>
    </div>
  </aside>
</template>
