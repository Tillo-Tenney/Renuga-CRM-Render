import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgingBadge } from '@/components/ui/aging-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users, ShoppingCart, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const AgingTrackerPage = () => {
  const { leads, orders } = useCRM();
  const [activeTab, setActiveTab] = useState('leads');

  // Filter active leads and sort by aging (Critical first)
  const agingLeads = leads
    .filter((l) => !['Won', 'Lost'].includes(l.status))
    .sort((a, b) => {
      const bucketOrder = { Critical: 0, 'At Risk': 1, Warm: 2, Fresh: 3 };
      return bucketOrder[a.agingBucket] - bucketOrder[b.agingBucket];
    });

  // Filter active orders and sort by delayed first
  const agingOrders = orders
    .filter((o) => !['Delivered', 'Cancelled'].includes(o.status))
    .sort((a, b) => {
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      return b.agingDays - a.agingDays;
    });

  const criticalLeads = agingLeads.filter((l) => l.agingBucket === 'Critical');
  const atRiskLeads = agingLeads.filter((l) => l.agingBucket === 'At Risk');
  const delayedOrders = agingOrders.filter((o) => o.isDelayed);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Aging Tracker" subtitle="Monitor leads and orders by urgency" />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-critical">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Leads</p>
                  <p className="text-3xl font-bold">{criticalLeads.length}</p>
                </div>
                <div className="p-3 bg-critical-light rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At Risk Leads</p>
                  <p className="text-3xl font-bold">{atRiskLeads.length}</p>
                </div>
                <div className="p-3 bg-orange-light rounded-lg">
                  <Users className="h-6 w-6 text-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delayed Orders</p>
                  <p className="text-3xl font-bold">{delayedOrders.length}</p>
                </div>
                <div className="p-3 bg-critical-light rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-3xl font-bold">{agingOrders.length}</p>
                </div>
                <div className="p-3 bg-primary-light rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" />
              Lead Aging
              {criticalLeads.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {criticalLeads.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Aging
              {delayedOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {delayedOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Lead Aging Tab */}
          <TabsContent value="leads" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Aging List</CardTitle>
                <CardDescription>
                  Sorted by urgency: Critical → At Risk → Warm → Fresh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aging Days</TableHead>
                      <TableHead>Last Follow-up</TableHead>
                      <TableHead>Next Follow-up</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingLeads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className={cn(
                          lead.agingBucket === 'Critical' && 'bg-critical-light',
                          lead.agingBucket === 'At Risk' && 'bg-orange-light'
                        )}
                      >
                        <TableCell className="font-medium">{lead.id}</TableCell>
                        <TableCell className="font-medium">{lead.customerName}</TableCell>
                        <TableCell>{lead.mobile}</TableCell>
                        <TableCell>
                          <StatusBadge status={lead.status} />
                        </TableCell>
                        <TableCell>
                          <AgingBadge bucket={lead.agingBucket} days={lead.agingDays} />
                        </TableCell>
                        <TableCell>
                          {lead.lastFollowUp
                            ? format(new Date(lead.lastFollowUp), 'dd MMM yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {lead.nextFollowUp
                            ? format(new Date(lead.nextFollowUp), 'dd MMM yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>{lead.assignedTo}</TableCell>
                      </TableRow>
                    ))}
                    {agingLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No active leads to track
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Aging Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Aging List</CardTitle>
                <CardDescription>
                  Delayed orders highlighted in red. Sorted by delay status and aging days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aging Days</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Delay Indicator</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={cn(order.isDelayed && 'row-delayed')}
                      >
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.mobile}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.agingDays} days</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.expectedDeliveryDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          {order.isDelayed ? (
                            <div className="flex items-center gap-1 text-destructive font-medium">
                              <AlertTriangle className="h-4 w-4" />
                              Yes
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell>{order.assignedTo}</TableCell>
                      </TableRow>
                    ))}
                    {agingOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No active orders to track
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgingTrackerPage;
