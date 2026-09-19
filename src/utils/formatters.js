/**
 * Utility formatters for E-CARE Management System
 */

export const formatPaymentMethod = (method) => {
  if (!method) return 'Cash';
  let str = String(method).trim();
  if (!str) return 'Cash';

  // Standard Gateway mapping
  const map = {
    bkash: 'bKash',
    rocket: 'Rocket',
    nagad: 'Nagad',
    upay: 'Upay',
    cod: 'Cash on Delivery',
    bacs: 'Bank Transfer',
    bank: 'Bank Transfer',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    cash: 'Cash',
    credit: 'Credit',
    stripe: 'Stripe / Card',
    card: 'Card / Stripe',
    paypal: 'PayPal',
    sslcommerz: 'SSLCommerz',
    aamarpay: 'Aamarpay',
    amarpay: 'Aamarpay',
    razorpay: 'Razorpay',
    shurjopay: 'Shurjopay',
    woocommerce: 'Online Payment',
    'woocommerce gateway': 'Online Payment',
    'online payment': 'Online Payment'
  };

  const rawLower = str.toLowerCase();
  if (map[rawLower]) return map[rawLower];

  // Strip leading prefix woo_, woocommerce_, wc_, etc.
  let clean = str.replace(/^(woocommerce|woo|wc)\s*[-_:]?\s*/i, '').trim();
  const cleanLower = clean.toLowerCase();
  if (map[cleanLower]) return map[cleanLower];

  // If after stripping it became empty or was woocommerce
  if (!clean || cleanLower === 'woocommerce' || cleanLower === 'woo') {
    return 'Online Payment';
  }

  // Handle formatted strings like "woo_bkash" -> "bKash", "cash_on_delivery" -> "Cash On Delivery"
  if (clean.includes('_') || clean.includes('-')) {
    return clean
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(w => {
        const lw = w.toLowerCase();
        if (map[lw]) return map[lw];
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  // Capitalize first letter if all lowercase
  if (clean === clean.toLowerCase()) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
};
