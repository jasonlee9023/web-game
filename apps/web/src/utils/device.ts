import { computed, onMounted, onUnmounted, ref } from 'vue';

export function useDevice() {
  const width = ref(typeof window === 'undefined' ? 1280 : window.innerWidth);

  const update = () => {
    width.value = window.innerWidth;
  };

  onMounted(() => window.addEventListener('resize', update));
  onUnmounted(() => window.removeEventListener('resize', update));

  return {
    width,
    isMobile: computed(() => width.value < 860),
  };
}

