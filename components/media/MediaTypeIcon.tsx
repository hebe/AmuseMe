import { BookOpen, Film, Tv, Radio } from 'lucide-react'
import type { MediaType } from '@/lib/types'

const icons: Record<MediaType, React.ElementType> = {
  book: BookOpen,
  movie: Film,
  tv_season: Tv,
  podcast: Radio,
}

interface MediaTypeIconProps {
  type: MediaType
  className?: string
}

export function MediaTypeIcon({ type, className = 'h-4 w-4' }: MediaTypeIconProps) {
  const Icon = icons[type]
  return <Icon className={className} strokeWidth={1.5} />
}
