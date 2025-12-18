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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Plus,
  Trash2,
  History,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Order, OrderProduct } from '@/data/mockData';
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
  const { orders, addOrder, updateOrder, products, users, customers, currentUser, addRemarkLog, getRemarkLogs } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // New Order Dialog
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    mobile: '',
    deliveryAddress: '',
    expectedDeliveryDate: '',
    remarks: '',
  });
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState('');

  // Edit Order
  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState<Partial<Order>>({});
  const [editOrderProducts, setEditOrderProducts] = useState<OrderProduct[]>([]);
  const [originalProducts, setOriginalProducts] = useState<OrderProduct[]>([]);

  // Remark History
  const [isRemarkHistoryOpen, setIsRemarkHistoryOpen] = useState(false);
  const [remarkHistoryOrderId, setRemarkHistoryOrderId] = useState('');

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mobile.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMobileChange = (mobile: string) => {
    setNewOrderForm({ ...newOrderForm, mobile });
    const customer = customers.find(c => c.mobile === mobile);
    if (customer) {
      setNewOrderForm(prev => ({ 
        ...prev, 
        mobile, 
        customerName: customer.name,
        deliveryAddress: customer.address || '',
      }));
    }
  };

  const addProductToOrder = (isEdit = false) => {
    if (!selectedProductId || !productQuantity) {
      toast.error('Select product and quantity');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const quantity = parseFloat(productQuantity);
    const totalPrice = quantity * product.price;

    const newProduct: OrderProduct = {
      productId: product.id,
      productName: product.name,
      quantity,
      unit: product.unit,
      unitPrice: product.price,
      totalPrice,
    };

    if (isEdit) {
      setEditOrderProducts(prev => [...prev, newProduct]);
    } else {
      setOrderProducts(prev => [...prev, newProduct]);
    }
    setSelectedProductId('');
    setProductQuantity('');
  };

  const removeProductFromOrder = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditOrderProducts(prev => prev.filter((_, i) => i !== index));
    } else {
      setOrderProducts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const resetNewOrderForm = () => {
    setNewOrderForm({
      customerName: '',
      mobile: '',
      deliveryAddress: '',
      expectedDeliveryDate: '',
      remarks: '',
    });
    setOrderProducts([]);
    setSelectedProductId('');
    setProductQuantity('');
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOrderForm.customerName || !newOrderForm.mobile || !newOrderForm.deliveryAddress || !newOrderForm.expectedDeliveryDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!newOrderForm.remarks.trim()) {
      toast.error('Remark is mandatory');
      return;
    }
    if (orderProducts.length === 0) {
      toast.error('Add at least one product to the order');
      return;
    }

    const totalAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    
    addOrder({
      customerName: newOrderForm.customerName,
      mobile: newOrderForm.mobile,
      deliveryAddress: newOrderForm.deliveryAddress,
      products: orderProducts,
      totalAmount,
      status: 'Order Received',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(newOrderForm.expectedDeliveryDate),
      paymentStatus: 'Pending',
      assignedTo: users.find(u => u.role === 'Operations')?.name || currentUser.name,
      remarks: newOrderForm.remarks,
    });

    toast.success('Order created successfully!');
    setIsNewOrderOpen(false);
    resetNewOrderForm();
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsEditMode(false);
    setIsDetailOpen(true);
  };

  const startEditOrder = () => {
    if (!selectedOrder) return;
    setIsEditMode(true);
    setEditOrderForm({
      customerName: selectedOrder.customerName,
      mobile: selectedOrder.mobile,
      deliveryAddress: selectedOrder.deliveryAddress,
      status: selectedOrder.status,
      paymentStatus: selectedOrder.paymentStatus,
      expectedDeliveryDate: selectedOrder.expectedDeliveryDate,
      remarks: '',
    });
    setEditOrderProducts([...selectedOrder.products]);
    setOriginalProducts([...selectedOrder.products]);
  };

  const handleUpdateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    if (!editOrderForm.remarks?.trim()) {
      toast.error('Remark is mandatory');
      return;
    }
    if (editOrderProducts.length === 0) {
      toast.error('Order must have at least one product');
      return;
    }

    const totalAmount = editOrderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    const updateData: Partial<Order> = {
      ...editOrderForm,
      products: editOrderProducts,
      totalAmount,
    };

    if (editOrderForm.status === 'Delivered') {
      updateData.actualDeliveryDate = new Date();
    }

    updateOrder(selectedOrder.id, updateData, originalProducts);
    addRemarkLog('order', selectedOrder.id, editOrderForm.remarks || '');
    
    setSelectedOrder({ ...selectedOrder, ...updateData, products: editOrderProducts, totalAmount });
    toast.success('Order updated successfully!');
    setIsEditMode(false);
  };

  const handleQuickStatusChange = (newStatus: Order['status']) => {
    if (!selectedOrder) return;
    
    const updateData: Partial<Order> = { status: newStatus };
    if (newStatus === 'Delivered') {
      updateData.actualDeliveryDate = new Date();
    }
    updateOrder(selectedOrder.id, updateData);
    addRemarkLog('order', selectedOrder.id, `Status changed to ${newStatus}`);
    setSelectedOrder({ ...selectedOrder, ...updateData });
    toast.success(`Order status updated to ${newStatus}`);
  };

  const handlePaymentStatusChange = (newStatus: Order['paymentStatus']) => {
    if (!selectedOrder) return;
    updateOrder(selectedOrder.id, { paymentStatus: newStatus });
    addRemarkLog('order', selectedOrder.id, `Payment status changed to ${newStatus}`);
    setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
    toast.success('Payment status updated');
  };

  const openRemarkHistory = (orderId: string) => {
    setRemarkHistoryOrderId(orderId);
    setIsRemarkHistoryOpen(true);
  };

  const remarkHistory = getRemarkLogs('order', remarkHistoryOrderId || (selectedOrder?.id || ''));
  const totalNewOrderAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalEditOrderAmount = editOrderProducts.reduce((sum, p) => sum + p.totalPrice, 0);

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

        {/* Search Bar & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsNewOrderOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Make New Order
          </Button>
        </div>

        {/* New Order Dialog */}
        <Dialog open={isNewOrderOpen} onOpenChange={(open) => { if (!open) resetNewOrderForm(); setIsNewOrderOpen(open); }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Create New Order
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={newOrderForm.mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder="Enter mobile"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delivery Address *</Label>
                  <Input
                    value={newOrderForm.deliveryAddress}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, deliveryAddress: e.target.value })}
                    placeholder="Full delivery address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery Date *</Label>
                  <Input
                    type="date"
                    value={newOrderForm.expectedDeliveryDate}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, expectedDeliveryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Add Products */}
              <div className="space-y-2">
                <Label>Add Products</Label>
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter(p => p.status !== 'Out of Stock').map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (₹{product.price}/{product.unit}) - Avl: {product.availableQuantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(e.target.value)}
                    className="w-24"
                  />
                  <Button type="button" variant="outline" onClick={() => addProductToOrder(false)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Order Products List */}
              {orderProducts.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell className="text-right">{product.quantity} {product.unit}</TableCell>
                          <TableCell className="text-right">₹{product.unitPrice}</TableCell>
                          <TableCell className="text-right">₹{product.totalPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeProductFromOrder(index, false)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                        <TableCell className="text-right font-bold">₹{totalNewOrderAmount.toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="space-y-2">
                <Label>Remark * (Mandatory)</Label>
                <Textarea
                  value={newOrderForm.remarks}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, remarks: e.target.value })}
                  placeholder="Add order notes..."
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { resetNewOrderForm(); setIsNewOrderOpen(false); }}>
                  Cancel
                </Button>
                <Button type="submit">Create Order</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
        <Dialog open={isDetailOpen} onOpenChange={(open) => { if (!open) { setIsEditMode(false); } setIsDetailOpen(open); }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && !isEditMode && (
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

                  {/* Quick Status Update */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Quick Update</h4>
                    <div className="flex gap-4">
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => handleQuickStatusChange(value as Order['status'])}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...orderStatuses, 'Cancelled' as const].map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedOrder.paymentStatus}
                        onValueChange={(value) => handlePaymentStatusChange(value as Order['paymentStatus'])}
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-muted-foreground">Remarks</h4>
                      <Button variant="ghost" size="sm" onClick={() => openRemarkHistory(selectedOrder.id)} className="gap-1">
                        <History className="h-4 w-4" />
                        View History
                      </Button>
                    </div>
                    {selectedOrder.remarks && (
                      <p className="text-sm bg-muted p-3 rounded-lg">{selectedOrder.remarks}</p>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                  <Button variant="outline" onClick={startEditOrder} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Order
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Edit Mode */}
            {selectedOrder && isEditMode && (
              <>
                <DialogHeader>
                  <DialogTitle>Edit Order - {selectedOrder.id}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input
                        value={editOrderForm.customerName}
                        onChange={(e) => setEditOrderForm({ ...editOrderForm, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile</Label>
                      <Input
                        value={editOrderForm.mobile}
                        onChange={(e) => setEditOrderForm({ ...editOrderForm, mobile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Address</Label>
                    <Input
                      value={editOrderForm.deliveryAddress}
                      onChange={(e) => setEditOrderForm({ ...editOrderForm, deliveryAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editOrderForm.status}
                        onValueChange={(value) => setEditOrderForm({ ...editOrderForm, status: value as Order['status'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...orderStatuses, 'Cancelled' as const].map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select
                        value={editOrderForm.paymentStatus}
                        onValueChange={(value) => setEditOrderForm({ ...editOrderForm, paymentStatus: value as Order['paymentStatus'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Partial">Partial</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Edit Products */}
                  <div className="space-y-2">
                    <Label>Products</Label>
                    <div className="flex gap-2">
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Add product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.status !== 'Out of Stock').map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} (₹{product.price}/{product.unit}) - Avl: {product.availableQuantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(e.target.value)}
                        className="w-24"
                      />
                      <Button type="button" variant="outline" onClick={() => addProductToOrder(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {editOrderProducts.length > 0 && (
                      <div className="border rounded-lg">
                        <Table>
                          <TableBody>
                            {editOrderProducts.map((product, index) => (
                              <TableRow key={index}>
                                <TableCell className="py-2">{product.productName}</TableCell>
                                <TableCell className="py-2 text-right">{product.quantity} {product.unit}</TableCell>
                                <TableCell className="py-2 text-right">₹{product.totalPrice.toLocaleString()}</TableCell>
                                <TableCell className="py-2">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeProductFromOrder(index, true)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={2} className="text-right font-medium py-2">Total</TableCell>
                              <TableCell className="text-right font-bold py-2">₹{totalEditOrderAmount.toLocaleString()}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Remark * (Mandatory)</Label>
                    <Textarea
                      value={editOrderForm.remarks || ''}
                      onChange={(e) => setEditOrderForm({ ...editOrderForm, remarks: e.target.value })}
                      placeholder="Add update notes..."
                      required
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Remark History Dialog */}
        <Dialog open={isRemarkHistoryOpen} onOpenChange={setIsRemarkHistoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Remark History
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {remarkHistory.length > 0 ? remarkHistory.map((log) => (
                  <div key={log.id} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{log.remark}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>{log.createdBy}</span>
                      <span>{format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-4">No remarks found</p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrdersPage;
