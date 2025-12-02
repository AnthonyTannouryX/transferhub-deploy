import { useEffect, useState, useRef } from 'react';
import { CreditCard } from 'lucide-react';

interface StripeCardPreviewProps {
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  focused?: 'number' | 'name' | 'expiry' | 'cvc' | null;
}

export function StripeCardPreview({ 
  cardNumber, 
  cardholderName, 
  expiryMonth, 
  expiryYear,
  focused 
}: StripeCardPreviewProps) {
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'discover' | 'default'>('default');
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (cardNumber) {
      const num = cardNumber.replace(/\s/g, '');
      if (num.startsWith('4')) setCardBrand('visa');
      else if (num.startsWith('5')) setCardBrand('mastercard');
      else if (num.startsWith('3')) setCardBrand('amex');
      else if (num.startsWith('6')) setCardBrand('discover');
      else setCardBrand('default');
    } else {
      setCardBrand('default');
    }
  }, [cardNumber]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const getCardGradient = () => {
    switch (cardBrand) {
      case 'visa':
        return 'bg-gradient-to-br from-blue-600 to-blue-800';
      case 'mastercard':
        return 'bg-gradient-to-br from-orange-500 to-red-600';
      case 'amex':
        return 'bg-gradient-to-br from-green-600 to-blue-700';
      case 'discover':
        return 'bg-gradient-to-br from-orange-400 to-orange-600';
      default:
        return 'bg-gradient-to-br from-slate-600 to-slate-800';
    }
  };

  const formatCardNumber = (num?: string) => {
    if (!num) return '•••• •••• •••• ••••';
    const numStr = String(num).replace(/\s/g, '');
    if (!numStr) return '•••• •••• •••• ••••';
    return numStr.match(/.{1,4}/g)?.join(' ') || numStr;
  };

  const getBrandIcon = () => {
    switch (cardBrand) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MC';
      case 'amex':
        return 'AMEX';
      case 'discover':
        return 'DI';
      default:
        return <CreditCard className="w-8 h-8" />;
    }
  };

  return (
    <div className="perspective-1000 mb-6 transform-gpu w-full">
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`${getCardGradient()} rounded-3xl shadow-2xl p-6 text-white min-h-[240px] w-full flex flex-col justify-between transition-all duration-300 ease-out relative overflow-hidden group`}
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.05, 1.05, 1.05)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)',
          }}></div>
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -inset-full w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent transform skew-x-12 animate-shimmer"></div>
        </div>

        {/* Card Brand Logo */}
        <div className="flex justify-between items-start relative z-10">
          <div className="text-3xl font-bold opacity-20 group-hover:opacity-30 transition-opacity duration-300">
            <CreditCard className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-lg group-hover:bg-white/30 transition-all duration-300">
            {getBrandIcon()}
          </div>
        </div>

        {/* Card Number */}
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-white/70 font-medium tracking-wider">CARD NUMBER</div>
          <div className={`text-3xl font-mono tracking-widest transition-all duration-300 ${focused === 'number' ? 'text-yellow-300 scale-105' : 'text-white'}`}>
            {formatCardNumber(cardNumber)}
          </div>
        </div>

        {/* Cardholder Name and Expiry */}
        <div className="flex justify-between items-end relative z-10">
          <div className="space-y-1">
            <div className="text-xs text-white/70 font-medium tracking-wider">CARDHOLDER</div>
            <div className={`text-base font-semibold uppercase tracking-wide transition-all duration-300 ${focused === 'name' ? 'text-yellow-300 scale-105' : 'text-white'}`}>
              {cardholderName || 'JOHN DOE'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/70 font-medium tracking-wider">EXPIRES</div>
            <div className={`text-base font-semibold tracking-wide transition-all duration-300 ${focused === 'expiry' ? 'text-yellow-300 scale-105' : 'text-white'}`}>
              {(expiryMonth || 'MM')}/{expiryYear || 'YY'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
