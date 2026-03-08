import type { BookFormat } from '@/lib/types'

const labels: Record<BookFormat, string> = {
  physical: 'Physical',
  ebook: 'eBook',
  audiobook: 'Audiobook',
}

interface FormatBadgeProps {
  format: BookFormat
}

export function FormatBadge({ format }: FormatBadgeProps) {
  return (
    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
      {labels[format]}
    </span>
  )
}
