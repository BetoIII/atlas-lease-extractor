import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = await auth.api.getSession()
  if (!session) {
    redirect('/sign-in')
  }
  return <>{children}</>
}
