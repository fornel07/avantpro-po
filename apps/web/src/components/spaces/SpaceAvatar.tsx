import { cn } from '@/lib/utils'

interface SpaceAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function SpaceAvatar({
  name,
  avatarUrl,
  size = 'md',
  className,
}: SpaceAvatarProps) {
  const sizeClass = sizeClasses[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('shrink-0 rounded-lg object-cover', sizeClass, className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-[#1278F9] font-semibold text-white',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
