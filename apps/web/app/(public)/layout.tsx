import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TabBar } from '@/components/layout/TabBar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-safe md:pb-0">
        {children}
      </main>
      <Footer className="hidden md:block" />
      <TabBar />
    </div>
  )
}
