import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Zap, Shield, TrendingUp, AlertTriangle } from "lucide-react";

interface PlanInfoCardProps {
  planName: string;
  planDisplayName: string;
  monthlyLimit: number | null;
  currentUsage: number;
  transferAmount: number;
  transferFee: number;
  className?: string;
}

export function PlanInfoCard({
  planName,
  planDisplayName,
  monthlyLimit,
  currentUsage,
  transferAmount,
  transferFee,
  className = ""
}: PlanInfoCardProps) {
  const totalTransferCost = transferAmount + transferFee;
  const newUsage = currentUsage + totalTransferCost;
  const usagePercentage = monthlyLimit ? (newUsage / monthlyLimit) * 100 : 0;
  const isOverLimit = monthlyLimit && newUsage > monthlyLimit;
  const isNearLimit = monthlyLimit && usagePercentage > 80;

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'enterprise':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'business':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'personal':
        return <Shield className="w-5 h-5 text-green-500" />;
      default:
        return <Zap className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'enterprise':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'business':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'personal':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className={`shadow-card border-none ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getPlanIcon(planName)}
          Your Plan: {planDisplayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${getPlanColor(planName)} border`}>
            {planDisplayName} Plan
          </Badge>
          {planName === 'enterprise' && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Monthly Usage */}
        {monthlyLimit && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monthly Usage</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(currentUsage)} / {formatCurrency(monthlyLimit)}
              </span>
            </div>
            
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : ''}`}
            />
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {usagePercentage.toFixed(1)}% used
              </span>
              {isOverLimit && (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Over limit
                </span>
              )}
              {isNearLimit && !isOverLimit && (
                <span className="text-yellow-600 font-medium">
                  Near limit
                </span>
              )}
            </div>
          </div>
        )}

        {/* Transfer Impact */}
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm font-medium">This Transfer Will:</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer amount:</span>
              <span>{formatCurrency(transferAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer fee:</span>
              <span>{formatCurrency(transferFee)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total cost:</span>
              <span>{formatCurrency(totalTransferCost)}</span>
            </div>
          </div>
        </div>


        {/* Plan Info Summary */}
        <div className="space-y-2 text-xs text-muted-foreground border-t pt-2">
          <div className="flex justify-between">
            <span>Limit:</span>
            <span className="font-medium">{monthlyLimit ? formatCurrency(monthlyLimit) : 'Unlimited'}/month</span>
          </div>
          <div className="flex justify-between">
            <span>Transfer Fee:</span>
            <span className="font-medium">{formatCurrency(transferFee)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
