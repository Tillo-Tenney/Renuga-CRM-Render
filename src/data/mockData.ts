// Mock Data for Renuga Roofings CRM

// Remark log for tracking all comments with timestamp and user
export interface RemarkLog {
  id: string;
  entityType: 'callLog' | 'lead' | 'order' | 'product' | 'customer' | 'user';
  entityId: string;
  remark: string;
  createdBy: string;
  createdAt: Date;
}

export interface CallLog {
  id: string;
  callDate: Date;
  customerName: string;
  mobile: string;
  queryType: 'Price Inquiry' | 'Product Info' | 'Complaint' | 'Order Status' | 'General';
  productInterest: string;
  nextAction: 'Follow-up' | 'Lead Created' | 'Order Updated' | 'New Order' | 'No Action';
  followUpDate?: Date;
  remarks: string;
  assignedTo: string;
  status: 'Open' | 'Closed';
}

export interface Lead {
  id: string;
  callId: string;
  customerName: string;
  mobile: string;
  email?: string;
  address?: string;
  productInterest: string;
  plannedPurchaseQuantity?: number;
  status: 'New' | 'Contacted' | 'Quoted' | 'Negotiation' | 'Won' | 'Lost';
  createdDate: Date;
  agingDays: number;
  agingBucket: 'Fresh' | 'Warm' | 'At Risk' | 'Critical';
  lastFollowUp?: Date;
  nextFollowUp?: Date;
  assignedTo: string;
  estimatedValue?: number;
  remarks: string;
}

export interface Order {
  id: string;
  leadId?: string;
  callId?: string;
  customerName: string;
  mobile: string;
  deliveryAddress: string;
  products: OrderProduct[];
  totalAmount: number;
  status: 'Order Received' | 'In Production' | 'Ready for Delivery' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  agingDays: number;
  isDelayed: boolean;
  paymentStatus: 'Pending' | 'Partial' | 'Completed';
  invoiceNumber?: string;
  assignedTo: string;
  remarks: string;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Task {
  id: string;
  type: 'Follow-up' | 'Delivery' | 'Call Back' | 'Meeting';
  linkedTo: 'Lead' | 'Order' | 'Call';
  linkedId: string;
  customerName: string;
  dueDate: Date;
  status: 'Pending' | 'Done' | 'Overdue';
  assignedTo: string;
  remarks: string;
  createdAt: Date;
}

export interface ShiftNote {
  id: string;
  createdBy: string;
  createdAt: Date;
  content: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 'Roofing Sheet' | 'Tile' | 'Accessories';
  unit: string;
  price: number;
  availableQuantity: number;
  thresholdQuantity: number;
  status: 'Active' | 'Alert' | 'Out of Stock';
  isActive: boolean;
}

// Calculate product status based on available quantity and threshold
export const calculateProductStatus = (availableQuantity: number, thresholdQuantity: number): Product['status'] => {
  if (availableQuantity <= 0) return 'Out of Stock';
  if (availableQuantity <= thresholdQuantity) return 'Alert';
  return 'Active';
};

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  createdAt: Date;
  totalOrders: number;
  totalValue: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Front Desk' | 'Sales' | 'Operations';
  isActive: boolean;
}

// Calculate aging bucket based on days
export const getAgingBucket = (days: number): Lead['agingBucket'] => {
  if (days <= 2) return 'Fresh';
  if (days <= 5) return 'Warm';
  if (days <= 10) return 'At Risk';
  return 'Critical';
};

// Calculate aging days
export const calculateAgingDays = (date: Date): number => {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Mock Users
export const mockUsers: User[] = [
  { id: 'U001', name: 'Priya S.', email: 'priya@renuga.com', role: 'Front Desk', isActive: true },
  { id: 'U002', name: 'Ravi K.', email: 'ravi@renuga.com', role: 'Sales', isActive: true },
  { id: 'U003', name: 'Muthu R.', email: 'muthu@renuga.com', role: 'Operations', isActive: true },
  { id: 'U004', name: 'Admin', email: 'admin@renuga.com', role: 'Admin', isActive: true },
];

// Mock Products with quantity and threshold
export const mockProducts: Product[] = [
  { id: 'P001', name: 'Color Coated Roofing Sheet', category: 'Roofing Sheet', unit: 'Sq.ft', price: 45, availableQuantity: 5000, thresholdQuantity: 2500, status: 'Active', isActive: true },
  { id: 'P002', name: 'GI Plain Sheet', category: 'Roofing Sheet', unit: 'Sq.ft', price: 38, availableQuantity: 2000, thresholdQuantity: 2000, status: 'Alert', isActive: true },
  { id: 'P003', name: 'Polycarbonate Sheet', category: 'Roofing Sheet', unit: 'Sq.ft', price: 85, availableQuantity: 3000, thresholdQuantity: 1500, status: 'Active', isActive: true },
  { id: 'P004', name: 'Clay Roof Tile', category: 'Tile', unit: 'Piece', price: 12, availableQuantity: 800, thresholdQuantity: 1000, status: 'Alert', isActive: true },
  { id: 'P005', name: 'Cement Roof Tile', category: 'Tile', unit: 'Piece', price: 18, availableQuantity: 2500, thresholdQuantity: 1000, status: 'Active', isActive: true },
  { id: 'P006', name: 'Ridge Cap', category: 'Accessories', unit: 'Piece', price: 150, availableQuantity: 300, thresholdQuantity: 200, status: 'Active', isActive: true },
  { id: 'P007', name: 'Self Drilling Screw', category: 'Accessories', unit: 'Kg', price: 280, availableQuantity: 50, thresholdQuantity: 100, status: 'Alert', isActive: true },
  { id: 'P008', name: 'Turbo Ventilator', category: 'Accessories', unit: 'Piece', price: 1200, availableQuantity: 25, thresholdQuantity: 20, status: 'Active', isActive: true },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  { id: 'C001', name: 'Kumar', mobile: '9876543210', email: 'kumar@email.com', address: '45, Anna Nagar, Trichy', createdAt: new Date('2024-12-01'), totalOrders: 2, totalValue: 85000 },
  { id: 'C002', name: 'Raja', mobile: '9876543211', email: 'raja@email.com', address: '78, KK Nagar, Trichy', createdAt: new Date('2024-12-05'), totalOrders: 1, totalValue: 45000 },
  { id: 'C003', name: 'Senthil Builders', mobile: '9876543212', email: 'senthil@builders.com', address: '12, Thillai Nagar, Trichy', createdAt: new Date('2024-11-15'), totalOrders: 5, totalValue: 320000 },
  { id: 'C004', name: 'Lakshmi Constructions', mobile: '9876543213', address: '99, Woraiyur, Trichy', createdAt: new Date('2024-11-20'), totalOrders: 3, totalValue: 175000 },
  { id: 'C005', name: 'Murugan', mobile: '9876543214', address: '33, Srirangam, Trichy', createdAt: new Date('2024-12-10'), totalOrders: 1, totalValue: 28000 },
];

// Mock Call Logs
export const mockCallLogs: CallLog[] = [
  {
    id: 'CALL-001',
    callDate: new Date('2024-12-11T09:30:00'),
    customerName: 'Kumar',
    mobile: '9876543210',
    queryType: 'Price Inquiry',
    productInterest: 'Color Coated Roofing Sheet',
    nextAction: 'Lead Created',
    remarks: 'Interested in 500 sqft for new house construction',
    assignedTo: 'Priya S.',
    status: 'Closed'
  },
  {
    id: 'CALL-002',
    callDate: new Date('2024-12-12T10:15:00'),
    customerName: 'Raja',
    mobile: '9876543211',
    queryType: 'Order Status',
    productInterest: 'GI Plain Sheet',
    nextAction: 'Order Updated',
    remarks: 'Checking delivery status for existing order',
    assignedTo: 'Priya S.',
    status: 'Closed'
  },
  {
    id: 'CALL-003',
    callDate: new Date('2024-12-14T11:00:00'),
    customerName: 'Senthil Builders',
    mobile: '9876543212',
    queryType: 'Price Inquiry',
    productInterest: 'Polycarbonate Sheet',
    nextAction: 'Follow-up',
    followUpDate: new Date('2024-12-16T14:00:00'),
    remarks: 'Needs quote for large project - 2000 sqft',
    assignedTo: 'Ravi K.',
    status: 'Open'
  },
  {
    id: 'CALL-004',
    callDate: new Date('2024-12-15T09:00:00'),
    customerName: 'Lakshmi Constructions',
    mobile: '9876543213',
    queryType: 'Product Info',
    productInterest: 'Turbo Ventilator',
    nextAction: 'Follow-up',
    followUpDate: new Date('2024-12-15T16:00:00'),
    remarks: 'Inquiring about bulk purchase for new project',
    assignedTo: 'Ravi K.',
    status: 'Open'
  },
  {
    id: 'CALL-005',
    callDate: new Date('2024-12-15T10:30:00'),
    customerName: 'Murugan',
    mobile: '9876543214',
    queryType: 'Complaint',
    productInterest: 'Ridge Cap',
    nextAction: 'Follow-up',
    followUpDate: new Date('2024-12-15T15:00:00'),
    remarks: 'Minor issue with last delivery - missing 5 pieces',
    assignedTo: 'Muthu R.',
    status: 'Open'
  },
];

// Mock Leads
export const mockLeads: Lead[] = [
  {
    id: 'L-101',
    callId: 'CALL-001',
    customerName: 'Kumar',
    mobile: '9876543210',
    email: 'kumar@email.com',
    address: '45, Anna Nagar, Trichy',
    productInterest: 'Color Coated Roofing Sheet',
    plannedPurchaseQuantity: 500,
    status: 'Negotiation',
    createdDate: new Date('2024-12-11'),
    agingDays: 4,
    agingBucket: 'Warm',
    lastFollowUp: new Date('2024-12-14'),
    nextFollowUp: new Date('2024-12-16'),
    assignedTo: 'Ravi K.',
    estimatedValue: 25000,
    remarks: 'Price negotiation in progress'
  },
  {
    id: 'L-102',
    callId: 'CALL-003',
    customerName: 'Senthil Builders',
    mobile: '9876543212',
    email: 'senthil@builders.com',
    address: '12, Thillai Nagar, Trichy',
    productInterest: 'Polycarbonate Sheet',
    plannedPurchaseQuantity: 2000,
    status: 'Quoted',
    createdDate: new Date('2024-12-14'),
    agingDays: 1,
    agingBucket: 'Fresh',
    lastFollowUp: new Date('2024-12-14'),
    nextFollowUp: new Date('2024-12-16'),
    assignedTo: 'Ravi K.',
    estimatedValue: 170000,
    remarks: 'Quote sent for 2000 sqft'
  },
  {
    id: 'L-103',
    callId: 'CALL-004',
    customerName: 'Lakshmi Constructions',
    mobile: '9876543213',
    address: '99, Woraiyur, Trichy',
    productInterest: 'Turbo Ventilator',
    plannedPurchaseQuantity: 40,
    status: 'New',
    createdDate: new Date('2024-12-15'),
    agingDays: 0,
    agingBucket: 'Fresh',
    nextFollowUp: new Date('2024-12-16'),
    assignedTo: 'Ravi K.',
    estimatedValue: 48000,
    remarks: 'Bulk inquiry - 40 units'
  },
  {
    id: 'L-104',
    callId: 'CALL-010',
    customerName: 'Ganesh Housing',
    mobile: '9876543220',
    address: '55, Cantonment, Trichy',
    productInterest: 'Color Coated Roofing Sheet',
    plannedPurchaseQuantity: 2000,
    status: 'Contacted',
    createdDate: new Date('2024-12-03'),
    agingDays: 12,
    agingBucket: 'Critical',
    lastFollowUp: new Date('2024-12-10'),
    assignedTo: 'Ravi K.',
    estimatedValue: 95000,
    remarks: 'No response since last follow-up'
  },
  {
    id: 'L-105',
    callId: 'CALL-011',
    customerName: 'Arun Contractors',
    mobile: '9876543221',
    address: '22, Ponmalai, Trichy',
    productInterest: 'GI Plain Sheet',
    plannedPurchaseQuantity: 1500,
    status: 'New',
    createdDate: new Date('2024-12-08'),
    agingDays: 7,
    agingBucket: 'At Risk',
    nextFollowUp: new Date('2024-12-15'),
    assignedTo: 'Ravi K.',
    estimatedValue: 55000,
    remarks: 'Waiting for site measurement'
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'ORD-201',
    leadId: 'L-100',
    customerName: 'Raja',
    mobile: '9876543211',
    deliveryAddress: '78, KK Nagar, Trichy',
    products: [
      { productId: 'P002', productName: 'GI Plain Sheet', quantity: 800, unit: 'Sq.ft', unitPrice: 38, totalPrice: 30400 },
      { productId: 'P006', productName: 'Ridge Cap', quantity: 20, unit: 'Piece', unitPrice: 150, totalPrice: 3000 },
    ],
    totalAmount: 33400,
    status: 'Ready for Delivery',
    orderDate: new Date('2024-12-09'),
    expectedDeliveryDate: new Date('2024-12-14'),
    agingDays: 6,
    isDelayed: true,
    paymentStatus: 'Partial',
    invoiceNumber: 'INV-2024-201',
    assignedTo: 'Muthu R.',
    remarks: 'Pending final payment confirmation'
  },
  {
    id: 'ORD-202',
    customerName: 'Senthil Builders',
    mobile: '9876543212',
    deliveryAddress: '12, Thillai Nagar, Trichy',
    products: [
      { productId: 'P001', productName: 'Color Coated Roofing Sheet', quantity: 1500, unit: 'Sq.ft', unitPrice: 45, totalPrice: 67500 },
      { productId: 'P007', productName: 'Self Drilling Screw', quantity: 10, unit: 'Kg', unitPrice: 280, totalPrice: 2800 },
    ],
    totalAmount: 70300,
    status: 'In Production',
    orderDate: new Date('2024-12-12'),
    expectedDeliveryDate: new Date('2024-12-18'),
    agingDays: 3,
    isDelayed: false,
    paymentStatus: 'Pending',
    invoiceNumber: 'INV-2024-202',
    assignedTo: 'Muthu R.',
    remarks: 'Custom color - Sky Blue'
  },
  {
    id: 'ORD-203',
    customerName: 'Murugan',
    mobile: '9876543214',
    deliveryAddress: '33, Srirangam, Trichy',
    products: [
      { productId: 'P004', productName: 'Clay Roof Tile', quantity: 500, unit: 'Piece', unitPrice: 12, totalPrice: 6000 },
    ],
    totalAmount: 6000,
    status: 'Out for Delivery',
    orderDate: new Date('2024-12-13'),
    expectedDeliveryDate: new Date('2024-12-15'),
    agingDays: 2,
    isDelayed: false,
    paymentStatus: 'Completed',
    invoiceNumber: 'INV-2024-203',
    assignedTo: 'Muthu R.',
    remarks: 'Delivery in progress'
  },
  {
    id: 'ORD-204',
    customerName: 'Lakshmi Constructions',
    mobile: '9876543213',
    deliveryAddress: '99, Woraiyur, Trichy',
    products: [
      { productId: 'P003', productName: 'Polycarbonate Sheet', quantity: 600, unit: 'Sq.ft', unitPrice: 85, totalPrice: 51000 },
      { productId: 'P008', productName: 'Turbo Ventilator', quantity: 5, unit: 'Piece', unitPrice: 1200, totalPrice: 6000 },
    ],
    totalAmount: 57000,
    status: 'Order Received',
    orderDate: new Date('2024-12-15'),
    expectedDeliveryDate: new Date('2024-12-20'),
    agingDays: 0,
    isDelayed: false,
    paymentStatus: 'Pending',
    assignedTo: 'Muthu R.',
    remarks: 'New order - processing'
  },
  {
    id: 'ORD-205',
    customerName: 'Kumar',
    mobile: '9876543210',
    deliveryAddress: '45, Anna Nagar, Trichy',
    products: [
      { productId: 'P001', productName: 'Color Coated Roofing Sheet', quantity: 400, unit: 'Sq.ft', unitPrice: 45, totalPrice: 18000 },
    ],
    totalAmount: 18000,
    status: 'Delivered',
    orderDate: new Date('2024-12-01'),
    expectedDeliveryDate: new Date('2024-12-05'),
    actualDeliveryDate: new Date('2024-12-04'),
    agingDays: 14,
    isDelayed: false,
    paymentStatus: 'Completed',
    invoiceNumber: 'INV-2024-200',
    assignedTo: 'Muthu R.',
    remarks: 'Delivered on time'
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'T001',
    type: 'Follow-up',
    linkedTo: 'Lead',
    linkedId: 'L-101',
    customerName: 'Kumar',
    dueDate: new Date('2024-12-16T10:00:00'),
    status: 'Pending',
    assignedTo: 'Ravi K.',
    remarks: 'Discuss final pricing',
    createdAt: new Date('2024-12-14'),
  },
  {
    id: 'T002',
    type: 'Follow-up',
    linkedTo: 'Call',
    linkedId: 'CALL-003',
    customerName: 'Senthil Builders',
    dueDate: new Date('2024-12-16T14:00:00'),
    status: 'Pending',
    assignedTo: 'Ravi K.',
    remarks: 'Send revised quote',
    createdAt: new Date('2024-12-14'),
  },
  {
    id: 'T003',
    type: 'Follow-up',
    linkedTo: 'Call',
    linkedId: 'CALL-004',
    customerName: 'Lakshmi Constructions',
    dueDate: new Date('2024-12-15T16:00:00'),
    status: 'Pending',
    assignedTo: 'Ravi K.',
    remarks: 'Bulk pricing discussion',
    createdAt: new Date('2024-12-15'),
  },
  {
    id: 'T004',
    type: 'Call Back',
    linkedTo: 'Call',
    linkedId: 'CALL-005',
    customerName: 'Murugan',
    dueDate: new Date('2024-12-15T15:00:00'),
    status: 'Overdue',
    assignedTo: 'Muthu R.',
    remarks: 'Resolve delivery issue',
    createdAt: new Date('2024-12-15'),
  },
  {
    id: 'T005',
    type: 'Delivery',
    linkedTo: 'Order',
    linkedId: 'ORD-201',
    customerName: 'Raja',
    dueDate: new Date('2024-12-14T09:00:00'),
    status: 'Overdue',
    assignedTo: 'Muthu R.',
    remarks: 'Pending delivery - awaiting payment',
    createdAt: new Date('2024-12-09'),
  },
];

// Mock Shift Notes
export const mockShiftNotes: ShiftNote[] = [
  {
    id: 'SN001',
    createdBy: 'Priya S.',
    createdAt: new Date('2024-12-15T14:00:00'),
    content: 'Morning shift update:\n- 3 new calls received\n- Kumar lead moved to Negotiation\n- ORD-201 ready for delivery but payment pending\n- Murugan complained about missing ridge caps - urgent follow-up needed',
    isActive: true,
  },
  {
    id: 'SN002',
    createdBy: 'Ravi K.',
    createdAt: new Date('2024-12-14T18:00:00'),
    content: 'Evening shift:\n- Sent quotes to Senthil Builders\n- Ganesh Housing not responding - mark as critical\n- Production team confirmed ORD-202 will be ready by 18th',
    isActive: false,
  },
];

// Mock Remark Logs
export const mockRemarkLogs: RemarkLog[] = [
  {
    id: 'RL001',
    entityType: 'order',
    entityId: 'ORD-201',
    remark: 'Pending final payment confirmation',
    createdBy: 'Muthu R.',
    createdAt: new Date('2024-12-09T10:00:00'),
  },
  {
    id: 'RL002',
    entityType: 'lead',
    entityId: 'L-101',
    remark: 'Price negotiation in progress',
    createdBy: 'Ravi K.',
    createdAt: new Date('2024-12-11T14:00:00'),
  },
  {
    id: 'RL003',
    entityType: 'lead',
    entityId: 'L-101',
    remark: 'Customer requesting 5% discount',
    createdBy: 'Ravi K.',
    createdAt: new Date('2024-12-14T10:00:00'),
  },
];
