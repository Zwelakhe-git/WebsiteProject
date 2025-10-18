// server.js
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('WRITE_THE_SECRET_KEY_HERE'); // 🔑 Replace!
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve payment.html and assets

// === STRIPE: Create Payment Intent (for Card & Apple Pay) ===
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd', email } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === PAYPAL CONFIG ===
const PAYPAL_CLIENT_ID = 'ATDZGyNpLtB6ZRo4FRQ1w9YrNq7CmQh1QayQfwZIWnPM7lhaWqWQRl9tN6rLoRKyYdIsmxEZ5tfUj8uY';     // From PayPal Developer
const PAYPAL_SECRET = 'EE-GXgWZG3gGXbvn-QqQaT8KHueSOhpB_-0gICYJlS2k7TBeUXyoluaRsf8c-Fe-SL6bYyQnHaU92ikv';           // From PayPal Developer
const PAYPAL_BASE = 'https://api.sandbox.paypal.com'; // Use 'https://api.paypal.com' for live

// Helper: Get PayPal Access Token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

// === PAYPAL: Create Order ===
app.post('/api/paypal-create-order', async (req, res) => {
  const { amount, currency = 'USD' } = req.body;
  try {
    const token = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: currency, value: amount } }],
      }),
    });
    const order = await response.json();
    res.json({ id: order.id });
  } catch (err) {
    console.error('PayPal create order error:', err);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// === PAYPAL: Capture Order ===
app.post('/api/paypal-capture-order', async (req, res) => {
  const { orderID } = req.body;
  try {
    const token = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const capture = await response.json();
    res.json(capture);
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
});

// === MONCASH CONFIG ===
const MONCASH_CLIENT_ID = 'YOUR_MONCASH_CLIENT_ID';   //  From MonCash Dashboard
const MONCASH_SECRET = 'YOUR_MONCASH_SECRET';         //  From MonCash Dashboard

// === MONCASH: Create Payment ===
app.post('/api/moncash-create-payment', async (req, res) => {
  const { amount, phone, email } = req.body;

  try {
    // Step 1: Get access token
    const tokenRes = await fetch('https://api.moncash.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${MONCASH_CLIENT_ID}:${MONCASH_SECRET}`).toString('base64'),
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error('MonCash auth failed');

    // Step 2: Create payment
    const paymentRes = await fetch('https://api.moncash.com/v1/payment/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: 'USD',
        reference: 'ORDER_' + Date.now(),
        customer: { phone: phone.replace(/\D/g, '') },
        return_url: `${req.protocol}://${req.get('host')}/payment-success.html`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancel.html`,
      }),
    });
    const paymentData = await paymentRes.json();
    if (!paymentRes.ok) throw new Error(paymentData.message || 'MonCash payment creation failed');

    res.json({ payment_url: paymentData.payment_url });
  } catch (err) {
    console.error('MonCash error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Optional: Success/Cancel pages (you can create these HTML files)
app.get('/payment-success.html', (req, res) => {
  res.send('<h1>✅ Payment Successful!</h1><p>Thank you for your purchase.</p><a href="/payment.html">Back to payment</a>');
});

app.get('/payment-cancel.html', (req, res) => {
  res.send('<h1>❌ Payment Cancelled</h1><p>You can try again.</p><a href="/payment.html">Back to payment</a>');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📄 Open: http://localhost:${PORT}/payment.html`);
});