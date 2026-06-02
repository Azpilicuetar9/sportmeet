import { BottomTabs } from '@/components/navigation/bottom-tabs'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pb-20">
      {children}
      <BottomTabs />
    </div>
  )
}
