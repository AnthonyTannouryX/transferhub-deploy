import { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, Mail, Phone, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { userService, User } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function UserSearch({ onUserSelect, onCancel, placeholder = "Search by name, email, or phone..." }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setUsers([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await userService.searchUsers(query);
        
        if (response && response.success) {
          setUsers(response.users || []);
          setShowResults(true);
        } else {
          toast({
            title: "Search Error",
            description: response?.message || "Failed to search users",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search users",
          variant: "destructive",
        });
        setUsers([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, toast]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowResults(false);
    setQuery(user.name);
  };

  const handleConfirm = () => {
    if (selectedUser) {
      onUserSelect(selectedUser);
    }
  };

  const handleClear = () => {
    setQuery('');
    setUsers([]);
    setSelectedUser(null);
    setShowResults(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'agent': return '🏪';
      case 'admin': return '👑';
      default: return '👤';
    }
  };


  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 text-lg"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results */}
      {showResults && users.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                        <span className="text-xs">{getUserTypeIcon(user.user_type)}</span>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(user.status)}`}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && users.length === 0 && !loading && query.length >= 2 && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No users found</h3>
            <p className="text-sm text-muted-foreground">
              Try searching with a different name, email, or phone number
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected User Preview */}
      {selectedUser && (
        <Card className="shadow-lg border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                {selectedUser.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{selectedUser.name}</h3>
                  <span className="text-sm">{getUserTypeIcon(selectedUser.user_type)}</span>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </Badge>
                </div>
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
            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="gradient-hero text-white border-0 flex-1">
                <Check className="w-4 h-4 mr-2" />
                Add as Beneficiary
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!selectedUser && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
