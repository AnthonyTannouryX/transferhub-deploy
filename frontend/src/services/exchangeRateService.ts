import { apiClient } from './apiClient';

export interface ExchangeRate {
  currency: string;
  rate: number;
  change?: number;
  is_positive?: boolean;
}

export interface ExchangeRateResponse {
  rates: Record<string, number>;
  base_currency: string;
  last_updated: string;
}

export interface CurrencyPair {
  from: string;
  to: string;
  rate: number;
  change: number;
  is_positive: boolean;
}

export interface ConversionResult {
  original_amount: number;
  converted_amount: number;
  from: string;
  to: string;
  rate: number;
  last_updated: string;
}

export interface RateChange {
  currency: string;
  change_percentage: number;
  is_positive: boolean;
  previous_rate: number;
  current_rate: number;
}

class ExchangeRateService {
  /**
   * Get all current exchange rates
   */
  async getRates(): Promise<ExchangeRateResponse> {
    try {
      const response = await apiClient.get('/exchange-rates');
      return response.data || { rates: {}, base_currency: 'USD', last_updated: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      return { rates: {}, base_currency: 'USD', last_updated: new Date().toISOString() };
    }
  }

  /**
   * Get exchange rate for specific currency pair
   */
  async getRate(from: string, to: string): Promise<number> {
    try {
      const response = await apiClient.get('/exchange-rates/rate', {
        params: { from, to }
      });
      return response.data?.rate || 1.0;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return 1.0; // Default rate
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertAmount(amount: number, from: string, to: string): Promise<ConversionResult> {
    try {
      const response = await apiClient.post('/exchange-rates/convert', {
        amount,
        from,
        to
      });
      return response.data || {
        original_amount: amount,
        converted_amount: amount,
        from,
        to,
        rate: 1.0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to convert amount:', error);
      return {
        original_amount: amount,
        converted_amount: amount,
        from,
        to,
        rate: 1.0,
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Get popular currency pairs
   */
  async getPopularPairs(): Promise<CurrencyPair[]> {
    try {
      const response = await apiClient.get('/exchange-rates/popular-pairs');
      return response.data?.pairs || [];
    } catch (error) {
      console.error('Failed to fetch popular pairs:', error);
      return [];
    }
  }

  /**
   * Get rate change for a currency
   */
  async getRateChange(currency: string): Promise<RateChange> {
    try {
      const response = await apiClient.get('/exchange-rates/rate-change', {
        params: { currency }
      });
      return response.data || {
        currency,
        change_percentage: 0,
        is_positive: true,
        previous_rate: 1.0,
        current_rate: 1.0
      };
    } catch (error) {
      console.error('Failed to fetch rate change:', error);
      return {
        currency,
        change_percentage: 0,
        is_positive: true,
        previous_rate: 1.0,
        current_rate: 1.0
      };
    }
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  }

  /**
   * Format exchange rate
   */
  formatRate(rate: number, fromCurrency: string, toCurrency: string): string {
    return `1 ${fromCurrency} = ${this.formatCurrency(rate, toCurrency)}`;
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CHF': 'CHF',
      'CNY': '¥',
    };
    return symbols[currency] || currency;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
  }

  /**
   * Get currency name
   */
  getCurrencyName(currency: string): string {
    const names: Record<string, string> = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'INR': 'Indian Rupee',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'JPY': 'Japanese Yen',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
    };
    return names[currency] || currency;
  }
}

export const exchangeRateService = new ExchangeRateService();
