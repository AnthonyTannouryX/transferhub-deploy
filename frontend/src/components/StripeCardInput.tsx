import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { STRIPE_CONFIG } from '@/config';
import { StripeCardPreview } from './StripeCardPreview';

const stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY);

interface StripeCardInputProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isSubmitting?: boolean;
}

function StripeCardForm({ onSuccess, onError, isSubmitting }: StripeCardInputProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [focused, setFocused] = useState<'number' | 'name' | 'expiry' | 'cvc' | null>('number');
  const [cardError, setCardError] = useState<string | null>(null);
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const [cvcError, setCvcError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) {
      onError('Card element not found');
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: cardholderName,
      },
    });

    if (error) {
      onError(error.message || 'Failed to create payment method');
      return;
    }

    if (paymentMethod) {
      onSuccess(paymentMethod.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start min-h-[500px]">
      {/* Left Side - Card Preview */}
      <div className="lg:sticky lg:top-6 order-2 lg:order-1">
        <StripeCardPreview
          cardNumber={cardNumber}
          cardholderName={cardholderName}
          expiryMonth={expiryMonth}
          expiryYear={expiryYear}
          focused={focused}
        />
      </div>

      {/* Right Side - Form */}
      <div className="order-1 lg:order-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Card Number
            </label>
            <div 
              className={`p-4 bg-white border-2 rounded-xl transition-all ${
                focused === 'number' ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <CardNumberElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#111827',
                      fontFamily: 'system-ui',
                      '::placeholder': { color: '#9CA3AF' },
                    },
                  },
                }}
                onChange={(e) => {
                  if (e.complete) {
                    setCardNumber('•••• •••• •••• ••••');
                    setCardError(null);
                  } else if (e.error) {
                    setCardError(e.error.message);
                  } else {
                    setCardError(null);
                  }
                }}
                onFocus={() => setFocused('number')}
                onBlur={() => setFocused(null)}
              />
            </div>
            {cardError && (
              <p className="mt-2 text-sm text-red-600">{cardError}</p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              className={`w-full px-4 py-4 border-2 rounded-xl transition-all text-lg ${
                focused === 'name' ? 'border-primary' : 'border-gray-200'
              }`}
            />
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Expiry
              </label>
              <div className={`p-4 bg-white border-2 rounded-xl transition-all ${
                focused === 'expiry' ? 'border-primary' : 'border-gray-200'
              }`}>
                <CardExpiryElement
                  options={{ style: { base: { fontSize: '16px', color: '#111827' } } }}
                  onChange={(e) => {
                    if (e.error) {
                      setExpiryError(e.error.message);
                    } else {
                      setExpiryError(null);
                    }
                  }}
                  onFocus={() => setFocused('expiry')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              {expiryError && (
                <p className="mt-2 text-sm text-red-600">{expiryError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                CVC
              </label>
              <div className={`p-4 bg-white border-2 rounded-xl transition-all ${
                focused === 'cvc' ? 'border-primary' : 'border-gray-200'
              }`}>
                <CardCvcElement
                  options={{ style: { base: { fontSize: '16px', color: '#111827' } } }}
                  onChange={(e) => {
                    if (e.error) {
                      setCvcError(e.error.message);
                    } else {
                      setCvcError(null);
                    }
                  }}
                  onFocus={() => setFocused('cvc')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              {cvcError && (
                <p className="mt-2 text-sm text-red-600">{cvcError}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isSubmitting}
            className="w-full h-14 text-lg font-semibold gradient-hero shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? 'Processing...' : 'Add Payment Method'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function StripeCardInput(props: StripeCardInputProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm {...props} />
    </Elements>
  );
}
