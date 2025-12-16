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
  DialogTrigger,
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
import { Plus, Search, Phone, ArrowRight, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CallLog } from '@/data/mockData';

const CallLogPage = () => {
  const { callLogs, addCallLog, updateCallLog, products, users, currentUser, addLead } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
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
  });

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
    });
    setIsEditMode(false);
    setEditingCallId(null);
  };

  const handleOpenDialog = (callLog?: CallLog) => {
    if (callLog) {
      // Edit mode
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
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.mobile) {
      toast.error('Please fill in required fields');
      return;
    }

    if (formData.nextAction === 'Follow-up' && (!formData.followUpDate || !formData.followUpTime)) {
      toast.error('Follow-up date and time are required');
      return;
    }

    if (isEditMode && editingCallId) {
      // Update existing call log
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
      toast.success('Call log updated successfully!');
    } else {
      // Create new call log
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

      // If Lead Created, automatically create lead
      if (formData.nextAction === 'Lead Created') {
        addLead({
          callId: newCallLog.id,
          customerName: formData.customerName,
          mobile: formData.mobile,
          productInterest: formData.productInterest,
          status: 'New',
          createdDate: new Date(),
          assignedTo: users.find(u => u.role === 'Sales')?.name || currentUser.name,
          remarks: formData.remarks,
        });
        toast.success('Call logged & Lead created successfully!');
      } else {
        toast.success('Call logged successfully!');
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const getActionBadgeVariant = (action: CallLog['nextAction']) => {
    switch (action) {
      case 'Lead Created':
        return 'default';
      case 'Order Updated':
        return 'secondary';
      case 'Follow-up':
        return 'outline';
      default:
        return 'secondary';
    }
  };

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
          <DialogContent className="sm:max-w-lg">
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
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="Enter mobile"
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
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.name}>
                          {product.name}
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

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  {isEditMode ? 'Update' : 'Save'} 
                  {!isEditMode && (formData.nextAction === 'Follow-up' ? ' & Create Task' : '')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(log)}
                      title="Edit call log"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
