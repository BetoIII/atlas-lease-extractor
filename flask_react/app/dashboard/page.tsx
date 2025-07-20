"use client"

import { useState } from 'react'
import { Sidebar, Header, Documents, Marketplace } from '@/components/dashboard'
import { useSession } from '@/lib/auth-client'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [view, setView] = useState<'documents' | 'marketplace'>('documents')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        {session && (
          <p className="px-4 py-2 text-sm text-gray-600">Welcome back, {session.user?.name}!</p>
        )}
        <nav className="border-b px-4 pt-2">
          <button
            className={`mr-4 pb-2 border-b-2 ${view === 'documents' ? 'border-blue-500' : 'border-transparent'}`}
            onClick={() => setView('documents')}
          >
            Documents
          </button>
          <button
            className={`pb-2 border-b-2 ${view === 'marketplace' ? 'border-blue-500' : 'border-transparent'}`}
            onClick={() => setView('marketplace')}
          >
            Marketplace
          </button>
        </nav>
        <main className="flex-1 overflow-y-auto">
          {view === 'documents' ? <Documents /> : <Marketplace />}
        </main>
      </div>
    </div>
  )
}
