import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { AgingBadge } from '@/components/ui/aging-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  Send,
  History,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const HandoverPage = () => {
  const { tasks, leads, orders, shiftNotes, addShiftNote, currentUser } = useCRM();
  const [newNote, setNewNote] = useState('');

  // Get pending/overdue follow-ups
  const pendingFollowUps = tasks.filter(
    (t) => (t.status === 'Pending' || t.status === 'Overdue') && 
    (t.type === 'Follow-up' || t.type === 'Call Back')
  );

  // Get critical leads
  const criticalLeads = leads.filter(
    (l) => l.agingBucket === 'Critical' && !['Won', 'Lost'].includes(l.status)
  );

  // Get delayed orders
  const delayedOrders = orders.filter((o) => o.isDelayed);

  // Get active shift note
  const activeNote = shiftNotes.find((n) => n.isActive);
  const previousNotes = shiftNotes.filter((n) => !n.isActive).slice(0, 5);

  const handleSubmitNote = () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    addShiftNote(newNote);
    setNewNote('');
    toast.success('Shift note saved!');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Shift Handover"
        subtitle={`Handover summary for ${currentUser.name} • ${format(new Date(), 'EEEE, dd MMMM yyyy')}`}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={pendingFollowUps.length > 0 ? 'border-warning' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning-light rounded-lg">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingFollowUps.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Follow-ups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={criticalLeads.length > 0 ? 'border-destructive' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-critical-light rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalLeads.length}</p>
                  <p className="text-sm text-muted-foreground">Critical Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={delayedOrders.length > 0 ? 'border-destructive' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-critical-light rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{delayedOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Delayed Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Actionable Items */}
          <div className="space-y-6">
            {/* Pending Follow-ups */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Pending Follow-ups
                  </CardTitle>
                  <Badge variant={pendingFollowUps.length > 0 ? 'destructive' : 'secondary'}>
                    {pendingFollowUps.length}
                  </Badge>
                </div>
                <CardDescription>Due today or overdue - requires immediate action</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {pendingFollowUps.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="mr-2 h-5 w-5 text-success" />
                      All follow-ups completed!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingFollowUps.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border ${
                            task.status === 'Overdue' ? 'bg-critical-light border-destructive/30' : 'bg-card'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{task.customerName}</span>
                            <StatusBadge status={task.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">{task.remarks}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>Due: {format(new Date(task.dueDate), 'dd MMM, HH:mm')}</span>
                            <Badge variant="outline">{task.linkedTo}: {task.linkedId}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Critical Leads */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Critical Leads
                  </CardTitle>
                  <Badge variant={criticalLeads.length > 0 ? 'destructive' : 'secondary'}>
                    {criticalLeads.length}
                  </Badge>
                </div>
                <CardDescription>Leads aging &gt;10 days - at risk of being lost</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {criticalLeads.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="mr-2 h-5 w-5 text-success" />
                      No critical leads!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {criticalLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-3 rounded-lg border bg-critical-light border-destructive/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{lead.customerName}</span>
                            <AgingBadge bucket={lead.agingBucket} days={lead.agingDays} />
                          </div>
                          <p className="text-sm">{lead.productInterest}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{lead.id} • {lead.mobile}</span>
                            <StatusBadge status={lead.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Delayed Orders */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delayed Orders
                  </CardTitle>
                  <Badge variant={delayedOrders.length > 0 ? 'destructive' : 'secondary'}>
                    {delayedOrders.length}
                  </Badge>
                </div>
                <CardDescription>Orders past expected delivery date</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {delayedOrders.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="mr-2 h-5 w-5 text-success" />
                      No delayed orders!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {delayedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-3 rounded-lg border bg-critical-light border-destructive/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{order.customerName}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-sm">₹{order.totalAmount.toLocaleString()}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{order.id}</span>
                            <span>Expected: {format(new Date(order.expectedDeliveryDate), 'dd MMM')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Shift Notes */}
          <div className="space-y-6">
            {/* Active Note from Previous Shift */}
            {activeNote && (
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Notes from Previous Shift
                    </CardTitle>
                    <Badge>Active</Badge>
                  </div>
                  <CardDescription>
                    By {activeNote.createdBy} • {format(new Date(activeNote.createdAt), 'dd MMM, HH:mm')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary-light p-4 rounded-lg whitespace-pre-wrap text-sm">
                    {activeNote.content}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Shift Note */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create Shift Note
                </CardTitle>
                <CardDescription>
                  Leave notes for the next shift - will be visible on their handover dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter notes for the next shift...

Example:
- Customer XYZ called about order status
- Lead L-101 needs urgent follow-up
- Production team confirmed delivery for tomorrow"
                  rows={6}
                />
                <Button onClick={handleSubmitNote} className="gap-2">
                  <Send className="h-4 w-4" />
                  Save Shift Note
                </Button>
              </CardContent>
            </Card>

            {/* Previous Notes History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Previous Notes
                </CardTitle>
                <CardDescription>Recent shift handover notes</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {previousNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No previous notes
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {previousNotes.map((note) => (
                        <div key={note.id}>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>{note.createdBy}</span>
                            <span>{format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverPage;
