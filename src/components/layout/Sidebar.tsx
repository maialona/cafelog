import { NavLink } from 'react-router-dom'
import { Home, PlusCircle, BookOpen, Heart, Coffee, Map, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: '首頁' },
  { to: '/create', icon: PlusCircle, label: '新增紀錄' },
  { to: '/my-log', icon: BookOpen, label: '我的日誌' },
  { to: '/wishlist', icon: Heart, label: '願望清單' },
  { to: '/explore', icon: Map, label: '探索地圖' },
  { to: '/stats', icon: BarChart2, label: '統計分析' },
  { to: '/profile', icon: User, label: '個人檔案' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-64 h-screen bg-card border-r fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center justify-center lg:justify-start gap-2 h-16 px-4 border-b">
        <Coffee className="h-8 w-8 text-primary shrink-0" />
        <span className="hidden lg:block text-xl font-bold text-primary">
          Cafelog
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                    'hover:bg-accent',
                    isActive
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="hidden lg:block text-xs text-muted-foreground text-center">
          雲端同步 · Supabase
        </div>
      </div>
    </aside>
  )
}
