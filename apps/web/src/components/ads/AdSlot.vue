<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

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
const tracked = ref(false);
const adsenseElement = ref<HTMLElement | null>(null);
const requestedAdsenseKey = ref('');
const { isMobile } = useDevice();

type AdsenseSlot = AdSlotConfig & {
  provider: 'adsense';
  clientId: string;
};

onMounted(async () => {
  await adStore.load(props.page, props.gameSlug);
});

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

watch(
  slot,
  (value) => {
    if (tracked.value || !value) {
      return;
    }
    tracked.value = true;
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
      requestedAdsenseKey.value = '';
      return;
    }

    const requestKey = `${value.id}:${value.clientId}:${value.unitId}`;
    if (requestedAdsenseKey.value === requestKey) {
      return;
    }

    requestedAdsenseKey.value = requestKey;
    await nextTick();

    if (!adsenseElement.value) {
      requestedAdsenseKey.value = '';
      return;
    }

    try {
      await loadAdsense(value.clientId);
      requestAdsenseAd();
    } catch (error) {
      requestedAdsenseKey.value = '';
      console.warn('AdSense request failed', error);
    }
  },
  { immediate: true },
);
</script>

<template>
  <aside v-if="slot" class="ad-slot" :data-position="position" :data-provider="slot.provider">
    <template v-if="adsenseSlot">
      <span class="ad-slot-label">광고</span>
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
    <template v-else>
      <div class="ad-slot-label">광고</div>
      <strong>{{ impressionLabel }}</strong>
      <p>{{ slot.unitId }}</p>
      <span>{{ slot.provider.toUpperCase() }} · {{ slot.devices.join(' / ') }}</span>
    </template>
  </aside>
</template>
