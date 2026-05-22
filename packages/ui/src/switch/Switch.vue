<script setup lang="ts">
import {
  SwitchRoot,
  SwitchThumb,
  type SwitchRootEmits,
  type SwitchRootProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<
    SwitchRootProps & {
      class?: string;
      thumbClass?: string;
    }
  >(),
  {
    disabled: false,
  },
);

const emits = defineEmits<SwitchRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none transition-colors',
        'focus-visible:ring-4 focus-visible:ring-orange-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-grey-400',
        props.class,
      )
    "
  >
    <SwitchThumb
      :class="
        cn(
          'pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(16,24,40,0.2)] ring-0 transition-transform',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
          props.thumbClass,
        )
      "
    />
  </SwitchRoot>
</template>
