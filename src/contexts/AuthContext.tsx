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

    const initAuth = async () => {
      // 檢查 URL 中是否有 OAuth callback 參數
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const queryParams = new URLSearchParams(window.location.search)
      
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const code = queryParams.get('code')
      const error = queryParams.get('error')
      
      console.log('OAuth params check:', { 
        hasAccessToken: !!accessToken, 
        hasCode: !!code, 
        hasError: !!error 
      })

      // 如果有 error 參數，表示 OAuth 失敗
      if (error) {
        console.error('OAuth error from provider:', queryParams.get('error_description'))
        setLoading(false)
        return
      }

      // 如果 URL 中有 code，明確調用 exchangeCodeForSession
      if (code) {
        console.log('PKCE code detected, exchanging for session...')
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (!mounted) return
          
          if (exchangeError) {
            console.error('Code exchange failed:', exchangeError)
            setLoading(false)
            return
          }
          
          if (data.session) {
            console.log('Session established from code exchange!')
            setSession(data.session)
            setUser(data.session.user)
            setLoading(false)
            
            // 清除 URL 中的 code 參數
            window.history.replaceState({}, '', window.location.pathname)
            return
          }
        } catch (err) {
          console.error('Code exchange exception:', err)
          setLoading(false)
          return
        }
      }

      // 如果 URL 中有 access_token (implicit flow)，讓 SDK 處理
      if (accessToken) {
        console.log('Access token in hash, setting session...')
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          
          if (!mounted) return
          
          if (setSessionError) {
            console.error('Set session failed:', setSessionError)
          } else if (data.session) {
            console.log('Session established from hash tokens!')
            setSession(data.session)
            setUser(data.session.user)
            
            // 清除 URL 中的 hash
            window.history.replaceState({}, '', window.location.pathname)
          }
        } catch (err) {
          console.error('Set session exception:', err)
        }
        setLoading(false)
        return
      }

      // 沒有 OAuth 參數，嘗試從 storage 取得現有 session
      console.log('No OAuth params, checking existing session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!mounted) return

      if (sessionError) {
        console.error('getSession error:', sessionError)
      }
      
      if (session) {
        console.log('Existing session found')
        setSession(session)
        setUser(session.user)
      } else {
        console.log('No existing session')
      }
      
      setLoading(false)
    }

    initAuth()

    // 監聽後續的 auth 狀態變化（例如 token refresh、logout 等）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: onAuthStateChange', event, session?.user?.id)
        
        if (!mounted) return

        // 只處理非初始化的事件
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
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
