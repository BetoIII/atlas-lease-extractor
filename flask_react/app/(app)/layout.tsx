import { AppLayout } from '../../components/app/AppLayout'

export default function AppLayoutWrapper({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}