"use client"

import { signOut, useSession } from "@/lib/auth-client"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between border-b p-4">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{session?.user?.name}</span>
        <button
          onClick={() => signOut({})}
          className="text-sm text-blue-600 hover:underline"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
