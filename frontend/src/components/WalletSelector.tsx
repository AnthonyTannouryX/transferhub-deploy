import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "@/services/walletService";

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWallet?: string;
  onWalletChange: (walletId: string) => void;
  placeholder?: string;
  className?: string;
}

export function WalletSelector({ 
  wallets, 
  selectedWallet, 
  onWalletChange, 
  placeholder = "Select wallet",
  className = ""
}: WalletSelectorProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
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
    <Select value={selectedWallet} onValueChange={onWalletChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {wallets.map((wallet) => (
          <SelectItem key={wallet.id} value={wallet.id} disabled={!wallet.is_active}>
            <div className="flex items-center gap-2">
              <span>{getCurrencyFlag(wallet.currency)}</span>
              <span className="font-medium">
                {wallet.currency_info?.name || wallet.currency}
              </span>
              <span className="text-muted-foreground">
                ({formatCurrency(wallet.balance, wallet.currency)})
              </span>
              {!wallet.is_active && (
                <span className="text-xs text-destructive">(Inactive)</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
