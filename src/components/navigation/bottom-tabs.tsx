'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomTabs() {
  const pathname = usePathname()

  const tabs = [
    { href: '/home', icon: '🏠', label: 'หน้าหลัก' },
    { href: '/score', icon: '🏸', label: 'นับสกอร์' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
