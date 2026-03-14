import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  icon?: React.ReactNode
  backHref?: string
  /** Call router.back() instead of navigating to a fixed href. */
  onBack?: () => void
  /** Optional node rendered flush-right (e.g. an Edit or Cancel button). */
  rightAction?: React.ReactNode
}

/**
 * Consistent page-level header used across all non-dashboard routes.
 * Pass `icon` to render a custom icon before the title.
 * Pass `backHref` to show a back chevron that links to a fixed URL.
 * Pass `onBack` to show a back chevron that calls a function (e.g. router.back()).
 * Pass `rightAction` to render a button or link on the right side of the header.
 */
export function PageHeader({ title, icon, backHref, onBack, rightAction }: PageHeaderProps) {
  const backChevron = <ChevronLeft className="h-5 w-5" />
  const backClass = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground'

  return (
    <header className="flex items-start gap-1 pb-2 pt-8">
      {backHref && (
        <Link href={backHref} className={backClass} aria-label="Go back">
          {backChevron}
        </Link>
      )}
      {onBack && !backHref && (
        <button onClick={onBack} className={backClass} aria-label="Go back">
          {backChevron}
        </button>
      )}
      <h1 className="flex flex-1 items-center gap-3 text-2xl font-semibold leading-tight tracking-tight">
        {icon}
        {title}
      </h1>
      {rightAction && (
        <div className="shrink-0 ml-2">{rightAction}</div>
      )}
    </header>
  )
}
