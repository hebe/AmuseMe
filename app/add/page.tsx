import { PageHeader } from '@/components/nav/PageHeader'

// M3 — Add item form (status pre-selectable via ?status=done|want)
export default function AddPage() {
  return (
    <main className="px-4">
      <PageHeader title="Add item" backHref="/" />
      <p className="mt-4 text-sm text-muted-foreground">Coming in M3.</p>
    </main>
  )
}
