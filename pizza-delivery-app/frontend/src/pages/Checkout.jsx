import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';

// Loads /checkout.js from index.html (see the <script> tag there).
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const check = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(check);
        resolve(true);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(check);
      resolve(!!window.Razorpay);
    }, 5000);
  });

const Checkout = () => {
  const [status, setStatus] = useState('idle'); // idle | creating | paying | error
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const pizzaOrder = JSON.parse(sessionStorage.getItem('pizzaOrder') || 'null');
  const checkoutInfo = JSON.parse(sessionStorage.getItem('checkoutInfo') || 'null');

  useEffect(() => {
    if (!pizzaOrder || !checkoutInfo) navigate('/builder');
  }, [pizzaOrder, checkoutInfo, navigate]);

  const buildItemsPayload = () => [
    {
      base: pizzaOrder.base,
      sauce: pizzaOrder.sauce,
      cheese: pizzaOrder.cheese,
      vegetables: pizzaOrder.vegetables,
      quantity: pizzaOrder.quantity,
    },
  ];

  const handlePay = async () => {
    setError('');
    setStatus('creating');
    try {
      const ready = await loadRazorpayScript();
      if (!ready) throw new Error('Payment gateway failed to load. Check your connection.');

      const items = buildItemsPayload();
      const { data: rpOrder } = await api.post('/payment/create-order', { items });

      setStatus('paying');

      const rzp = new window.Razorpay({
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: 'Pizza Hub',
        description: 'Custom pizza order (test mode)',
        order_id: rpOrder.orderId,
        handler: async (response) => {
          try {
            const { data: order } = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items,
              deliveryAddress: checkoutInfo.deliveryAddress,
              contactPhone: checkoutInfo.contactPhone,
            });
            sessionStorage.removeItem('pizzaOrder');
            sessionStorage.removeItem('checkoutInfo');
            navigate(`/orders/${order._id}`);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
            setStatus('error');
          }
        },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
        theme: { color: '#e63946' },
      });

      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed');
        setStatus('error');
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not start checkout');
      setStatus('error');
    }
  };

  if (!pizzaOrder || !checkoutInfo) return null;

  return (
    <div className="page">
      <h1>Checkout</h1>
      <div className="summary-card">
        <p>Delivering to: <strong>{checkoutInfo.deliveryAddress}</strong></p>
        <p>Contact: <strong>{checkoutInfo.contactPhone}</strong></p>
        <p className="hint">
          This uses Razorpay's test mode - no real payment is taken. In the widget that opens,
          use test card <code>4111 1111 1111 1111</code>, any future expiry, and any CVV,
          or simply click "Success" if that's the flow shown.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-primary" onClick={handlePay} disabled={status === 'creating' || status === 'paying'}>
        {status === 'creating' ? 'Preparing payment...' : status === 'paying' ? 'Waiting for payment...' : 'Pay with Razorpay'}
      </button>
    </div>
  );
};

export default Checkout;
