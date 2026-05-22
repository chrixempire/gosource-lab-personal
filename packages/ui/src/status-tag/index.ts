import { type VariantProps, cva } from 'class-variance-authority';

export { default as StatusTag } from './StatusTag.vue';
export { default as StatusTagSelect } from './StatusTagSelect.vue';
export { default } from './StatusTag.vue';

export const statusTagVariants = cva(
  'inline-flex items-center border px-1.5 py-[1px] text-xs font-medium capitalize transition-colors',
  {
    variants: {
      variant: {
        default: 'border-grey-50 bg-grey-55 text-grey-900',
        info: 'border-primary-50 bg-primary-50 text-primary-800',
        success: 'border-success-100 bg-success-75 text-success-700',
        negative: 'border-[#fda29b] bg-negative-50 text-negative-500',
        warning: 'border-[#f7b23b] bg-warning-75 text-warning-700',
        ready: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        partiallyDelivered: 'border-orange-300 bg-orange-50 text-orange-700',
        accepted: 'border-sky-300 bg-sky-50 text-sky-700',
        glory: 'border-[#d8b4fe] bg-[#f3e5f5] text-[#6a0dad]',
        completed: 'border-[#99f6e4] bg-[#ccfbf1] text-[#0d9488]',
      },
      size: {
        medium: 'gap-1 rounded-lg px-1.5 py-[1px] text-xs',
        large: 'h-7 gap-2 rounded-xl px-2 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  },
);

export type StatusTagVariants = VariantProps<typeof statusTagVariants>;
