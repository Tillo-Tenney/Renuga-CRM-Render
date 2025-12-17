import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  CallLog,
  Lead,
  Order,
  OrderProduct,
  Task,
  ShiftNote,
  Product,
  Customer,
  User,
  RemarkLog,
  mockCallLogs,
  mockLeads,
  mockOrders,
  mockTasks,
  mockShiftNotes,
  mockProducts,
  mockCustomers,
  mockUsers,
  mockRemarkLogs,
  getAgingBucket,
  calculateAgingDays,
  calculateProductStatus,
} from '@/data/mockData';
import {
  callLogsApi,
  leadsApi,
  ordersApi,
  productsApi,
  tasksApi,
  customersApi,
  usersApi,
  shiftNotesApi,
  remarkLogsApi,
} from '@/services/api';
import { toCamelCase, parseDates } from '@/utils/dataTransform';

interface CRMContextType {
  // Data
  callLogs: CallLog[];
  leads: Lead[];
  orders: Order[];
  tasks: Task[];
  shiftNotes: ShiftNote[];
  products: Product[];
  customers: Customer[];
  users: User[];
  remarkLogs: RemarkLog[];
  currentUser: User;
  
  // Actions
  addCallLog: (callLog: Omit<CallLog, 'id'>) => CallLog;
  updateCallLog: (id: string, data: Partial<CallLog>) => void;
  
  addLead: (lead: Omit<Lead, 'id' | 'agingDays' | 'agingBucket'>) => Lead;
  updateLead: (id: string, data: Partial<Lead>) => void;
  convertLeadToOrder: (leadId: string, orderData: Partial<Order>) => Order;
  
  addOrder: (order: Omit<Order, 'id' | 'agingDays' | 'isDelayed'>) => Order;
  updateOrder: (id: string, data: Partial<Order>, oldProducts?: OrderProduct[]) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  completeTask: (id: string) => void;
  
  addShiftNote: (content: string) => ShiftNote;
  updateShiftNote: (id: string, content: string) => void;
  clearShiftNote: (id: string) => void;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalValue'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'status'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  updateProductQuantity: (productId: string, quantityChange: number) => void;
  
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  
  // Remark logs
  addRemarkLog: (entityType: RemarkLog['entityType'], entityId: string, remark: string) => RemarkLog;
  getRemarkLogs: (entityType: RemarkLog['entityType'], entityId: string) => RemarkLog[];
  
  // Utilities
  getOrdersByCustomer: (mobile: string) => Order[];
  
  // Stats
  getStats: () => CRMStats;
}

interface CRMStats {
  callsToday: number;
  followUpsDueToday: number;
  newLeadsToday: number;
  activeLeads: number;
  criticalLeads: number;
  totalOrders: number;
  delayedOrders: number;
  todaysDeliveries: number;
  conversionRate: number;
  leadsByBucket: { bucket: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within CRMProvider');
  }
  return context;
};

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser: authUser, isAuthenticated } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>(mockCallLogs);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>(mockShiftNotes);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [remarkLogs, setRemarkLogs] = useState<RemarkLog[]>(mockRemarkLogs);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use authenticated user or fallback to first mock user
  const currentUser = authUser || mockUsers[0];

  // Fetch data from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDataFromAPI();
    }
  }, [isAuthenticated]);

  const loadDataFromAPI = async () => {
    setIsLoading(true);
    try {
      // Fetch all data from API
      const [
        callLogsData,
        leadsData,
        ordersData,
        tasksData,
        shiftNotesData,
        productsData,
        customersData,
        usersData,
        remarkLogsData,
      ] = await Promise.all([
        callLogsApi.getAll().catch(() => mockCallLogs),
        leadsApi.getAll().catch(() => mockLeads),
        ordersApi.getAll().catch(() => mockOrders),
        tasksApi.getAll().catch(() => mockTasks),
        shiftNotesApi.getAll().catch(() => mockShiftNotes),
        productsApi.getAll().catch(() => mockProducts),
        customersApi.getAll().catch(() => mockCustomers),
        usersApi.getAll().catch(() => mockUsers),
        remarkLogsApi.getAll().catch(() => mockRemarkLogs),
      ]);

      // Transform and parse dates
      setCallLogs(parseDates(toCamelCase(callLogsData), ['callDate', 'followUpDate']));
      setLeads(parseDates(toCamelCase(leadsData), ['createdDate', 'lastFollowUp', 'nextFollowUp']));
      setOrders(parseDates(toCamelCase(ordersData), ['orderDate', 'expectedDeliveryDate', 'actualDeliveryDate']));
      setTasks(parseDates(toCamelCase(tasksData), ['dueDate', 'createdAt']));
      setShiftNotes(parseDates(toCamelCase(shiftNotesData), ['createdAt']));
      setProducts(toCamelCase(productsData));
      setCustomers(parseDates(toCamelCase(customersData), ['createdAt']));
      setUsers(toCamelCase(usersData));
      setRemarkLogs(parseDates(toCamelCase(remarkLogsData), ['createdAt']));
    } catch (error) {
      console.error('Error loading data from API:', error);
      // Keep using mock data on error
    }
    setIsLoading(false);
  };

  const generateId = (prefix: string) => {
    const num = Math.floor(Math.random() * 1000) + Date.now() % 1000;
    return `${prefix}-${num}`;
  };

  const addCallLog = (callLogData: Omit<CallLog, 'id'>): CallLog => {
    const newCallLog: CallLog = {
      ...callLogData,
      id: generateId('CALL'),
    };
    
    // Optimistically update UI
    setCallLogs(prev => [newCallLog, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      callLogsApi.create(newCallLog).catch(error => {
        console.error('Failed to create call log:', error);
        // Rollback on error
        setCallLogs(prev => prev.filter(log => log.id !== newCallLog.id));
      });
    }
    
    // Auto-create task if follow-up
    if (callLogData.nextAction === 'Follow-up' && callLogData.followUpDate) {
      addTask({
        type: 'Follow-up',
        linkedTo: 'Call',
        linkedId: newCallLog.id,
        customerName: callLogData.customerName,
        dueDate: callLogData.followUpDate,
        status: 'Pending',
        assignedTo: callLogData.assignedTo,
        remarks: callLogData.remarks,
      });
    }
    
    // Add remark log
    if (callLogData.remarks) {
      addRemarkLog('callLog', newCallLog.id, callLogData.remarks);
    }
    
    return newCallLog;
  };

  const updateCallLog = (id: string, data: Partial<CallLog>) => {
    setCallLogs(prev => prev.map(log => 
      log.id === id ? { ...log, ...data } : log
    ));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      callLogsApi.update(id, data).catch(error => {
        console.error('Failed to update call log:', error);
        // Could implement rollback here
      });
    }
  };

  const addLead = (leadData: Omit<Lead, 'id' | 'agingDays' | 'agingBucket'>): Lead => {
    const agingDays = calculateAgingDays(leadData.createdDate);
    const newLead: Lead = {
      ...leadData,
      id: generateId('L'),
      agingDays,
      agingBucket: getAgingBucket(agingDays),
    };
    setLeads(prev => [newLead, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      leadsApi.create(newLead).catch(error => {
        console.error('Failed to create lead:', error);
        setLeads(prev => prev.filter(lead => lead.id !== newLead.id));
      });
    }
    
    // Add remark log
    if (leadData.remarks) {
      addRemarkLog('lead', newLead.id, leadData.remarks);
    }
    
    return newLead;
  };

  const updateLead = (id: string, data: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === id) {
        const updatedLead = { ...lead, ...data };
        updatedLead.agingDays = calculateAgingDays(updatedLead.createdDate);
        updatedLead.agingBucket = getAgingBucket(updatedLead.agingDays);
        return updatedLead;
      }
      return lead;
    }));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      leadsApi.update(id, data).catch(error => {
        console.error('Failed to update lead:', error);
      });
    }
  };

  const convertLeadToOrder = (leadId: string, orderData: Partial<Order>): Order => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');
    
    updateLead(leadId, { status: 'Won' });
    
    const newOrder = addOrder({
      leadId,
      customerName: lead.customerName,
      mobile: lead.mobile,
      deliveryAddress: lead.address || '',
      products: [],
      totalAmount: lead.estimatedValue || 0,
      status: 'Order Received',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      paymentStatus: 'Pending',
      assignedTo: lead.assignedTo,
      remarks: lead.remarks,
      ...orderData,
    });
    
    return newOrder;
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'agingDays' | 'isDelayed'>): Order => {
    const agingDays = calculateAgingDays(orderData.orderDate);
    const isDelayed = new Date() > orderData.expectedDeliveryDate;
    const newOrder: Order = {
      ...orderData,
      id: generateId('ORD'),
      agingDays,
      isDelayed,
    };
    setOrders(prev => [newOrder, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      ordersApi.create(newOrder).catch(error => {
        console.error('Failed to create order:', error);
        setOrders(prev => prev.filter(order => order.id !== newOrder.id));
      });
    }
    
    // Add remark log
    if (orderData.remarks) {
      addRemarkLog('order', newOrder.id, orderData.remarks);
    }
    
    // Deduct product quantities
    orderData.products.forEach(product => {
      updateProductQuantity(product.productId, -product.quantity);
    });
    
    return newOrder;
  };

  const updateOrder = (id: string, data: Partial<Order>, oldProducts?: OrderProduct[]) => {
    setOrders(prev => prev.map(order => {
      if (order.id === id) {
        // If products are being updated, adjust quantities
        if (data.products && oldProducts) {
          // Restore old quantities
          oldProducts.forEach(product => {
            updateProductQuantity(product.productId, product.quantity);
          });
          // Deduct new quantities
          data.products.forEach(product => {
            updateProductQuantity(product.productId, -product.quantity);
          });
        }
        
        const updatedOrder = { ...order, ...data };
        updatedOrder.agingDays = calculateAgingDays(updatedOrder.orderDate);
        updatedOrder.isDelayed = new Date() > updatedOrder.expectedDeliveryDate && 
          !['Delivered', 'Cancelled'].includes(updatedOrder.status);
        return updatedOrder;
      }
      return order;
    }));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      ordersApi.update(id, data).catch(error => {
        console.error('Failed to update order:', error);
      });
    }
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: generateId('T'),
      createdAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      tasksApi.create(newTask).catch(error => {
        console.error('Failed to create task:', error);
        setTasks(prev => prev.filter(task => task.id !== newTask.id));
      });
    }
    
    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...data } : task
    ));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      tasksApi.update(id, data).catch(error => {
        console.error('Failed to update task:', error);
      });
    }
  };

  const completeTask = (id: string) => {
    updateTask(id, { status: 'Done' });
  };

  const addShiftNote = (content: string): ShiftNote => {
    // Deactivate previous notes
    setShiftNotes(prev => prev.map(note => ({ ...note, isActive: false })));
    
    const newNote: ShiftNote = {
      id: generateId('SN'),
      createdBy: currentUser.name,
      createdAt: new Date(),
      content,
      isActive: true,
    };
    setShiftNotes(prev => [newNote, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      // First, deactivate all previous notes
      shiftNotesApi.getAll().then(notes => {
        notes.forEach(note => {
          if (note.isActive) {
            shiftNotesApi.update(note.id, { ...note, isActive: false, content: note.content }).catch(console.error);
          }
        });
      }).catch(console.error);
      
      // Create new note
      shiftNotesApi.create(newNote).catch(error => {
        console.error('Failed to create shift note:', error);
      });
    }
    
    return newNote;
  };

  const updateShiftNote = (id: string, content: string) => {
    setShiftNotes(prev => prev.map(note => 
      note.id === id ? { ...note, content } : note
    ));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      const note = shiftNotes.find(n => n.id === id);
      if (note) {
        shiftNotesApi.update(id, { content, isActive: note.isActive }).catch(error => {
          console.error('Failed to update shift note:', error);
        });
      }
    }
  };

  const clearShiftNote = (id: string) => {
    setShiftNotes(prev => prev.map(note => 
      note.id === id ? { ...note, isActive: false } : note
    ));
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalValue'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateId('C'),
      createdAt: new Date(),
      totalOrders: 0,
      totalValue: 0,
    };
    setCustomers(prev => [newCustomer, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      customersApi.create(newCustomer).catch(error => {
        console.error('Failed to create customer:', error);
        setCustomers(prev => prev.filter(c => c.id !== newCustomer.id));
      });
    }
    
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...data } : customer
    ));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      customersApi.update(id, data).catch(error => {
        console.error('Failed to update customer:', error);
      });
    }
  };

  const addProduct = (productData: Omit<Product, 'id' | 'status'>): Product => {
    const status = calculateProductStatus(productData.availableQuantity, productData.thresholdQuantity);
    const newProduct: Product = {
      ...productData,
      id: generateId('P'),
      status,
    };
    setProducts(prev => [newProduct, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      productsApi.create(newProduct).catch(error => {
        console.error('Failed to create product:', error);
        setProducts(prev => prev.filter(p => p.id !== newProduct.id));
      });
    }
    
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updatedProduct = { ...product, ...data };
        // Recalculate status
        updatedProduct.status = calculateProductStatus(
          updatedProduct.availableQuantity, 
          updatedProduct.thresholdQuantity
        );
        return updatedProduct;
      }
      return product;
    }));
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      productsApi.update(id, data).catch(error => {
        console.error('Failed to update product:', error);
      });
    }
  };

  const updateProductQuantity = (productId: string, quantityChange: number) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const newQuantity = Math.max(0, product.availableQuantity + quantityChange);
        return {
          ...product,
          availableQuantity: newQuantity,
          status: calculateProductStatus(newQuantity, product.thresholdQuantity),
        };
      }
      return product;
    }));
  };

  const addUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: generateId('U'),
    };
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...data } : user
    ));
  };

  const addRemarkLog = (entityType: RemarkLog['entityType'], entityId: string, remark: string): RemarkLog => {
    const newRemark: RemarkLog = {
      id: generateId('RL'),
      entityType,
      entityId,
      remark,
      createdBy: currentUser.name,
      createdAt: new Date(),
    };
    setRemarkLogs(prev => [newRemark, ...prev]);
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      remarkLogsApi.create(newRemark).catch(error => {
        console.error('Failed to create remark log:', error);
      });
    }
    
    return newRemark;
  };

  const getRemarkLogs = (entityType: RemarkLog['entityType'], entityId: string): RemarkLog[] => {
    return remarkLogs
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getOrdersByCustomer = (mobile: string): Order[] => {
    return orders.filter(order => order.mobile === mobile);
  };

  const getStats = (): CRMStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const callsToday = callLogs.filter(c => {
      const callDate = new Date(c.callDate);
      return callDate >= today && callDate < tomorrow;
    }).length;

    const followUpsDueToday = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return t.status !== 'Done' && dueDate >= today && dueDate < tomorrow;
    }).length;

    const newLeadsToday = leads.filter(l => {
      const createdDate = new Date(l.createdDate);
      return createdDate >= today && createdDate < tomorrow;
    }).length;

    const activeLeads = leads.filter(l => !['Won', 'Lost'].includes(l.status)).length;
    const criticalLeads = leads.filter(l => l.agingBucket === 'Critical' && !['Won', 'Lost'].includes(l.status)).length;
    const delayedOrders = orders.filter(o => o.isDelayed).length;
    
    const todaysDeliveries = orders.filter(o => {
      const expectedDate = new Date(o.expectedDeliveryDate);
      expectedDate.setHours(0, 0, 0, 0);
      return expectedDate.getTime() === today.getTime() && o.status !== 'Delivered';
    }).length;

    const wonLeads = leads.filter(l => l.status === 'Won').length;
    const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0;

    const leadsByBucket = [
      { bucket: 'Fresh', count: leads.filter(l => l.agingBucket === 'Fresh' && !['Won', 'Lost'].includes(l.status)).length },
      { bucket: 'Warm', count: leads.filter(l => l.agingBucket === 'Warm' && !['Won', 'Lost'].includes(l.status)).length },
      { bucket: 'At Risk', count: leads.filter(l => l.agingBucket === 'At Risk' && !['Won', 'Lost'].includes(l.status)).length },
      { bucket: 'Critical', count: leads.filter(l => l.agingBucket === 'Critical' && !['Won', 'Lost'].includes(l.status)).length },
    ];

    const ordersByStatus = [
      { status: 'Order Received', count: orders.filter(o => o.status === 'Order Received').length },
      { status: 'In Production', count: orders.filter(o => o.status === 'In Production').length },
      { status: 'Ready for Delivery', count: orders.filter(o => o.status === 'Ready for Delivery').length },
      { status: 'Out for Delivery', count: orders.filter(o => o.status === 'Out for Delivery').length },
      { status: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length },
    ];

    return {
      callsToday,
      followUpsDueToday,
      newLeadsToday,
      activeLeads,
      criticalLeads,
      totalOrders: orders.length,
      delayedOrders,
      todaysDeliveries,
      conversionRate,
      leadsByBucket,
      ordersByStatus,
    };
  };

  return (
    <CRMContext.Provider
      value={{
        callLogs,
        leads,
        orders,
        tasks,
        shiftNotes,
        products,
        customers,
        users,
        remarkLogs,
        currentUser,
        addCallLog,
        updateCallLog,
        addLead,
        updateLead,
        convertLeadToOrder,
        addOrder,
        updateOrder,
        addTask,
        updateTask,
        completeTask,
        addShiftNote,
        updateShiftNote,
        clearShiftNote,
        addCustomer,
        updateCustomer,
        addProduct,
        updateProduct,
        updateProductQuantity,
        addUser,
        updateUser,
        addRemarkLog,
        getRemarkLogs,
        getOrdersByCustomer,
        getStats,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};
