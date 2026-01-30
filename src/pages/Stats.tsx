import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { BarChart as BarChartIcon, Calendar } from 'lucide-react'
import { getAllCafes } from '@/services/cafes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Stats() {
  const { data: cafes = [], isLoading } = useQuery({
    queryKey: ['cafes'],
    queryFn: () => getAllCafes()
  })

  // 取得已造訪的咖啡廳（包含願望清單嗎？如果不包含，統計的是實際造訪次數）
  // 通常統計分析是針對已發生的行為，所以只計算非願望清單的項目，但也可以讓用戶切換？
  // 為了簡單起見，這邊先統計實際造訪 (非願望清單)
  const visitedCafes = cafes.filter((c) => !c.wishlist)

  // 處理年度數據
  const yearlyData = visitedCafes.reduce((acc, cafe) => {
    const date = new Date(cafe.createdAt)
    const year = date.getFullYear().toString()
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const yearlyChartData = Object.entries(yearlyData)
    .map(([year, count]) => ({
      name: year,
      count
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // 處理月度數據 (今年度)
  const currentYear = new Date().getFullYear()
  const monthlyData = visitedCafes
    .filter((cafe) => new Date(cafe.createdAt).getFullYear() === currentYear)
    .reduce((acc, cafe) => {
      const date = new Date(cafe.createdAt)
      const month = date.getMonth() // 0-11
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<number, number>)

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

  const monthlyChartData = months.map((name, index) => ({
    name,
    count: monthlyData[index] || 0
  }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChartIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">統計分析</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總造訪次數</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitedCafes.length}</div>
            <p className="text-xs text-muted-foreground">
              累計打卡咖啡廳
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本年度造訪</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitedCafes.filter(c => new Date(c.createdAt).getFullYear() === currentYear).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentYear} 年累計
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">造訪趨勢</h2>
          <TabsList>
            <TabsTrigger value="monthly">月度 ({currentYear})</TabsTrigger>
            <TabsTrigger value="yearly">年度</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly">
          <Card>
            <CardContent className="pt-6 pl-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={20}>
                        {monthlyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.count > 0 ? "var(--color-primary)" : "var(--color-muted)"} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card>
            <CardContent className="pt-6 pl-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
