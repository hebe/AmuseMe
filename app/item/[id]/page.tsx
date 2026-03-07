// M4 — Item detail + edit
export default function ItemDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex flex-col gap-6 px-4 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Item</h1>
      <p className="font-mono text-xs text-muted-foreground">{params.id}</p>
      <p className="text-sm text-muted-foreground">Coming in M4.</p>
    </main>
  )
}
