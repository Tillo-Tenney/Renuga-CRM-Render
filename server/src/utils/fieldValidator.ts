// Utility for safe SQL field validation to prevent SQL injection

interface FieldMap {
  [key: string]: string; // maps camelCase to snake_case
}

// Define allowed fields for each entity
export const ALLOWED_FIELDS = {
  callLogs: {
    callDate: 'call_date',
    customerName: 'customer_name',
    mobile: 'mobile',
    queryType: 'query_type',
    productInterest: 'product_interest',
    nextAction: 'next_action',
    followUpDate: 'follow_up_date',
    remarks: 'remarks',
    assignedTo: 'assigned_to',
    status: 'status',
  },
  leads: {
    callId: 'call_id',
    customerName: 'customer_name',
    mobile: 'mobile',
    email: 'email',
    address: 'address',
    productInterest: 'product_interest',
    plannedPurchaseQuantity: 'planned_purchase_quantity',
    status: 'status',
    createdDate: 'created_date',
    agingDays: 'aging_days',
    agingBucket: 'aging_bucket',
    lastFollowUp: 'last_follow_up',
    nextFollowUp: 'next_follow_up',
    assignedTo: 'assigned_to',
    estimatedValue: 'estimated_value',
    remarks: 'remarks',
  },
  orders: {
    leadId: 'lead_id',
    callId: 'call_id',
    customerName: 'customer_name',
    mobile: 'mobile',
    deliveryAddress: 'delivery_address',
    totalAmount: 'total_amount',
    status: 'status',
    orderDate: 'order_date',
    expectedDeliveryDate: 'expected_delivery_date',
    actualDeliveryDate: 'actual_delivery_date',
    agingDays: 'aging_days',
    isDelayed: 'is_delayed',
    paymentStatus: 'payment_status',
    invoiceNumber: 'invoice_number',
    assignedTo: 'assigned_to',
    remarks: 'remarks',
  },
  products: {
    name: 'name',
    category: 'category',
    unit: 'unit',
    price: 'price',
    availableQuantity: 'available_quantity',
    thresholdQuantity: 'threshold_quantity',
    status: 'status',
    isActive: 'is_active',
  },
  tasks: {
    type: 'type',
    linkedTo: 'linked_to',
    linkedId: 'linked_id',
    customerName: 'customer_name',
    dueDate: 'due_date',
    status: 'status',
    assignedTo: 'assigned_to',
    remarks: 'remarks',
  },
  customers: {
    name: 'name',
    mobile: 'mobile',
    email: 'email',
    address: 'address',
    totalOrders: 'total_orders',
    totalValue: 'total_value',
  },
};

/**
 * Validates and converts field names for SQL queries
 * Returns only valid fields with their snake_case names
 */
export function validateAndConvertFields(
  entity: keyof typeof ALLOWED_FIELDS,
  updates: Record<string, any>
): { fields: string[]; values: any[]; setClause: string } {
  const allowedFields = ALLOWED_FIELDS[entity];
  const validFields: string[] = [];
  const values: any[] = [];

  Object.keys(updates).forEach((key) => {
    if (key === 'id') return; // Skip ID field
    
    if (allowedFields[key as keyof typeof allowedFields]) {
      validFields.push(allowedFields[key as keyof typeof allowedFields]);
      values.push(updates[key]);
    } else {
      // Log warning for invalid field attempts
      console.warn(`Attempted to update invalid field: ${key} on entity: ${entity}`);
    }
  });

  const setClause = validFields
    .map((field, idx) => `${field} = $${idx + 2}`)
    .join(', ');

  return { fields: validFields, values, setClause };
}
