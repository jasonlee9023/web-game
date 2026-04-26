<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import type { AdPage, AdPosition } from '@casual-game-world/shared';

import { trackAdEvent } from '@/api/ads.api';
import { useAdStore } from '@/stores/ad.store';
import { useDevice } from '@/utils/device';

const props = defineProps<{
  page: AdPage;
  position: AdPosition;
  gameSlug?: string;
}>();

const adStore = useAdStore();
const tracked = ref(false);
const { isMobile } = useDevice();

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
</script>

<template>
  <aside v-if="slot" class="ad-slot" :data-position="position">
    <div class="ad-slot-label">광고</div>
    <strong>{{ impressionLabel }}</strong>
    <p>{{ slot.unitId }}</p>
    <span>{{ slot.provider.toUpperCase() }} · {{ slot.devices.join(' / ') }}</span>
  </aside>
</template>
