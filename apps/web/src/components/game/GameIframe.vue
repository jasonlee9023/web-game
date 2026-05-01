<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  src: string;
  title: string;
  aspectRatio?: string;
  frameKey?: number;
  fitViewport?: boolean;
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);

const ratioValue = computed(() => {
  const [width, height] = (props.aspectRatio ?? '9:16').split(':').map((value) => Number(value.trim()));

  if (!width || !height) {
    return 9 / 16;
  }

  return width / height;
});

const ratio = computed(() => (props.aspectRatio ?? '9:16').replace(':', ' / '));
const frameStyle = computed(() => {
  const base = { aspectRatio: ratio.value };

  if (!props.fitViewport) {
    return base;
  }

  return {
    ...base,
    width: `min(100%, calc((100dvh - 198px) * ${ratioValue.value}))`,
    marginInline: 'auto',
  };
});

function postHostMessage(message: unknown, targetOrigin = '*') {
  iframeRef.value?.contentWindow?.postMessage(message, targetOrigin);
}

defineExpose({
  postHostMessage,
});
</script>

<template>
  <div class="game-iframe-frame" :class="{ 'is-fit-viewport': fitViewport }" :style="frameStyle">
    <iframe
      :key="frameKey"
      ref="iframeRef"
      class="game-iframe"
      :src="src"
      :title="title"
      allow="autoplay; fullscreen; clipboard-write"
    />
  </div>
</template>
