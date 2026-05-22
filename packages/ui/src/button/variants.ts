export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'destructive'
  | 'neutral'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'icon';

export type ButtonSize = 'large' | 'medium' | 'small' | 'icon';

const baseClasses = [
  'relative overflow-hidden inline-flex items-center justify-center whitespace-nowrap',
  'rounded-[12px] border-0 font-semibold ring-offset-background transition-[box-shadow,transform,background-color,color] duration-150 outline-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'cursor-pointer',
  /* Loading: keep button interactive for cursor; native disabled still blocks clicks */
  'data-loading:cursor-wait',
  'disabled:not([data-loading]):pointer-events-none disabled:not([data-loading]):cursor-not-allowed disabled:not([data-loading]):text-disabled disabled:not([data-loading]):bg-button-disabled disabled:not([data-loading]):shadow-none',
].join(' ');

/**
 * Inner shadows track fill tokens like reference/gosource-admin-v2 — hover uses *-clicked (or secondary/80)
 * so rim color stays aligned with hover:bg-* instead of staying on the default fill only (primary looked wrong).
 */
const primaryElevated =
  'bg-button-primary text-on-solid-bg shadow-[var(--button-elevated-inner-primary)] hover:bg-button-primary-clicked hover:shadow-[var(--button-elevated-inner-primary-hover)] active:bg-button-primary-clicked active:shadow-[var(--button-elevated-pressed-primary)] active:translate-y-px';

const variantClasses: Record<ButtonVariant, string> = {
  default: primaryElevated,
  primary: primaryElevated,
  destructive:
    '!bg-button-negative text-on-solid-bg shadow-[var(--button-elevated-inner-negative)] hover:bg-button-negative-clicked hover:shadow-[var(--button-elevated-inner-negative-hover)] active:bg-button-negative-clicked active:shadow-[var(--button-elevated-pressed-negative)] active:translate-y-px',
  neutral:
    'bg-button-neutral text-default shadow-[var(--button-elevated-inner-neutral)] hover:bg-button-neutral-clicked hover:shadow-[var(--button-elevated-inner-neutral-hover)] active:bg-button-neutral-clicked active:shadow-[var(--button-elevated-pressed-neutral)] active:translate-y-px',
  secondary:
    'bg-secondary text-secondary-foreground shadow-[var(--button-elevated-inner-secondary)] hover:bg-secondary/80 hover:shadow-[var(--button-elevated-inner-secondary-hover)] active:shadow-[var(--button-elevated-pressed-secondary)] active:translate-y-px',
  ghost:
    'bg-on-solid-bg text-default shadow-none hover:bg-button-neutral active:bg-button-neutral active:translate-y-px disabled:not([data-loading]):text-disabled disabled:not([data-loading]):bg-on-solid-bg',
  link: 'bg-transparent text-primary shadow-none underline-offset-4 hover:underline',
  icon:
    'rounded-full bg-background-default text-base shadow-[var(--button-elevated-inner-surface)] hover:bg-background-active hover:shadow-[var(--button-elevated-inner-surface-hover)] active:shadow-[var(--button-elevated-pressed-surface)] active:translate-y-px',
  outline:
    'border border-border-default bg-background text-default shadow-[var(--button-elevated-inner-outline)] hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--button-elevated-inner-outline-hover)] active:shadow-[var(--button-elevated-pressed-outline)] active:translate-y-px',
};

/**
 * `w-full` applies only to text sizes so icon triggers stay square in flex rows (e.g. branch card overflow menu).
 */
const sizeClasses: Record<ButtonSize, string> = {
  large: 'w-full h-12 px-6 gap-2 text-[18px] leading-[24px] normal-case',
  medium: 'w-full h-10 py-2.5 px-5 gap-1 text-[16px] leading-[20px] normal-case',
  small: 'w-full h-8 py-2 px-4 gap-2 text-[14px] leading-[16px] tracking-[0.1px] normal-case',
  icon: 'size-8 shrink-0',
};

export function buttonVariants({
  variant = 'primary',
  size = 'large',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return [baseClasses, variantClasses[variant], sizeClasses[size]].join(' ');
}
