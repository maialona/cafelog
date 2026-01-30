import { useState } from 'react'
import { Search, Coffee } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TopBarProps {
  onSearch?: (query: string) => void
}

export function TopBar({ onSearch }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b">
      <div className="flex items-center justify-between h-16 px-4 gap-4">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="font-bold text-primary">Cafelog</span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜尋咖啡廳..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  )
}
