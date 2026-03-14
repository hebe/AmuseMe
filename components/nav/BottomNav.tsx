'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, PlusCircle, Target } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  // Login page has its own full-screen layout — no nav needed there
  if (pathname === '/login') return null

  return (
    // h-16 is the visible nav height. The inline style adds env(safe-area-inset-bottom)
    // on top so the bar extends behind the iOS home indicator instead of competing with it.
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-border bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 w-full items-stretch">
        {/* Home */}
        <NavItem href="/" label="Home" icon={Home} active={pathname === '/'} />

        {/* Library */}
        <NavItem
          href="/library"
          label="Library"
          icon={BookOpen}
          active={pathname.startsWith('/library')}
        />

        {/* Add — prominent centre action, always pre-selects want */}
        <AddButton active={pathname.startsWith('/add')} />

        {/* Goals */}
        <NavItem
          href="/goals"
          label="Goals"
          icon={Target}
          active={pathname.startsWith('/goals')}
        />
      </div>
    </nav>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
// When active, renders a non-interactive span so tapping the current tab is a no-op.

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  const className = `flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
    active ? 'text-foreground' : 'text-muted-foreground transition-colors active:opacity-70'
  }`

  if (active) {
    return (
      <span className={className} aria-current="page">
        <Icon className="h-5 w-5" strokeWidth={2} />
        <span className="leading-none">{label}</span>
      </span>
    )
  }

  return (
    <Link href={href} className={className}>
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <span className="leading-none">{label}</span>
    </Link>
  )
}

// ─── Add button ───────────────────────────────────────────────────────────────

function AddButton({ active }: { active: boolean }) {
  const className = `flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
    active ? 'text-foreground' : 'text-muted-foreground transition-colors active:opacity-70'
  }`

  if (active) {
    return (
      <span className={className} aria-current="page" aria-label="Add item">
        <PlusCircle className="h-6 w-6" strokeWidth={1.5} />
        <span className="leading-none">Add</span>
      </span>
    )
  }

  return (
    <Link href="/add?status=want" className={className} aria-label="Add item">
      <PlusCircle className="h-6 w-6" strokeWidth={1.5} />
      <span className="leading-none">Add</span>
    </Link>
  )
}
