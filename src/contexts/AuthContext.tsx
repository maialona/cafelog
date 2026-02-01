import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext: mounting')
    
    // Check if we are in an OAuth callback flow
    const isAuthCallback = window.location.hash.includes('access_token') || 
                          window.location.hash.includes('type=recovery') ||
                          window.location.search.includes('code=')
    
    console.log('Is Auth Callback?', isAuthCallback)

    // 取得目前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: getSession result', session)
      setSession(session)
      setUser(session?.user ?? null)
      
      // 如果不是 callback flow，或者已經有 session，就結束 loading
      // 如果是 callback flow 但沒有 session，我們等待 onAuthStateChange 來處理
      if (!isAuthCallback || session) {
        setLoading(false)
      } else {
        console.log('Waiting for auth state change to handle callback...')
      }
    })

    // 監聽 auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: onAuthStateChange', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        
        // 如果是在 callback 流程中，且收到的是 INITIAL_SESSION 且沒有 session，
        // 則忽略這次更新（不要結束 loading），等待後續的 SIGNED_IN 事件
        if (isAuthCallback && event === 'INITIAL_SESSION' && !session) {
          console.log('Ignoring INITIAL_SESSION null during auth callback...')
          return
        }
        
        setLoading(false)
      }
    )
    
    // 安全機制：如果是 callback flow，設定一個超時，避免無限轉圈
    if (isAuthCallback) {
      setTimeout(() => {
        console.log('Auth callback timeout, forcing loading false')
        setLoading(false)
      }, 5000)
    }

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error as Error | null }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/my-log`,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error('Google OAuth error:', error)
        return { error: error as Error | null }
      }
      
      // 手動重定向到 Google 登入頁面
      if (data?.url) {
        console.log('Will redirect to:', data.url)
        // 使用 setTimeout 確保 React 程式碼執行完畢
        setTimeout(() => {
          window.location.href = data.url
        }, 100)
        return { error: null }
      }
      
      return { error: new Error('No OAuth URL returned') }
    } catch (err) {
      console.error('Google OAuth exception:', err)
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
