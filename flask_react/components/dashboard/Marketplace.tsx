"use client"

import { useSession } from "@/lib/auth-client"

export function Marketplace() {
  const { data: session } = useSession()

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Marketplace</h2>
      <p className="text-sm text-gray-600">Welcome {session?.user?.name ?? 'user'}.</p>
      <div className="mt-4 rounded border border-dashed p-8 text-center text-gray-500">
        Marketplace coming soon.
      </div>
    </div>
  )
}
