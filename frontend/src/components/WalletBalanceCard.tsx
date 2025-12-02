import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Plus, Minus } from "lucide-react";
import { Wallet as WalletType } from "@/services/walletService";

interface WalletBalanceCardProps {
  wallet: WalletType;
  onDeposit?: (wallet: WalletType) => void;
  onWithdraw?: (wallet: WalletType) => void;
  showActions?: boolean;
  className?: string;
}

export function WalletBalanceCard({ 
  wallet, 
  onDeposit, 
  onWithdraw, 
  showActions = true,
  className = ""
}: WalletBalanceCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencySymbol = (currency: string) => {
    // Use currency_info if available, otherwise fallback to hardcoded symbols
    if (wallet.currency_info?.symbol) {
      return wallet.currency_info.symbol;
    }
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
    };
    return symbols[currency] || currency;
  };

  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'INR': '🇮🇳',
    };
    return flags[currency] || '💳';
  };

  return (
    <Card className={`shadow-card border-none hover:shadow-elegant transition-smooth ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                {wallet.currency_info?.name || wallet.currency}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{getCurrencyFlag(wallet.currency)}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {wallet.currency}
                </Badge>
                {!wallet.is_active && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</div>
          <div className="text-xs text-muted-foreground">Available Balance</div>
        </div>
        
        {showActions && (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 text-xs"
              onClick={() => onDeposit?.(wallet)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Deposit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 text-xs"
              onClick={() => onWithdraw?.(wallet)}
            >
              <Minus className="w-3 h-3 mr-1" />
              Withdraw
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
