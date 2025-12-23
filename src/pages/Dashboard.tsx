import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import {
  Users,
  ShoppingCart,
  AlertTriangle,
  Clock,
  Edit2,
  Save,
  X,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AgingBadge } from '@/components/ui/aging-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { safeParseDate } from '@/utils/dataTransform';

const Dashboard = () => {
  const { currentUser, leads, orders, shiftNotes, addShiftNote, updateShiftNote } = useCRM();
  const [activeTab, setActiveTab] = useState('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Shift note editing
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Filter active leads and sort by aging (Critical first)
  const agingLeads = leads
    .filter((l) => !['Won', 'Lost'].includes(l.status))
    .filter((l) => searchTerm === '' || 
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile.includes(searchTerm)
    )
    .filter((l) => agingFilter === 'all' || l.agingBucket === agingFilter)
    .filter((l) => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      const bucketOrder = { Critical: 0, 'At Risk': 1, Warm: 2, Fresh: 3 };
      return bucketOrder[a.agingBucket] - bucketOrder[b.agingBucket];
    });

  // Filter active orders and sort by delayed first
  const agingOrders = orders
    .filter((o) => !['Delivered', 'Cancelled'].includes(o.status))
    .filter((o) => searchTerm === '' || 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.mobile.includes(searchTerm)
    )
    .filter((o) => statusFilter === 'all' || o.status === statusFilter)
    .sort((a, b) => {
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      return b.agingDays - a.agingDays;
    });

  const criticalLeads = leads.filter((l) => l.agingBucket === 'Critical' && !['Won', 'Lost'].includes(l.status));
  const atRiskLeads = leads.filter((l) => l.agingBucket === 'At Risk' && !['Won', 'Lost'].includes(l.status));
  const delayedOrders = orders.filter((o) => o.isDelayed);
  const activeOrders = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status));

  const handleSaveNote = () => {
    if (!newNoteContent.trim()) {
      toast.error('Please enter a note');
      return;
    }
    addShiftNote(newNoteContent);
    toast.success('Shift note added!');
    setIsAddingNote(false);
    setNewNoteContent('');
  };

  const handleAddNote = () => {
    setNewNoteContent('');
    setIsAddingNote(true);
  };

  const handleCancelAdd = () => {
    setIsAddingNote(false);
    setNewNoteContent('');
  };

  const handleEditNote = (noteId: string, content: string) => {
    // Only allow editing own notes or if admin
    const note = shiftNotes.find(n => n.id === noteId);
    if (note && (note.createdBy === currentUser.name || currentUser.role === 'Admin')) {
      setEditingNoteId(noteId);
      setEditingNoteContent(content);
    } else {
      toast.error('You can only edit your own notes');
    }
  };

  const handleSaveEditNote = () => {
    if (!editingNoteContent.trim()) {
      toast.error('Please enter a note');
      return;
    }
    if (editingNoteId) {
      updateShiftNote(editingNoteId, editingNoteContent);
      toast.success('Shift note updated!');
      setEditingNoteId(null);
      setEditingNoteContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAgingFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${currentUser.name.split(' ')[0]}`}
        subtitle={`${currentUser.role} Dashboard • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-critical">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Leads</p>
                  <p className="text-3xl font-bold">{criticalLeads.length}</p>
                </div>
                <div className="p-3 bg-critical-light rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At Risk Leads</p>
                  <p className="text-3xl font-bold">{atRiskLeads.length}</p>
                </div>
                <div className="p-3 bg-orange-light rounded-lg">
                  <Users className="h-6 w-6 text-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delayed Orders</p>
                  <p className="text-3xl font-bold">{delayedOrders.length}</p>
                </div>
                <div className="p-3 bg-critical-light rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-3xl font-bold">{activeOrders.length}</p>
                </div>
                <div className="p-3 bg-primary-light rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shift Handover Section */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">Shift Handover History</CardTitle>
                <CardDescription>
                  {shiftNotes.length > 0 
                    ? `Last updated by ${shiftNotes[0].createdBy} on ${format(safeParseDate(shiftNotes[0].createdAt) || new Date(), 'dd MMM yyyy, HH:mm')}`
                    : 'No handover notes yet'
                  }
                </CardDescription>
              </div>
              {!isAddingNote && editingNoteId === null ? (
                <Button variant="outline" size="sm" onClick={handleAddNote} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Add Note
                </Button>
              ) : isAddingNote ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelAdd}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSaveNote} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSaveEditNote} className="gap-2">
                    <Save className="h-4 w-4" />
                    Update
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Always-visible Shift Notes History with Fixed Height 320px */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">History</p>
              {shiftNotes.length > 0 ? (
                <div className="h-80 border rounded-lg bg-background overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {shiftNotes.map((note) => (
                      <div key={note.id} className={cn("pb-4 border-b last:border-b-0 last:pb-0", editingNoteId === note.id && "bg-muted/50 p-3 rounded-lg")}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-sm">{note.createdBy}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(safeParseDate(note.createdAt) || new Date(), 'dd MMM yyyy, HH:mm')}
                              </p>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
                          </div>
                          {(note.createdBy === currentUser.name || currentUser.role === 'Admin') && editingNoteId !== note.id && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(note.id, note.content)}
                                className="h-8 w-8 p-0"
                                title="Edit note"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 border rounded-lg flex items-center justify-center text-muted-foreground bg-muted/30">
                  No handover notes yet. Add one below.
                </div>
              )}
            </div>

            {/* Add/Edit Note Section */}
            {isAddingNote || editingNoteId ? (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
                  {isAddingNote ? 'New Note' : 'Edit Note'}
                </p>
                <Textarea
                  value={isAddingNote ? newNoteContent : editingNoteContent}
                  onChange={(e) => isAddingNote ? setNewNoteContent(e.target.value) : setEditingNoteContent(e.target.value)}
                  placeholder={isAddingNote ? "Enter handover notes for the next shift...&#10;&#10;Example:&#10;- Customer XYZ called about order status&#10;- Lead L-101 needs urgent follow-up&#10;- Production team confirmed delivery for tomorrow" : "Edit your handover note..."}
                  rows={3}
                  className="resize-none"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {activeTab === 'leads' && (
            <Select value={agingFilter} onValueChange={setAgingFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Aging" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Aging</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="Fresh">Fresh</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {activeTab === 'leads' ? (
                <>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Quoted">Quoted</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="Order Received">Order Received</SelectItem>
                  <SelectItem value="In Production">In Production</SelectItem>
                  <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {(searchTerm || agingFilter !== 'all' || statusFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Aging Tracker Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setStatusFilter('all'); }}>
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" />
              Lead Aging
              {criticalLeads.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {criticalLeads.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Aging
              {delayedOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {delayedOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Lead Aging Tab */}
          <TabsContent value="leads" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Aging List</CardTitle>
                <CardDescription>
                  Sorted by urgency: Critical → At Risk → Warm → Fresh ({agingLeads.length} leads)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead ID</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aging</TableHead>
                        <TableHead>Last Follow-up</TableHead>
                        <TableHead>Next Follow-up</TableHead>
                        <TableHead>Assigned To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className={cn(
                            lead.agingBucket === 'Critical' && 'bg-critical-light',
                            lead.agingBucket === 'At Risk' && 'bg-orange-light'
                          )}
                        >
                          <TableCell className="font-medium">{lead.id}</TableCell>
                          <TableCell className="font-medium">{lead.customerName}</TableCell>
                          <TableCell>{lead.mobile}</TableCell>
                          <TableCell>
                            <StatusBadge status={lead.status} />
                          </TableCell>
                          <TableCell>
                            <AgingBadge bucket={lead.agingBucket} days={lead.agingDays} />
                          </TableCell>
                          <TableCell>
                            {lead.lastFollowUp
                              ? format(safeParseDate(lead.lastFollowUp) || new Date(), 'dd MMM yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {lead.nextFollowUp
                              ? format(safeParseDate(lead.nextFollowUp) || new Date(), 'dd MMM yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>{lead.assignedTo}</TableCell>
                        </TableRow>
                      ))}
                      {agingLeads.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No leads found matching filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Aging Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Aging List</CardTitle>
                <CardDescription>
                  Delayed orders highlighted. Sorted by delay status and aging days. ({agingOrders.length} orders)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aging Days</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Delay</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Assigned To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className={cn(order.isDelayed && 'bg-critical-light')}
                        >
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.mobile}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.agingDays} days</Badge>
                          </TableCell>
                          <TableCell>
                            {format(safeParseDate(order.expectedDeliveryDate) || new Date(), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            {order.isDelayed ? (
                              <div className="flex items-center gap-1 text-destructive font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                Yes
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.paymentStatus} />
                          </TableCell>
                          <TableCell>{order.assignedTo}</TableCell>
                        </TableRow>
                      ))}
                      {agingOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No orders found matching filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
