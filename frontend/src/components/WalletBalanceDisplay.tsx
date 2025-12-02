import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "@/services/walletService";
import { Wallet as WalletIcon, TrendingUp, TrendingDown } from "lucide-react";

interface WalletBalanceDisplayProps {
  selectedWalletId: string;
  wallets: Wallet[];
  transferAmount: number;
  fees: number;
  currency: string;
  className?: string;
}

export function WalletBalanceDisplay({ 
  selectedWalletId, 
  wallets, 
  transferAmount, 
  fees, 
  currency,
  className 
}: WalletBalanceDisplayProps) {
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const currentBalance = selectedWallet?.balance || 0;
  const totalDeduction = transferAmount + fees;
  const remainingBalance = currentBalance - totalDeduction;
  const isInsufficient = remainingBalance < 0;

  useEffect(() => {
    // Component will re-render when wallet data changes
  }, [selectedWalletId, selectedWallet, currentBalance]);

  if (!selectedWallet) {
    return (
      <Card className={`shadow-card border-none ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-primary" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No wallet selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className={`shadow-card border-none ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <WalletIcon className="w-5 h-5 text-primary" />
          Wallet Balance ({selectedWallet.currency})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <Badge variant="outline" className="bg-muted/50">
              {selectedWallet.currency}
            </Badge>
          </div>
          <div className="text-2xl font-bold">
            {currentBalance > 0 ? (
              `${selectedWallet.currency} ${currentBalance.toFixed(2)}`
            ) : (
              <span className="text-muted-foreground">No balance</span>
            )}
          </div>
        </div>

            {/* Transfer Details */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transfer Amount</span>
                <span className="font-medium">
                  {selectedWallet.currency} {transferAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees</span>
                <span className="font-medium">
                  {selectedWallet.currency} {fees.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Deduction</span>
                  <span className={isInsufficient ? "text-destructive" : ""}>
                    {selectedWallet.currency} {totalDeduction.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining Balance</span>
                {isInsufficient ? (
                  <Badge variant="destructive" className="text-xs">
                    Insufficient
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Sufficient
                  </Badge>
                )}
              </div>
              <div className={`text-xl font-bold ${isInsufficient ? 'text-destructive' : 'text-emerald-600'}`}>
                {selectedWallet.currency} {remainingBalance.toFixed(2)}
              </div>
            </div>

            {/* Warning for insufficient balance */}
            {isInsufficient && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">Insufficient Balance</span>
                </div>
                <p className="text-xs text-destructive/80 mt-1">
                  You need {selectedWallet.currency} {(Math.abs(remainingBalance)).toFixed(2)} more to complete this transfer.
                </p>
              </div>
            )}

        {/* Success message for sufficient balance */}
        {!isInsufficient && totalDeduction > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-700 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Transfer Ready</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Your wallet has sufficient balance for this transfer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
