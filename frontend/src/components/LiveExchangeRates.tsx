import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { exchangeRateService, CurrencyPair } from "@/services/exchangeRateService";

interface LiveExchangeRatesProps {
  className?: string;
  showRefresh?: boolean;
  maxPairs?: number;
}

export function LiveExchangeRates({ 
  className = "", 
  showRefresh = true,
  maxPairs = 5 
}: LiveExchangeRatesProps) {
  const [pairs, setPairs] = useState<CurrencyPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await exchangeRateService.getPopularPairs();
      
      if (Array.isArray(data) && data.length > 0) {
        setPairs(data.slice(0, maxPairs));
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setPairs([]);
      }
    } catch (err) {
      console.error('Exchange rate error:', err);
      setError('Failed to load exchange rates');
      setPairs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    
    // Refresh rates every 5 minutes
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [maxPairs]);

  const formatRate = (rate: number, from: string, to: string) => {
    if (rate >= 1) {
      return `1 ${from} = ${rate.toFixed(4)} ${to}`;
    } else {
      return `1 ${from} = ${rate.toFixed(6)} ${to}`;
    }
  };

  const formatChange = (change: number, isPositive: boolean) => {
    const sign = isPositive ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading && pairs.length === 0) {
    return (
      <Card className={`shadow-card border-none ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Live Exchange Rates</CardTitle>
              <p className="text-xs text-muted-foreground">Real-time currency conversions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Loading exchange rates...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && pairs.length === 0) {
    return (
      <Card className={`shadow-card border-none ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Live Exchange Rates</CardTitle>
              <p className="text-xs text-muted-foreground">Real-time currency conversions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-destructive mb-4 font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={loadRates} className="hover:bg-primary/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-card border-none ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Live Exchange Rates</CardTitle>
            <p className="text-xs text-muted-foreground">Real-time currency conversions</p>
          </div>
        </div>
        {showRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadRates}
            disabled={loading}
            className="hover:bg-primary/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pairs.length === 0 && !loading && !error ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No exchange rate data available</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadRates}
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            pairs.map((pair, index) => (
            <div key={index} className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/40 hover:to-muted/20 transition-all duration-200 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{pair.from}</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-secondary-foreground">{pair.to}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatRate(pair.rate, pair.from, pair.to)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={pair.is_positive ? "default" : "destructive"}
                  className={`text-xs font-medium px-2 py-1 ${
                    pair.is_positive 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {pair.is_positive ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {formatChange(pair.change, pair.is_positive)}
                </Badge>
              </div>
            </div>
          )))}
        </div>
        
        {lastUpdated && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {lastUpdated}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
