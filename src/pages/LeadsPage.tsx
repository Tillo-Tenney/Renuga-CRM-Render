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
import { AgingBadge } from '@/components/ui/aging-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  LayoutGrid,
  List,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  User,
  History,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Lead } from '@/data/mockData';
import { cn } from '@/lib/utils';

const leadStatuses: Lead['status'][] = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];

const LeadsPage = () => {
  const { leads, updateLead, convertLeadToOrder, users, addRemarkLog, getRemarkLogs } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Status update with remark
  const [pendingStatusChange, setPendingStatusChange] = useState<Lead['status'] | null>(null);
  const [statusChangeRemark, setStatusChangeRemark] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Remark History
  const [isRemarkHistoryOpen, setIsRemarkHistoryOpen] = useState(false);
  const [remarkHistoryLeadId, setRemarkHistoryLeadId] = useState('');

  const filteredLeads = leads.filter(
    (lead) =>
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile.includes(searchTerm) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadsByStatus = (status: Lead['status']) => {
    return filteredLeads.filter((lead) => lead.status === status);
  };

  const initiateStatusChange = (newStatus: Lead['status']) => {
    if (!selectedLead) return;
    if (newStatus === selectedLead.status) return;
    
    setPendingStatusChange(newStatus);
    setStatusChangeRemark('');
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (!selectedLead || !pendingStatusChange) return;
    
    if (!statusChangeRemark.trim()) {
      toast.error('Remark is mandatory for status change');
      return;
    }

    updateLead(selectedLead.id, { 
      status: pendingStatusChange,
      lastFollowUp: new Date(),
    });
    addRemarkLog('lead', selectedLead.id, `Status changed to ${pendingStatusChange}: ${statusChangeRemark}`);
    
    setSelectedLead({ ...selectedLead, status: pendingStatusChange });
    toast.success(`Lead status updated to ${pendingStatusChange}`);
    
    setIsStatusDialogOpen(false);
    setPendingStatusChange(null);
    setStatusChangeRemark('');
  };

  const handleConvertToOrder = (lead: Lead) => {
    convertLeadToOrder(lead.id, {});
    addRemarkLog('lead', lead.id, 'Lead converted to order');
    toast.success('Lead converted to order successfully!');
    setIsDetailOpen(false);
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const openRemarkHistory = (leadId: string) => {
    setRemarkHistoryLeadId(leadId);
    setIsRemarkHistoryOpen(true);
  };

  const remarkHistory = getRemarkLogs('lead', remarkHistoryLeadId || (selectedLead?.id || ''));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Leads" subtitle="Track and convert potential customers" />

      <div className="flex-1 p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile or lead ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <List className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {leadStatuses.map((status) => {
              const statusLeads = getLeadsByStatus(status);
              return (
                <div key={status} className="kanban-column min-w-[280px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm">{status}</h3>
                    <Badge variant="secondary">{statusLeads.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {statusLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer card-hover"
                        onClick={() => openLeadDetail(lead)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{lead.customerName}</p>
                              <p className="text-xs text-muted-foreground">{lead.id}</p>
                            </div>
                            <AgingBadge bucket={lead.agingBucket} days={lead.agingDays} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.mobile}
                          </div>
                          <p className="text-xs line-clamp-2">{lead.productInterest}</p>
                          {lead.plannedPurchaseQuantity && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Package className="h-3 w-3" />
                              Planned: {lead.plannedPurchaseQuantity} units
                            </div>
                          )}
                          {lead.estimatedValue && (
                            <div className="flex items-center gap-1 text-sm font-medium text-primary">
                              <DollarSign className="h-3 w-3" />
                              ₹{lead.estimatedValue.toLocaleString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {statusLeads.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Product Interest</TableHead>
                  <TableHead>Planned Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead>Last Follow-up</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={cn(
                      'cursor-pointer',
                      lead.agingBucket === 'Critical' && 'bg-critical-light hover:bg-red-100'
                    )}
                    onClick={() => openLeadDetail(lead)}
                  >
                    <TableCell className="font-medium">{lead.id}</TableCell>
                    <TableCell className="font-medium">{lead.customerName}</TableCell>
                    <TableCell>{lead.mobile}</TableCell>
                    <TableCell className="max-w-40 truncate">{lead.productInterest}</TableCell>
                    <TableCell>{lead.plannedPurchaseQuantity || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      <AgingBadge bucket={lead.agingBucket} days={lead.agingDays} />
                    </TableCell>
                    <TableCell>
                      {lead.lastFollowUp ? format(new Date(lead.lastFollowUp), 'dd MMM') : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.nextFollowUp ? format(new Date(lead.nextFollowUp), 'dd MMM') : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{lead.assignedTo}</TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Lead Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-lg">
            {selectedLead && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Lead Details - {selectedLead.id}</span>
                    <AgingBadge bucket={selectedLead.agingBucket} days={selectedLead.agingDays} />
                  </DialogTitle>
                  <DialogDescription>
                    Created on {format(new Date(selectedLead.createdDate), 'dd MMM yyyy')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Customer Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedLead.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedLead.mobile}</span>
                      </div>
                      {selectedLead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLead.email}</span>
                        </div>
                      )}
                      {selectedLead.address && (
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLead.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lead Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Lead Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Product Interest</span>
                        <span className="font-medium">{selectedLead.productInterest}</span>
                      </div>
                      {selectedLead.plannedPurchaseQuantity && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Planned Quantity</span>
                          <span className="font-medium">{selectedLead.plannedPurchaseQuantity} units</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Estimated Value</span>
                        <span className="font-medium">
                          {selectedLead.estimatedValue
                            ? `₹${selectedLead.estimatedValue.toLocaleString()}`
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Assigned To</span>
                        <span className="font-medium">{selectedLead.assignedTo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Update Status</h4>
                    <Select
                      value={selectedLead.status}
                      onValueChange={(value) => initiateStatusChange(value as Lead['status'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remark History */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-muted-foreground">Remark History</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openRemarkHistory(selectedLead.id)}
                        className="gap-1"
                      >
                        <History className="h-4 w-4" />
                        View All
                      </Button>
                    </div>
                    {selectedLead.remarks && (
                      <p className="text-sm bg-muted p-3 rounded-lg">{selectedLead.remarks}</p>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                  {selectedLead.status === 'Negotiation' && (
                    <Button
                      onClick={() => handleConvertToOrder(selectedLead)}
                      className="gap-2"
                    >
                      Convert to Order
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Change Remark Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Lead Status</DialogTitle>
              <DialogDescription>
                Changing status to: <strong>{pendingStatusChange}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Remark * (Mandatory)</Label>
                <Textarea
                  value={statusChangeRemark}
                  onChange={(e) => setStatusChangeRemark(e.target.value)}
                  placeholder="Add remark for this status change..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmStatusChange}>
                Confirm Status Change
              </Button>
            </DialogFooter>
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

export default LeadsPage;
