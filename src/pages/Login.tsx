import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export function Login() {
  const navigate = useNavigate()
  const { user, signIn, signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  // 如果使用者已經登入，重定向到首頁
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting...')
      navigate('/my-log')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: '請填寫完整',
        description: '請輸入 Email 和密碼',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        toast({
          title: isSignUp ? '註冊失敗' : '登入失敗',
          description: error.message,
          variant: 'destructive'
        })
      } else {
        if (isSignUp) {
          toast({
            title: '註冊成功！',
            description: '請檢查您的 Email 以驗證帳號'
          })
        } else {
          toast({
            title: '登入成功！',
            description: '歡迎回來'
          })
          navigate('/my-log')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    console.log('Google sign in button clicked')
    setIsGoogleLoading(true)
    try {
      console.log('Calling signInWithGoogle...')
      const { error } = await signInWithGoogle()
      console.log('signInWithGoogle returned, error:', error)
      if (error) {
        toast({
          title: 'Google 登入失敗',
          description: error.message,
          variant: 'destructive'
        })
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Cafelog</CardTitle>
          <CardDescription>
            {isSignUp ? '建立新帳號' : '登入以同步您的咖啡紀錄'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google 登入按鈕 */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleGoogleSignIn()
            }}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            使用 Google 帳號登入
          </Button>

          {/* 分隔線 */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">或</span>
            </div>
          </div>

          <form onSubmit={(e) => {
            console.log('Form submitted!')
            handleSubmit(e)
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : isSignUp ? (
                '註冊'
              ) : (
                '登入'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? '已有帳號？登入' : '還沒有帳號？註冊'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

