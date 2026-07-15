import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
        primary:
          'border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]',
        accent:
          'border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]',
        success:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        warning:
          'border-amber-500/30 bg-amber-500/10 text-amber-400',
        danger:
          'border-red-500/30 bg-red-500/10 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export function priorityVariant(
  priority: string | null | undefined,
): VariantProps<typeof badgeVariants>['variant'] {
  const p = (priority ?? '').toLowerCase()
  if (p.includes('highest') || p.includes('critical')) return 'danger'
  if (p.includes('high')) return 'warning'
  if (p.includes('low')) return 'default'
  return 'primary'
}

export function typeVariant(
  type: string | null | undefined,
): VariantProps<typeof badgeVariants>['variant'] {
  const t = (type ?? '').toLowerCase()
  if (t.includes('bug')) return 'danger'
  if (t.includes('melhoria') || t.includes('improvement')) return 'accent'
  if (t.includes('story') || t.includes('feature')) return 'accent'
  return 'default'
}
