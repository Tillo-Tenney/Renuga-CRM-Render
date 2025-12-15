import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { StatCard } from '@/components/ui/stat-card';
import {
  Phone,
  Users,
  ShoppingCart,
  Clock,
  TrendingUp,
  AlertTriangle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgingBadge } from '@/components/ui/aging-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const ORDER_COLORS = ['#3b82f6', '#eab308', '#f97316', '#0ea5e9', '#22c55e'];

const Dashboard = () => {
  const { currentUser, getStats, leads, orders, tasks } = useCRM();
  const stats = getStats();

  // Get critical leads
  const criticalLeads = leads
    .filter(l => l.agingBucket === 'Critical' && !['Won', 'Lost'].includes(l.status))
    .slice(0, 5);

  // Get delayed orders
  const delayedOrders = orders.filter(o => o.isDelayed).slice(0, 5);

  // Get today's pending tasks
  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Overdue').slice(0, 5);

  // Role-based dashboard content
  const isFrontDesk = currentUser.role === 'Front Desk';
  const isSales = currentUser.role === 'Sales';
  const isOperations = currentUser.role === 'Operations';
  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${currentUser.name.split(' ')[0]}`}
        subtitle={`${currentUser.role} Dashboard • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(isFrontDesk || isAdmin) && (
            <>
              <StatCard
                title="Calls Today"
                value={stats.callsToday}
                icon={Phone}
                variant="primary"
              />
              <StatCard
                title="Follow-ups Due Today"
                value={stats.followUpsDueToday}
                icon={Clock}
                variant={stats.followUpsDueToday > 0 ? 'warning' : 'default'}
              />
              <StatCard
                title="New Leads Today"
                value={stats.newLeadsToday}
                icon={Users}
                variant="success"
              />
            </>
          )}

          {(isSales || isAdmin) && (
            <>
              <StatCard
                title="Active Leads"
                value={stats.activeLeads}
                icon={Users}
                variant="primary"
              />
              <StatCard
                title="Critical Leads"
                value={stats.criticalLeads}
                icon={AlertTriangle}
                variant={stats.criticalLeads > 0 ? 'destructive' : 'default'}
              />
              <StatCard
                title="Conversion Rate"
                value={`${stats.conversionRate.toFixed(1)}%`}
                icon={TrendingUp}
                variant="success"
              />
            </>
          )}

          {(isOperations || isAdmin) && (
            <>
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                icon={ShoppingCart}
                variant="primary"
              />
              <StatCard
                title="Delayed Orders"
                value={stats.delayedOrders}
                icon={AlertTriangle}
                variant={stats.delayedOrders > 0 ? 'destructive' : 'default'}
              />
              <StatCard
                title="Today's Deliveries"
                value={stats.todaysDeliveries}
                icon={Truck}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Aging Chart */}
          {(isSales || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Lead Aging Distribution</CardTitle>
                <CardDescription>Active leads by aging bucket</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.leadsByBucket}
                        dataKey="count"
                        nameKey="bucket"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ bucket, count }) => `${bucket}: ${count}`}
                      >
                        {stats.leadsByBucket.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders by Status Chart */}
          {(isOperations || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Orders by Status</CardTitle>
                <CardDescription>Current order pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ordersByStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="status" type="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ORDER_COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lists Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Critical Leads */}
          {(isSales || isAdmin) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display">Critical Leads</CardTitle>
                  <Badge variant="destructive">{criticalLeads.length}</Badge>
                </div>
                <CardDescription>Leads aging &gt;10 days - needs immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalLeads.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-success" />
                    No critical leads
                  </div>
                ) : (
                  criticalLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between rounded-lg border border-destructive/30 bg-critical-light p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{lead.customerName}</p>
                        <p className="text-xs text-muted-foreground">{lead.id} • {lead.mobile}</p>
                      </div>
                      <AgingBadge bucket={lead.agingBucket} days={lead.agingDays} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Delayed Orders */}
          {(isOperations || isAdmin) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display">Delayed Orders</CardTitle>
                  <Badge variant="destructive">{delayedOrders.length}</Badge>
                </div>
                <CardDescription>Orders past expected delivery date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {delayedOrders.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-success" />
                    No delayed orders
                  </div>
                ) : (
                  delayedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-destructive/30 bg-critical-light p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.id} • ₹{order.totalAmount.toLocaleString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display">Pending Tasks</CardTitle>
                <Badge variant="secondary">{pendingTasks.length}</Badge>
              </div>
              <CardDescription>Tasks requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-success" />
                  All tasks completed
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      task.status === 'Overdue' ? 'border-destructive/30 bg-critical-light' : 'bg-card'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{task.customerName}</p>
                      <p className="text-xs text-muted-foreground">{task.type} • {task.remarks}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
