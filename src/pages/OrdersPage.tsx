import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Order } from '@/data/mockData';
import { cn } from '@/lib/utils';

const orderStatuses: Order['status'][] = [
  'Order Received',
  'In Production',
  'Ready for Delivery',
  'Out for Delivery',
  'Delivered',
];

const getStatusProgress = (status: Order['status']): number => {
  const index = orderStatuses.indexOf(status);
  if (index === -1) return 0;
  return ((index + 1) / orderStatuses.length) * 100;
};

const getStatusIcon = (status: Order['status'], isActive: boolean, isCompleted: boolean) => {
  const className = cn(
    'h-5 w-5',
    isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-muted-foreground'
  );

  switch (status) {
    case 'Order Received':
      return <FileText className={className} />;
    case 'In Production':
      return <Package className={className} />;
    case 'Ready for Delivery':
      return <CheckCircle className={className} />;
    case 'Out for Delivery':
      return <Truck className={className} />;
    case 'Delivered':
      return <CheckCircle className={className} />;
    default:
      return <Package className={className} />;
  }
};

const OrdersPage = () => {
  const { orders, updateOrder } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mobile.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    const updateData: Partial<Order> = { status: newStatus };
    if (newStatus === 'Delivered') {
      updateData.actualDeliveryDate = new Date();
    }
    updateOrder(orderId, updateData);
    toast.success(`Order status updated to ${newStatus}`);
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Orders" subtitle="Track and manage customer orders" />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {orderStatuses.map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <Card key={status}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{status}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Orders Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Delayed?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    'cursor-pointer',
                    order.isDelayed && 'row-delayed'
                  )}
                  onClick={() => openOrderDetail(order)}
                >
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.mobile}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-40">
                      {order.products.slice(0, 2).map((p, i) => (
                        <p key={i} className="text-sm truncate">{p.productName}</p>
                      ))}
                      {order.products.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.products.length - 2} more
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{order.totalAmount.toLocaleString()}
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
                    <StatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    {order.isDelayed ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Yes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Order Details - {selectedOrder.id}</DialogTitle>
                    {selectedOrder.isDelayed && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Delayed
                      </Badge>
                    )}
                  </div>
                  <DialogDescription>
                    Ordered on {format(new Date(selectedOrder.orderDate), 'dd MMM yyyy')}
                    {selectedOrder.invoiceNumber && ` • Invoice: ${selectedOrder.invoiceNumber}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Status Progress */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Order Progress</h4>
                    <Progress value={getStatusProgress(selectedOrder.status)} className="h-2" />
                    <div className="flex justify-between">
                      {orderStatuses.map((status) => {
                        const currentIndex = orderStatuses.indexOf(selectedOrder.status);
                        const statusIndex = orderStatuses.indexOf(status);
                        const isCompleted = statusIndex < currentIndex;
                        const isActive = statusIndex === currentIndex;

                        return (
                          <div
                            key={status}
                            className={cn(
                              'flex flex-col items-center gap-1 text-center',
                              isCompleted && 'text-success',
                              isActive && 'text-primary',
                              !isCompleted && !isActive && 'text-muted-foreground'
                            )}
                          >
                            {getStatusIcon(status, isActive, isCompleted)}
                            <span className="text-xs max-w-16">{status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer & Delivery Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Customer</h4>
                      <div className="space-y-2">
                        <p className="font-medium">{selectedOrder.customerName}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedOrder.mobile}
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          {selectedOrder.deliveryAddress}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Delivery</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Expected: {format(new Date(selectedOrder.expectedDeliveryDate), 'dd MMM yyyy')}
                        </div>
                        {selectedOrder.actualDeliveryDate && (
                          <div className="flex items-center gap-2 text-sm text-success">
                            <CheckCircle className="h-4 w-4" />
                            Delivered: {format(new Date(selectedOrder.actualDeliveryDate), 'dd MMM yyyy')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Payment: <StatusBadge status={selectedOrder.paymentStatus} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Products</h4>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.products.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>{product.productName}</TableCell>
                              <TableCell className="text-right">
                                {product.quantity} {product.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                ₹{product.unitPrice}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{product.totalPrice.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">
                              Total Amount
                            </TableCell>
                            <TableCell className="text-right font-bold text-lg">
                              ₹{selectedOrder.totalAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Update Status */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Update Status</h4>
                    <div className="flex gap-4">
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => {
                          handleStatusChange(selectedOrder.id, value as Order['status']);
                          setSelectedOrder({ ...selectedOrder, status: value as Order['status'] });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedOrder.paymentStatus}
                        onValueChange={(value) => {
                          updateOrder(selectedOrder.id, { paymentStatus: value as Order['paymentStatus'] });
                          setSelectedOrder({ ...selectedOrder, paymentStatus: value as Order['paymentStatus'] });
                          toast.success('Payment status updated');
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Payment Pending</SelectItem>
                          <SelectItem value="Partial">Partial Payment</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Remarks */}
                  {selectedOrder.remarks && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Remarks</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">{selectedOrder.remarks}</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrdersPage;
