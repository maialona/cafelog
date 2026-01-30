import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomBar } from './BottomBar'
import { TopBar } from './TopBar'
import { useState, createContext, useContext } from 'react'

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const SearchContext = createContext<SearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {}
})

export const useSearch = () => useContext(SearchContext)

export function AppShell() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="md:ml-16 lg:ml-64">
          {/* Top Bar with Search */}
          <TopBar onSearch={setSearchQuery} />

          {/* Page Content */}
          <main className="pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>

        {/* Mobile Bottom Bar */}
        <BottomBar />
      </div>
    </SearchContext.Provider>
  )
}
