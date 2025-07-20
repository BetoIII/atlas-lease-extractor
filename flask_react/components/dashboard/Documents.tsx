"use client"

import { useSession } from "@/lib/auth-client"

export function Documents() {
  const { data: session } = useSession()

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Documents</h2>
      <p className="text-sm text-gray-600">Showing documents for {session?.user?.name ?? 'you'}.</p>
      <div className="mt-4 rounded border border-dashed p-8 text-center text-gray-500">
        No documents to display.
      </div>
    </div>
  )
}
