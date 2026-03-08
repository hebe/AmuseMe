import { Suspense } from 'react'
import { PageHeader } from '@/components/nav/PageHeader'
import { AddItemForm } from '@/components/forms/AddItemForm'

/**
 * Add Item page — M3 (#16, #17, #18, #19)
 *
 * Kept as a server component so it can be statically optimised.
 * AddItemForm is the client island; it needs <Suspense> because it reads
 * useSearchParams() for the ?status= pre-population.
 */
export default function AddPage() {
  return (
    <main className="px-4">
      <PageHeader title="Add item" backHref="/library" />
      <Suspense>
        <AddItemForm />
      </Suspense>
    </main>
  )
}
