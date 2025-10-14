import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Calendar, Download, TrendingUp } from 'lucide-react';

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  customer_name: string | null;
  created_at: string;
  sale_items?: SaleItem[];
}

interface SaleItem {
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface DailySales {
  date: string;
  total: number;
  count: number;
}

export const SalesReports = ({ role }: { role: string | null }) => {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [dailyStats, setDailyStats] = useState<DailySales[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
    
    // Real-time subscription
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        () => {
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const last7Days = subDays(today, 6);

      // Fetch sales with sale_items
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            medicine_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSales(salesData || []);

      // Calculate today's total
      const todaySales = (salesData || []).filter(sale =>
        new Date(sale.created_at) >= startOfDay(today)
      );
      const todaySum = todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);
      setTodayTotal(todaySum);

      // Calculate month's total
      const monthSales = (salesData || []).filter(sale =>
        new Date(sale.created_at) >= monthStart
      );
      const monthSum = monthSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);
      setMonthTotal(monthSum);

      // Calculate daily stats for chart
      const dailyMap = new Map<string, { total: number; count: number }>();
      
      for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        const dateStr = format(date, 'MMM dd');
        dailyMap.set(dateStr, { total: 0, count: 0 });
      }

      (salesData || []).forEach(sale => {
        const saleDate = new Date(sale.created_at);
        if (saleDate >= last7Days) {
          const dateStr = format(saleDate, 'MMM dd');
          const stats = dailyMap.get(dateStr);
          if (stats) {
            stats.total += parseFloat(sale.total_amount.toString());
            stats.count += 1;
          }
        }
      });

      const chartData = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({
          date,
          total: Math.round(stats.total),
          count: stats.count
        }))
        .reverse();

      setDailyStats(chartData);

    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Sale Number', 'Date', 'Items', 'Amount', 'Payment Method', 'Customer'];
    const rows = sales.map(sale => [
      sale.sale_number,
      format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm'),
      sale.sale_items?.map(item => `${item.medicine_name} (×${item.quantity})`).join('; ') || 'N/A',
      sale.total_amount,
      sale.payment_method,
      sale.customer_name || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todayTotal.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {monthTotal.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total Sales (KES)" />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Recent Sales</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Customer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>{format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      {sale.sale_items?.map(item => 
                        `${item.medicine_name} (×${item.quantity})`
                      ).join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell>KES {parseFloat(sale.total_amount.toString()).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{sale.payment_method}</TableCell>
                    <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
