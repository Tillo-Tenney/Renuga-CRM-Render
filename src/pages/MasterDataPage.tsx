import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  Package,
  Users,
  User,
  Edit,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Product, User as UserType, Customer } from '@/data/mockData';

const MasterDataPage = () => {
  const { 
    products, customers, users, 
    addCustomer, updateCustomer,
    addProduct, updateProduct,
    addUser, updateUser,
    addRemarkLog, getRemarkLogs,
    currentUser 
  } = useCRM();
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customer Dialog
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    remark: '',
  });

  // Product Dialog
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Roofing Sheet' as Product['category'],
    unit: '',
    price: '',
    availableQuantity: '',
    thresholdQuantity: '',
    remark: '',
  });

  // User Dialog
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Front Desk' as UserType['role'],
    isActive: true,
    remark: '',
  });

  // Remark History Dialog
  const [isRemarkHistoryOpen, setIsRemarkHistoryOpen] = useState(false);
  const [remarkHistoryType, setRemarkHistoryType] = useState<'product' | 'customer' | 'user'>('product');
  const [remarkHistoryId, setRemarkHistoryId] = useState('');
  const [remarkHistoryTitle, setRemarkHistoryTitle] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm)
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetCustomerForm = () => {
    setCustomerForm({ name: '', mobile: '', email: '', address: '', remark: '' });
    setIsEditingCustomer(false);
    setEditingCustomerId(null);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', category: 'Roofing Sheet', unit: '', price: '', availableQuantity: '', thresholdQuantity: '', remark: '' });
    setIsEditingProduct(false);
    setEditingProductId(null);
  };

  const resetUserForm = () => {
    setUserForm({ name: '', email: '', role: 'Front Desk', isActive: true, remark: '' });
    setIsEditingUser(false);
    setEditingUserId(null);
  };

  const openEditCustomer = (customer: Customer) => {
    setCustomerForm({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      address: customer.address || '',
      remark: '',
    });
    setIsEditingCustomer(true);
    setEditingCustomerId(customer.id);
    setIsCustomerDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price.toString(),
      availableQuantity: product.availableQuantity.toString(),
      thresholdQuantity: product.thresholdQuantity.toString(),
      remark: '',
    });
    setIsEditingProduct(true);
    setEditingProductId(product.id);
    setIsProductDialogOpen(true);
  };

  const openEditUser = (user: UserType) => {
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      remark: '',
    });
    setIsEditingUser(true);
    setEditingUserId(user.id);
    setIsUserDialogOpen(true);
  };

  const openRemarkHistory = (type: 'product' | 'customer' | 'user', id: string, title: string) => {
    setRemarkHistoryType(type);
    setRemarkHistoryId(id);
    setRemarkHistoryTitle(title);
    setIsRemarkHistoryOpen(true);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.mobile) {
      toast.error('Name and mobile are required');
      return;
    }
    if (!customerForm.remark.trim()) {
      toast.error('Remark is mandatory');
      return;
    }

    if (isEditingCustomer && editingCustomerId) {
      updateCustomer(editingCustomerId, {
        name: customerForm.name,
        mobile: customerForm.mobile,
        email: customerForm.email || undefined,
        address: customerForm.address || undefined,
      });
      addRemarkLog('customer', editingCustomerId, customerForm.remark);
      toast.success('Customer updated successfully!');
    } else {
      const newCustomer = addCustomer({
        name: customerForm.name,
        mobile: customerForm.mobile,
        email: customerForm.email || undefined,
        address: customerForm.address || undefined,
      });
      addRemarkLog('customer', newCustomer.id, customerForm.remark);
      toast.success('Customer added successfully!');
    }
    setIsCustomerDialogOpen(false);
    resetCustomerForm();
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.unit || !productForm.price || !productForm.availableQuantity || !productForm.thresholdQuantity) {
      toast.error('All fields are required');
      return;
    }
    if (!productForm.remark.trim()) {
      toast.error('Remark is mandatory');
      return;
    }

    if (isEditingProduct && editingProductId) {
      updateProduct(editingProductId, {
        name: productForm.name,
        category: productForm.category,
        unit: productForm.unit,
        price: parseFloat(productForm.price),
        availableQuantity: parseFloat(productForm.availableQuantity),
        thresholdQuantity: parseFloat(productForm.thresholdQuantity),
      });
      addRemarkLog('product', editingProductId, productForm.remark);
      toast.success('Product updated successfully!');
    } else {
      const newProduct = addProduct({
        name: productForm.name,
        category: productForm.category,
        unit: productForm.unit,
        price: parseFloat(productForm.price),
        availableQuantity: parseFloat(productForm.availableQuantity),
        thresholdQuantity: parseFloat(productForm.thresholdQuantity),
        isActive: true,
      });
      addRemarkLog('product', newProduct.id, productForm.remark);
      toast.success('Product added successfully!');
    }
    setIsProductDialogOpen(false);
    resetProductForm();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!userForm.remark.trim()) {
      toast.error('Remark is mandatory');
      return;
    }

    if (isEditingUser && editingUserId) {
      updateUser(editingUserId, {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        isActive: userForm.isActive,
      });
      addRemarkLog('user', editingUserId, userForm.remark);
      toast.success('User updated successfully!');
    } else {
      if (users.some(u => u.email.toLowerCase() === userForm.email.toLowerCase())) {
        toast.error('User with this email already exists');
        return;
      }
      const newUser = addUser({
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        isActive: true,
      });
      addRemarkLog('user', newUser.id, userForm.remark);
      toast.success('User added successfully! Default password: password123');
    }
    setIsUserDialogOpen(false);
    resetUserForm();
  };

  const getStatusBadgeVariant = (status: Product['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Alert': return 'secondary';
      case 'Out of Stock': return 'destructive';
    }
  };

  const remarkHistory = getRemarkLogs(remarkHistoryType, remarkHistoryId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Master Data" subtitle="Manage products, customers, and users" />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer" onClick={() => setActiveTab('products')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-3xl font-bold">{products.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {products.filter(p => p.status === 'Alert').length} on alert
                  </p>
                </div>
                <div className="p-3 bg-primary-light rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer" onClick={() => setActiveTab('customers')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-3xl font-bold">{customers.length}</p>
                </div>
                <div className="p-3 bg-success-light rounded-lg">
                  <Users className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer" onClick={() => setActiveTab('users')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="p-3 bg-warning-light rounded-lg">
                  <User className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            {activeTab === 'products' && (
              <Dialog open={isProductDialogOpen} onOpenChange={(open) => { if (!open) resetProductForm(); setIsProductDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{isEditingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>{isEditingProduct ? 'Update product details' : 'Create a new product in the catalog'}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Product name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) => setProductForm({ ...productForm, category: value as Product['category'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Roofing Sheet">Roofing Sheet</SelectItem>
                          <SelectItem value="Tile">Tile</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Unit *</Label>
                        <Input
                          value={productForm.unit}
                          onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                          placeholder="e.g., Sq.ft, Piece, Kg"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (₹) *</Label>
                        <Input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="Price per unit"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Available Qty (KG) *</Label>
                        <Input
                          type="number"
                          value={productForm.availableQuantity}
                          onChange={(e) => setProductForm({ ...productForm, availableQuantity: e.target.value })}
                          placeholder="Available quantity"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Threshold Qty *</Label>
                        <Input
                          type="number"
                          value={productForm.thresholdQuantity}
                          onChange={(e) => setProductForm({ ...productForm, thresholdQuantity: e.target.value })}
                          placeholder="Alert threshold"
                          required
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                      Status will be auto-calculated: Active (above threshold), Alert (at/below threshold), Out of Stock (zero)
                    </div>
                    <div className="space-y-2">
                      <Label>Remark * (Mandatory)</Label>
                      <Textarea
                        value={productForm.remark}
                        onChange={(e) => setProductForm({ ...productForm, remark: e.target.value })}
                        placeholder="Add remark for this action..."
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => { resetProductForm(); setIsProductDialogOpen(false); }}>
                        Cancel
                      </Button>
                      <Button type="submit">{isEditingProduct ? 'Update' : 'Add'} Product</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === 'customers' && (
              <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => { if (!open) resetCustomerForm(); setIsCustomerDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isEditingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    <DialogDescription>{isEditingCustomer ? 'Update customer details' : 'Create a new customer record'}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCustomer} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        placeholder="Customer name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile *</Label>
                      <Input
                        value={customerForm.mobile}
                        onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                        placeholder="Mobile number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        placeholder="Email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        placeholder="Full address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Remark * (Mandatory)</Label>
                      <Textarea
                        value={customerForm.remark}
                        onChange={(e) => setCustomerForm({ ...customerForm, remark: e.target.value })}
                        placeholder="Add remark for this action..."
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => { resetCustomerForm(); setIsCustomerDialogOpen(false); }}>
                        Cancel
                      </Button>
                      <Button type="submit">{isEditingCustomer ? 'Update' : 'Add'} Customer</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === 'users' && (
              <Dialog open={isUserDialogOpen} onOpenChange={(open) => { if (!open) resetUserForm(); setIsUserDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isEditingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>{isEditingUser ? 'Update user details' : 'Create a new user account'}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="Email address"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Select
                        value={userForm.role}
                        onValueChange={(value) => setUserForm({ ...userForm, role: value as UserType['role'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Front Desk">Front Desk</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isEditingUser && (
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={userForm.isActive ? 'active' : 'inactive'}
                          onValueChange={(value) => setUserForm({ ...userForm, isActive: value === 'active' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {!isEditingUser && (
                      <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                        Default password will be set to: <strong>password123</strong>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Remark * (Mandatory)</Label>
                      <Textarea
                        value={userForm.remark}
                        onChange={(e) => setUserForm({ ...userForm, remark: e.target.value })}
                        placeholder="Add remark for this action..."
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => { resetUserForm(); setIsUserDialogOpen(false); }}>
                        Cancel
                      </Button>
                      <Button type="submit">{isEditingUser ? 'Update' : 'Add'} User</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Remark History Dialog */}
        <Dialog open={isRemarkHistoryOpen} onOpenChange={setIsRemarkHistoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Remark History - {remarkHistoryTitle}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <User className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Products Catalog</CardTitle>
                <CardDescription>Roofing sheets, tiles, and accessories with inventory tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Available Qty</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className={product.status === 'Alert' ? 'bg-warning/10' : product.status === 'Out of Stock' ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-medium">{product.id}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell className="font-medium">{product.availableQuantity}</TableCell>
                        <TableCell>{product.thresholdQuantity}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(product.status)}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openRemarkHistory('product', product.id, product.name)}>
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Database</CardTitle>
                <CardDescription>All registered customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Since</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.id}</TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.mobile}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell className="max-w-40 truncate">{customer.address || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.totalOrders}</Badge>
                        </TableCell>
                        <TableCell>₹{customer.totalValue.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(customer.createdAt), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditCustomer(customer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openRemarkHistory('customer', customer.id, customer.name)}>
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>System users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'Admin' ? 'default' : 'outline'}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.role === 'Admin' && (
                              <Badge variant="secondary" className="text-xs">All Access</Badge>
                            )}
                            {user.role === 'Front Desk' && (
                              <>
                                <Badge variant="secondary" className="text-xs">Calls</Badge>
                                <Badge variant="secondary" className="text-xs">Leads</Badge>
                              </>
                            )}
                            {user.role === 'Sales' && (
                              <>
                                <Badge variant="secondary" className="text-xs">Leads</Badge>
                                <Badge variant="secondary" className="text-xs">Orders</Badge>
                              </>
                            )}
                            {user.role === 'Operations' && (
                              <>
                                <Badge variant="secondary" className="text-xs">Orders</Badge>
                                <Badge variant="secondary" className="text-xs">Delivery</Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openRemarkHistory('user', user.id, user.name)}>
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default MasterDataPage;
