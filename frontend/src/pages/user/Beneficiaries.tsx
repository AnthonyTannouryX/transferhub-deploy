import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserSearch } from "@/components/UserSearch";
import { Plus, Edit, Trash2, Mail, Phone, Building2, Search, Star, Shield, Zap, CreditCard, Smartphone, Banknote, User as UserIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { beneficiaryService, Beneficiary } from "@/services/beneficiaryService";
import { User as UserType } from "@/services/userService";

export default function Beneficiaries() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'bank' | 'wallet' | 'cash'>('wallet');
  const [editAccountDetails, setEditAccountDetails] = useState('');
  const [updating, setUpdating] = useState(false);

  // Load beneficiaries on component mount
  useEffect(() => {
    loadBeneficiaries();
  }, []);


  const loadBeneficiaries = async () => {
    setLoading(true);
    try {
      const response = await beneficiaryService.getBeneficiaries();
      if (response && response.success) {
        setBeneficiaries(response.beneficiaries || []);
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to load beneficiaries",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
      const errorMessage = error instanceof Error && error.message.includes('fetch')
        ? "Cannot connect to server. Please make sure the backend is running on port 8000."
        : "Failed to load beneficiaries";
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMoney = (beneficiary: Beneficiary) => {
    console.log('💰 Beneficiaries: Sending money to beneficiary:', beneficiary);
    // Navigate to new transfer page with beneficiary data
    navigate('/user/new-transfer', {
      state: {
        selectedBeneficiary: beneficiary,
        prefillData: {
          recipientName: beneficiary.name,
          recipientEmail: beneficiary.email,
          recipientPhone: beneficiary.phone,
          payoutMethod: beneficiary.payment_method,
          paymentMethod: beneficiary.payment_method
        }
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bank": return CreditCard;
      case "wallet": return Smartphone;
      case "cash": return Banknote;
      default: return UserIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bank": return "bg-primary/10 text-primary";
      case "wallet": return "bg-secondary/10 text-secondary";
      case "cash": return "bg-warning/10 text-warning";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(beneficiary => {
    const matchesSearch = beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         beneficiary.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || beneficiary.payment_method === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    setIsAdding(false);
  };

  const handleAddBeneficiary = async () => {
    if (!selectedUser) {
      toast({
        title: "Validation Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await beneficiaryService.addBeneficiary({
        beneficiary_user_id: selectedUser.id,
        payment_method: 'wallet',
        account_details: 'Wallet-to-wallet transfer',
      });

      if (response && response.success) {
        toast({
          title: "Success",
          description: `${selectedUser.name} has been added as a beneficiary`,
        });
        setSelectedUser(null);
        loadBeneficiaries(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to add beneficiary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to add beneficiary:', error);
      toast({
        title: "Error",
        description: "Failed to add beneficiary",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setEditPaymentMethod((beneficiary.payment_method as 'bank' | 'wallet' | 'cash') || 'wallet');
    setEditAccountDetails(beneficiary.account_details || '');
  };

  const handleUpdateBeneficiary = async () => {
    if (!editingBeneficiary) return;

    setUpdating(true);
    try {
      const response = await beneficiaryService.updateBeneficiary(editingBeneficiary.id, {
        payment_method: editPaymentMethod,
        account_details: editAccountDetails,
      });

      if (response && response.success) {
        toast({
          title: "Success",
          description: "Beneficiary updated successfully",
        });
        setEditingBeneficiary(null);
        setEditAccountDetails('');
        setEditPaymentMethod('wallet');
        loadBeneficiaries(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to update beneficiary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update beneficiary:', error);
      toast({
        title: "Error",
        description: "Failed to update beneficiary",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your beneficiaries?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await beneficiaryService.deleteBeneficiary(id);
      if (response && response.success) {
        toast({
          title: "Beneficiary Removed",
          description: `${name} has been removed from your beneficiaries.`,
          variant: "destructive",
        });
        loadBeneficiaries(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to remove beneficiary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete beneficiary:', error);
      toast({
        title: "Error",
        description: "Failed to remove beneficiary",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="user" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Beneficiaries</h1>
          <p className="text-muted-foreground">Manage your saved recipients for quick transfers</p>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-card border-none mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search beneficiaries by name, email, or country"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="wallet">Mobile Wallet</SelectItem>
                  <SelectItem value="cash">Cash Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Add Beneficiary Button */}
        <div className="mb-6">
          <Button onClick={() => setIsAdding(true)} className="gradient-hero text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            Add New Beneficiary
          </Button>
        </div>

        {/* User Search Component */}
        {isAdding && !selectedUser && (
          <Card className="shadow-card border-none mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Search for User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserSearch
                onUserSelect={handleUserSelect}
                onCancel={() => setIsAdding(false)}
                placeholder="Search by name, email, or phone number..."
              />
            </CardContent>
          </Card>
        )}

        {/* Selected User Form */}
        {selectedUser && (
          <Card className="shadow-card border-none mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Add {selectedUser.name} as Beneficiary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected User Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {selectedUser.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedUser.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {selectedUser.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{selectedUser.email}</span>
                        </div>
                      )}
                      {selectedUser.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{selectedUser.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet-to-Wallet Info */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-primary">Wallet-to-Wallet Transfer</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  This beneficiary will be set up for direct wallet-to-wallet transfers. 
                  No additional account details are required.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddBeneficiary} 
                  className="gradient-hero text-white border-0"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Beneficiary
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Beneficiary Form */}
        {editingBeneficiary && (
          <Card className="shadow-card border-none mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Beneficiary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Beneficiary Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {editingBeneficiary.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{editingBeneficiary.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{editingBeneficiary.email}</span>
                      </div>
                      {editingBeneficiary.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{editingBeneficiary.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label htmlFor="edit-payment-method">Payment Method</Label>
                <Select value={editPaymentMethod} onValueChange={(value: 'bank' | 'wallet' | 'cash') => setEditPaymentMethod(value)}>
                  <SelectTrigger id="edit-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="wallet">Mobile Wallet</SelectItem>
                    <SelectItem value="cash">Cash Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Details */}
              <div className="space-y-2">
                <Label htmlFor="edit-account-details">Account Details</Label>
                <Input
                  id="edit-account-details"
                  placeholder="Enter account number, wallet ID, or pickup location"
                  value={editAccountDetails}
                  onChange={(e) => setEditAccountDetails(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleUpdateBeneficiary} 
                  className="gradient-hero text-white border-0"
                  disabled={updating || !editAccountDetails.trim()}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Beneficiary
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingBeneficiary(null);
                    setEditAccountDetails('');
                    setEditPaymentMethod('wallet');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="shadow-card border-none">
            <CardContent className="text-center py-12">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading beneficiaries...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your beneficiaries</p>
            </CardContent>
          </Card>
        )}

        {/* Beneficiaries List */}
        {!loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBeneficiaries.map((beneficiary) => {
              const TypeIcon = getTypeIcon(beneficiary.payment_method);
              return (
                <Card key={beneficiary.id} className="shadow-card hover:shadow-elegant transition-smooth border-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{beneficiary.name}</CardTitle>
                            {beneficiary.is_favorite && (
                              <Star className="w-4 h-4 text-warning fill-warning" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {beneficiary.user_type}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getTypeColor(beneficiary.status)}`}>
                              {beneficiary.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(beneficiary)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(beneficiary.id, beneficiary.name)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {beneficiary.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{beneficiary.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{beneficiary.email}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Transfer Type</p>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          <Smartphone className="w-3 h-3 mr-1" />
                          Wallet-to-Wallet
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Direct wallet transfer</p>
                      {beneficiary.is_verified && (
                        <div className="flex items-center gap-1 mt-2">
                          <Shield className="w-3 h-3 text-success" />
                          <span className="text-xs text-success">Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last transfer:</span>
                        <span>{beneficiary.last_transfer_date ? new Date(beneficiary.last_transfer_date).toLocaleDateString() : 'Never'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total transfers:</span>
                        <span className="font-semibold">{beneficiary.total_transfers}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full gradient-hero text-white border-0"
                      onClick={() => handleSendMoney(beneficiary)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Send Money
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filteredBeneficiaries.length === 0 && (
          <Card className="shadow-card border-none">
            <CardContent className="text-center py-12">
              <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No beneficiaries found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Add your first beneficiary to get started"}
              </p>
              <div className="space-y-2">
                <Button onClick={() => setIsAdding(true)} className="gradient-hero text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Beneficiary
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
