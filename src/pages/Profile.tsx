import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Mail, Calendar, Coffee } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getCafeStats } from '@/services/cafes'

export function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cafeStats'],
    queryFn: getCafeStats
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // 格式化註冊日期
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '未知'

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">個人檔案</h1>

      {/* 用戶資訊卡片 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/coffee-beans.png" alt="咖啡豆" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                <Coffee className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{user?.email}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>加入於 {joinDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 統計摘要 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            我的咖啡紀錄
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              {statsLoading ? (
                <Skeleton className="h-9 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-primary">
                  {stats?.visited || 0}
                </p>
              )}
              <p className="text-sm text-muted-foreground">已造訪</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              {statsLoading ? (
                <Skeleton className="h-9 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-rose-500">
                  {stats?.wishlist || 0}
                </p>
              )}
              <p className="text-sm text-muted-foreground">願望清單</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 帳號設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">帳號設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">電子郵件</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
