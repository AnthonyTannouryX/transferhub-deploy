import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { WalletTransaction } from "@/services/walletService";

interface WalletTransactionItemProps {
  transaction: WalletTransaction;
  showDetails?: boolean;
  onViewDetails?: (transaction: WalletTransaction) => void;
  className?: string;
}

export function WalletTransactionItem({ 
  transaction, 
  showDetails = false,
  onViewDetails,
  className = ""
}: WalletTransactionItemProps) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return ArrowDownLeft;
      case 'withdraw':
        return ArrowUpRight;
      case 'transfer_in':
        return ArrowDownLeft;
      case 'transfer_out':
        return ArrowUpRight;
      default:
        return ArrowRightLeft;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
        return 'text-success';
      case 'withdraw':
      case 'transfer_out':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'transfer_in':
        return 'Received';
      case 'transfer_out':
        return 'Sent';
      default:
        return 'Transaction';
    }
  };

  const getStatusIcon = () => {
    return CheckCircle2; // Assuming all transactions are completed
  };

  const getStatusColor = () => {
    return 'text-success';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const Icon = getTransactionIcon(transaction.type);
  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${getTransactionColor(transaction.type)}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{getTransactionLabel(transaction.type)}</p>
            <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
          </div>
          <p className="text-sm text-muted-foreground">{transaction.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</span>
            {transaction.metadata?.transfer_reference && (
              <Badge variant="outline" className="text-xs">
                {transaction.metadata.transfer_reference}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
          {transaction.type === 'withdraw' || transaction.type === 'transfer_out' ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          Balance: {formatCurrency(transaction.balance_after)}
        </p>
        {showDetails && onViewDetails && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1"
            onClick={() => onViewDetails(transaction)}
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}
