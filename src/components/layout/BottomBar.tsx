import { NavLink } from 'react-router-dom'
import { Home, PlusCircle, BookOpen, Heart, Map, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: '首頁' },
  { to: '/create', icon: PlusCircle, label: '新增' },
  { to: '/explore', icon: Map, label: '探索' },
  { to: '/stats', icon: BarChart2, label: '統計' },
  { to: '/my-log', icon: BookOpen, label: '日誌' },
  { to: '/wishlist', icon: Heart, label: '願望' },
]

export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
      <ul className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
