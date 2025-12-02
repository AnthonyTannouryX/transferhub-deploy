import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info, Zap, Clock } from "lucide-react";
import { walletService, FeeCalculation } from "@/services/walletService";

interface FeeCalculatorProps {
  amount: number;
  currency: string;
  speedTier: 'standard' | 'express';
  onFeeChange?: (fees: FeeCalculation) => void;
  className?: string;
}

export function FeeCalculator({ 
  amount, 
  currency, 
  speedTier, 
  onFeeChange,
  className = ""
}: FeeCalculatorProps) {
  const [fees, setFees] = useState<FeeCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amount > 0) {
      calculateFees();
    }
  }, [amount, currency, speedTier]);

  const calculateFees = async () => {
    if (amount <= 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const feeData = await walletService.calculateFees(amount, currency, speedTier);
      
      if (feeData && feeData.total_fee !== undefined) {
        setFees(feeData);
        onFeeChange?.(feeData);
      } else {
        setError('Invalid fee data received');
      }
    } catch (err) {
      setError('Failed to calculate fees');
      console.error('Fee calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (amount <= 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className={`shadow-card border-none ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Calculating fees...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`shadow-card border-none ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fees) {
    return null;
  }

  return (
    <Card className={`shadow-card border-none ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {speedTier === 'express' ? (
            <Zap className="w-5 h-5 text-warning" />
          ) : (
            <Clock className="w-5 h-5 text-primary" />
          )}
          Fee Breakdown
          <Badge variant={speedTier === 'express' ? 'default' : 'secondary'}>
            {speedTier === 'express' ? 'Express' : 'Standard'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transfer amount</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transfer fee</span>
            <span className="font-medium">{formatCurrency(fees.base_fee)}</span>
          </div>
          
          {fees.express_fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Express fee</span>
              <span className="font-medium text-warning">{formatCurrency(fees.express_fee)}</span>
            </div>
          )}
          
          {fees.plan_discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan discount</span>
              <span className="font-medium text-success">-{formatCurrency(fees.plan_discount)}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-between">
          <span className="font-semibold">Total fee</span>
          <span className="font-bold text-lg">{formatCurrency(fees.total_fee)}</span>
        </div>
        
        <div className="flex justify-between text-success">
          <span className="font-semibold">Total cost</span>
          <span className="font-bold text-lg">{formatCurrency(amount + fees.total_fee)}</span>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              {speedTier === 'express' ? 'Express transfer' : 'Standard transfer'}
            </p>
            <p>
              {speedTier === 'express' 
                ? 'Your transfer will be processed within 1-2 hours.'
                : 'Your transfer will be processed within 1-2 business days.'
              }
            </p>
            {fees.base_fee === 0 && (
              <p className="text-success font-medium mt-1">
                ✓ Free transfers with your current plan
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
