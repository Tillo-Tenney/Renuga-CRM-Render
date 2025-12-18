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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Phone, ArrowRight, Edit, History, ShoppingCart, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CallLog, Order, OrderProduct } from '@/data/mockData';

const CallLogPage = () => {
  const { 
    callLogs, addCallLog, updateCallLog, 
    products, users, customers, currentUser, 
    addLead, addOrder, updateOrder, getOrdersByCustomer,
    addRemarkLog, getRemarkLogs 
  } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    queryType: 'Price Inquiry' as CallLog['queryType'],
    productInterest: '',
    nextAction: 'Follow-up' as CallLog['nextAction'],
    followUpDate: '',
    followUpTime: '',
    remarks: '',
    status: 'Open' as CallLog['status'],
    // Lead specific
    plannedPurchaseQuantity: '',
    // Order specific
    deliveryAddress: '',
    expectedDeliveryDate: '',
  });

  // Order products for new order
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState('');

  // Update order selection
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isUpdateOrderDialogOpen, setIsUpdateOrderDialogOpen] = useState(false);
  const [updateOrderForm, setUpdateOrderForm] = useState<Partial<Order>>({});

  // Remark History
  const [isRemarkHistoryOpen, setIsRemarkHistoryOpen] = useState(false);
  const [remarkHistoryCallId, setRemarkHistoryCallId] = useState('');

  const filteredLogs = callLogs.filter(
    (log) =>
      log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.mobile.includes(searchTerm) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      customerName: '',
      mobile: '',
      queryType: 'Price Inquiry',
      productInterest: '',
      nextAction: 'Follow-up',
      followUpDate: '',
      followUpTime: '',
      remarks: '',
      status: 'Open',
      plannedPurchaseQuantity: '',
      deliveryAddress: '',
      expectedDeliveryDate: '',
    });
    setOrderProducts([]);
    setSelectedProductId('');
    setProductQuantity('');
    setIsEditMode(false);
    setEditingCallId(null);
    setSelectedOrderId(null);
    setCustomerOrders([]);
  };

  const handleOpenDialog = (callLog?: CallLog) => {
    if (callLog) {
      setIsEditMode(true);
      setEditingCallId(callLog.id);
      setFormData({
        customerName: callLog.customerName,
        mobile: callLog.mobile,
        queryType: callLog.queryType,
        productInterest: callLog.productInterest,
        nextAction: callLog.nextAction,
        followUpDate: callLog.followUpDate ? format(new Date(callLog.followUpDate), 'yyyy-MM-dd') : '',
        followUpTime: callLog.followUpDate ? format(new Date(callLog.followUpDate), 'HH:mm') : '',
        remarks: callLog.remarks,
        status: callLog.status,
        plannedPurchaseQuantity: '',
        deliveryAddress: '',
        expectedDeliveryDate: '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleMobileChange = (mobile: string) => {
    setFormData({ ...formData, mobile });
    // Auto-fill customer name if exists
    const customer = customers.find(c => c.mobile === mobile);
    if (customer) {
      setFormData(prev => ({ ...prev, mobile, customerName: customer.name }));
    }
    // Load orders for Update Order action
    const orders = getOrdersByCustomer(mobile);
    setCustomerOrders(orders);
  };

  const addProductToOrder = () => {
    if (!selectedProductId || !productQuantity) {
      toast.error('Select product and quantity');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const quantity = parseFloat(productQuantity);
    const totalPrice = quantity * product.price;

    setOrderProducts(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      quantity,
      unit: product.unit,
      unitPrice: product.price,
      totalPrice,
    }]);
    setSelectedProductId('');
    setProductQuantity('');
  };

  const removeProductFromOrder = (index: number) => {
    setOrderProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.mobile) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!formData.remarks.trim()) {
      toast.error('Remark is mandatory');
      return;
    }

    if (formData.nextAction === 'Follow-up' && (!formData.followUpDate || !formData.followUpTime)) {
      toast.error('Follow-up date and time are required');
      return;
    }

    if (formData.nextAction === 'New Order') {
      if (orderProducts.length === 0) {
        toast.error('Add at least one product to the order');
        return;
      }
      if (!formData.deliveryAddress || !formData.expectedDeliveryDate) {
        toast.error('Delivery address and expected date are required for new order');
        return;
      }
    }

    if (isEditMode && editingCallId) {
      updateCallLog(editingCallId, {
        customerName: formData.customerName,
        mobile: formData.mobile,
        queryType: formData.queryType,
        productInterest: formData.productInterest,
        nextAction: formData.nextAction,
        followUpDate: formData.followUpDate && formData.followUpTime
          ? new Date(`${formData.followUpDate}T${formData.followUpTime}`)
          : undefined,
        remarks: formData.remarks,
        status: formData.status,
      });
      addRemarkLog('callLog', editingCallId, formData.remarks);
      toast.success('Call log updated successfully!');
    } else {
      const newCallLog = addCallLog({
        callDate: new Date(),
        customerName: formData.customerName,
        mobile: formData.mobile,
        queryType: formData.queryType,
        productInterest: formData.productInterest,
        nextAction: formData.nextAction,
        followUpDate: formData.followUpDate && formData.followUpTime
          ? new Date(`${formData.followUpDate}T${formData.followUpTime}`)
          : undefined,
        remarks: formData.remarks,
        assignedTo: currentUser.name,
        status: formData.nextAction === 'No Action' ? 'Closed' : 'Open',
      });

      // Handle different next actions
      if (formData.nextAction === 'Lead Created') {
        addLead({
          callId: newCallLog.id,
          customerName: formData.customerName,
          mobile: formData.mobile,
          productInterest: formData.productInterest,
          plannedPurchaseQuantity: formData.plannedPurchaseQuantity ? parseFloat(formData.plannedPurchaseQuantity) : undefined,
          status: 'New',
          createdDate: new Date(),
          assignedTo: users.find(u => u.role === 'Sales')?.name || currentUser.name,
          remarks: formData.remarks,
        });
        toast.success('Call logged & Lead created successfully!');
      } else if (formData.nextAction === 'New Order') {
        const totalAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
        addOrder({
          callId: newCallLog.id,
          customerName: formData.customerName,
          mobile: formData.mobile,
          deliveryAddress: formData.deliveryAddress,
          products: orderProducts,
          totalAmount,
          status: 'Order Received',
          orderDate: new Date(),
          expectedDeliveryDate: new Date(formData.expectedDeliveryDate),
          paymentStatus: 'Pending',
          assignedTo: users.find(u => u.role === 'Operations')?.name || currentUser.name,
          remarks: formData.remarks,
        });
        toast.success('Call logged & Order created successfully!');
      } else {
        toast.success('Call logged successfully!');
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const openUpdateOrderDialog = (order: Order) => {
    setSelectedOrderId(order.id);
    setUpdateOrderForm({
      status: order.status,
      paymentStatus: order.paymentStatus,
      expectedDeliveryDate: order.expectedDeliveryDate,
      deliveryAddress: order.deliveryAddress,
      remarks: order.remarks,
    });
    setOrderProducts([...order.products]);
    setIsUpdateOrderDialogOpen(true);
  };

  const handleUpdateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    
    if (!updateOrderForm.remarks?.trim()) {
      toast.error('Remark is mandatory');
      return;
    }

    const order = customerOrders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const totalAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    
    updateOrder(selectedOrderId, {
      ...updateOrderForm,
      products: orderProducts,
      totalAmount,
    }, order.products);
    
    addRemarkLog('order', selectedOrderId, updateOrderForm.remarks || '');
    toast.success('Order updated successfully!');
    setIsUpdateOrderDialogOpen(false);
    setSelectedOrderId(null);
    setOrderProducts([]);
  };

  const openRemarkHistory = (callId: string) => {
    setRemarkHistoryCallId(callId);
    setIsRemarkHistoryOpen(true);
  };

  const remarkHistory = getRemarkLogs('callLog', remarkHistoryCallId);

  const getActionBadgeVariant = (action: CallLog['nextAction']) => {
    switch (action) {
      case 'Lead Created': return 'default';
      case 'New Order': return 'default';
      case 'Order Updated': return 'secondary';
      case 'Follow-up': return 'outline';
      default: return 'secondary';
    }
  };

  const totalOrderAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Call Log" subtitle="Manage inbound calls and follow-ups" />

      <div className="flex-1 p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile or call ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Call Entry
          </Button>
        </div>

        {/* Call Log Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                {isEditMode ? 'Edit Call Log' : 'Log New Call'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update the call record details' : 'Record details of the inbound call for immediate action'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder="Enter mobile"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="queryType">Query Type</Label>
                  <Select
                    value={formData.queryType}
                    onValueChange={(value) => setFormData({ ...formData, queryType: value as CallLog['queryType'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Price Inquiry">Price Inquiry</SelectItem>
                      <SelectItem value="Product Info">Product Info</SelectItem>
                      <SelectItem value="Order Status">Order Status</SelectItem>
                      <SelectItem value="Complaint">Complaint</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productInterest">Product Interest</Label>
                  <Select
                    value={formData.productInterest}
                    onValueChange={(value) => setFormData({ ...formData, productInterest: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter(p => p.status !== 'Out of Stock').map((product) => (
                        <SelectItem key={product.id} value={product.name}>
                          {product.name} (₹{product.price}/{product.unit}) - Avl: {product.availableQuantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nextAction">Next Action</Label>
                  <Select
                    value={formData.nextAction}
                    onValueChange={(value) => setFormData({ ...formData, nextAction: value as CallLog['nextAction'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Lead Created">Create Lead</SelectItem>
                      <SelectItem value="New Order">New Order</SelectItem>
                      <SelectItem value="Order Updated">Update Order</SelectItem>
                      <SelectItem value="No Action">No Action Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isEditMode && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as CallLog['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Follow-up fields */}
              {formData.nextAction === 'Follow-up' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="followUpDate">Follow-up Date *</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followUpTime">Follow-up Time *</Label>
                    <Input
                      id="followUpTime"
                      type="time"
                      value={formData.followUpTime}
                      onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Lead Creation - Planned Purchase Quantity */}
              {formData.nextAction === 'Lead Created' && (
                <div className="space-y-2">
                  <Label htmlFor="plannedPurchaseQuantity">Planned Purchase Quantity</Label>
                  <Input
                    id="plannedPurchaseQuantity"
                    type="number"
                    value={formData.plannedPurchaseQuantity}
                    onChange={(e) => setFormData({ ...formData, plannedPurchaseQuantity: e.target.value })}
                    placeholder="Expected quantity for offer planning"
                  />
                </div>
              )}

              {/* New Order Fields */}
              {formData.nextAction === 'New Order' && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delivery Address *</Label>
                        <Input
                          value={formData.deliveryAddress}
                          onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                          placeholder="Full delivery address"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expected Delivery Date *</Label>
                        <Input
                          type="date"
                          value={formData.expectedDeliveryDate}
                          onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
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
                        <Button type="button" variant="outline" onClick={addProductToOrder}>
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
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeProductFromOrder(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                              <TableCell className="text-right font-bold">₹{totalOrderAmount.toLocaleString()}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Update Order Selection */}
              {formData.nextAction === 'Order Updated' && customerOrders.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Select Order to Update</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customerOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => openUpdateOrderDialog(order)}
                        >
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.products.map(p => p.productName).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{order.status}</Badge>
                            <p className="text-sm font-medium mt-1">₹{order.totalAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {formData.nextAction === 'Order Updated' && customerOrders.length === 0 && formData.mobile && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No orders found for this customer
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks * (Mandatory)</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Add notes for this call..."
                  rows={3}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  {isEditMode ? 'Update' : 'Save'} 
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Order Dialog */}
        <Dialog open={isUpdateOrderDialogOpen} onOpenChange={setIsUpdateOrderDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Update Order - {selectedOrderId}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={updateOrderForm.status}
                    onValueChange={(value) => setUpdateOrderForm({ ...updateOrderForm, status: value as Order['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Order Received">Order Received</SelectItem>
                      <SelectItem value="In Production">In Production</SelectItem>
                      <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                      <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={updateOrderForm.paymentStatus}
                    onValueChange={(value) => setUpdateOrderForm({ ...updateOrderForm, paymentStatus: value as Order['paymentStatus'] })}
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

              <div className="space-y-2">
                <Label>Delivery Address</Label>
                <Input
                  value={updateOrderForm.deliveryAddress || ''}
                  onChange={(e) => setUpdateOrderForm({ ...updateOrderForm, deliveryAddress: e.target.value })}
                />
              </div>

              {/* Order Products */}
              <div className="space-y-2">
                <Label>Products</Label>
                <div className="flex gap-2 mb-2">
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
                  <Button type="button" variant="outline" onClick={addProductToOrder}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {orderProducts.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    <Table>
                      <TableBody>
                        {orderProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="py-2">{product.productName}</TableCell>
                            <TableCell className="py-2 text-right">{product.quantity} {product.unit}</TableCell>
                            <TableCell className="py-2 text-right">₹{product.totalPrice.toLocaleString()}</TableCell>
                            <TableCell className="py-2">
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeProductFromOrder(index)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remark * (Mandatory)</Label>
                <Textarea
                  value={updateOrderForm.remarks || ''}
                  onChange={(e) => setUpdateOrderForm({ ...updateOrderForm, remarks: e.target.value })}
                  placeholder="Add update notes..."
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUpdateOrderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Order</Button>
              </DialogFooter>
            </form>
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

        {/* Call Logs Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Query Type</TableHead>
                <TableHead>Product Interest</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(log.callDate), 'dd MMM yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.callDate), 'HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{log.customerName}</TableCell>
                  <TableCell>{log.mobile}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.queryType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-32 truncate">{log.productInterest || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.nextAction)}>
                      {log.nextAction}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.assignedTo}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Open' ? 'secondary' : 'outline'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(log)} title="Edit call log">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openRemarkHistory(log.id)} title="View remarks">
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No call logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CallLogPage;
