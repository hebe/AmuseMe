'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Plus, Target } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/goals', label: 'Goals', icon: Target },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background">
      {/* Home */}
      <NavItem href="/" label="Home" icon={Home} active={pathname === '/'} />

      {/* Library */}
      <NavItem href="/library" label="Library" icon={BookOpen} active={pathname.startsWith('/library')} />

      {/* Add — prominent centre action */}
      <Link
        href="/add"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-primary transition-opacity active:opacity-70"
        aria-label="Add item"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </Link>

      {/* Goals */}
      <NavItem href="/goals" label="Goals" icon={Target} active={pathname.startsWith('/goals')} />
    </nav>
  )
}

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
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors active:opacity-70 ${
        active ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
      <span className="leading-none">{label}</span>
    </Link>
  )
}
