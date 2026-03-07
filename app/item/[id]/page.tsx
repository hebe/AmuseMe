import { PageHeader } from '@/components/nav/PageHeader'

// M4 — Item detail + edit
export default function ItemDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="px-4">
      <PageHeader title="Item" backHref="/library" />
      <p className="mt-1 font-mono text-xs text-muted-foreground">{params.id}</p>
      <p className="mt-4 text-sm text-muted-foreground">Coming in M4.</p>
    </main>
  )
}
