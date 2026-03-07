import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  backHref?: string
}

/**
 * Consistent page-level header used across all non-dashboard routes.
 * Pass `backHref` to show a back button (e.g. "/library" from item detail).
 */
export function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-1 pb-2 pt-8">
      {backHref && (
        <Link
          href={backHref}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    </header>
  )
}
