import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/toaster'
import { Home } from '@/pages/Home'
import { CreatePost } from '@/pages/CreatePost'
import { MyLog } from '@/pages/MyLog'
import { Wishlist } from '@/pages/Wishlist'
import { ExploreMap } from '@/pages/ExploreMap'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/my-log" element={<MyLog />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/explore" element={<ExploreMap />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
