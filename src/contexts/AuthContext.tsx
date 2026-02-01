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
    let mounted = true

    // Check if we are in an OAuth callback flow
    const isAuthCallback = window.location.hash.includes('access_token') || 
                          window.location.hash.includes('type=recovery') ||
                          window.location.search.includes('code=') ||
                          window.location.search.includes('error=')
    
    console.log('Is Auth Callback?', isAuthCallback)

    const initAuth = async () => {
      // 嘗試取得目前的 session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (!mounted) return

      console.log('AuthContext: getSession result', session, error)
      
      if (session) {
        setSession(session)
        setUser(session.user)
        setLoading(false)
        return
      }

      // 如果沒有 session，但檢測到是 Callback 流程
      if (isAuthCallback) {
        console.log('No session yet, but callback detected. Waiting for event...')
        // 這裡不設定 loading = false，繼續等待 onAuthStateChange 事件
        
        // 安全機制：設定較長的超時，避免無限等待
        setTimeout(() => {
          if (mounted) {
            setLoading((currentLoading) => {
              if (currentLoading) {
                console.warn('Auth callback timeout. Forcing loading false.')
                return false
              }
              return currentLoading
            })
          }
        }, 10000) 
      } else {
        // 不是 Callback，確認無 Session，結束 Loading
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: onAuthStateChange', event, session?.user?.id)
        
        if (!mounted) return

        if (session) {
          setSession(session)
          setUser(session.user)
          setLoading(false)
        } else {
          // 處理沒有 Session 的狀況
          setSession(null)
          setUser(null)
          
          if (event === 'SIGNED_OUT') {
             setLoading(false)
          } else if (event === 'INITIAL_SESSION') {
             // 如果在 Callback 流程中收到 null 的 INITIAL_SESSION，我們忽略它
             // 等待後續可能的 SIGNED_IN
             if (!isAuthCallback) {
                 setLoading(false)
             } else {
                  console.log('Ignoring null INITIAL_SESSION during callback')
             }
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/my-log`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error('Google OAuth error:', error)
      }
      return { error: error as Error | null }
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
