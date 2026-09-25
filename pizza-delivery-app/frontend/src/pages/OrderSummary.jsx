import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';

// Reads the raw ingredient-id selection saved by the builder, then asks the
// pizza options endpoint for names/prices so it can render a summary -
// the actual authoritative total is always recomputed server-side at
// checkout time, this is just a preview.
const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [options, setOptions] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('pizzaOrder');
    if (!raw) {
      navigate('/builder');
      return;
    }
    setOrder(JSON.parse(raw));

    api
      .get('/pizza/options')
      .then(({ data }) => setOptions(data))
      .catch(() => setError('Could not load pizza details.'));

    api.get('/auth/me').then(({ data }) => {
      if (data.address) setAddress(data.address);
      if (data.phone) setPhone(data.phone);
    }).catch(() => {});
  }, [navigate]);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!order || !options) return <div className="page-loading">Loading order summary...</div>;

  const findItem = (category, id) => options[category].find((o) => o.id === id);

  const base = findItem('base', order.base);
  const sauce = findItem('sauce', order.sauce);
  const cheese = findItem('cheese', order.cheese);
  const vegetables = order.vegetables.map((id) => findItem('vegetable', id)).filter(Boolean);

  const unitPrice =
    (base?.price || 0) + (sauce?.price || 0) + (cheese?.price || 0) +
    vegetables.reduce((s, v) => s + v.price, 0);
  const total = unitPrice * order.quantity;

  const proceedToCheckout = () => {
    if (!address.trim() || !phone.trim()) {
      setError('Please provide a delivery address and contact phone.');
      return;
    }
    sessionStorage.setItem('checkoutInfo', JSON.stringify({ deliveryAddress: address, contactPhone: phone }));
    navigate('/checkout');
  };

  return (
    <div className="page">
      <h1>Order Summary</h1>

      <div className="summary-card">
        <h3>Your Custom Pizza × {order.quantity}</h3>
        <ul className="summary-list">
          <li><span>Base</span><span>{base?.name} (₹{base?.price})</span></li>
          <li><span>Sauce</span><span>{sauce?.name} (₹{sauce?.price})</span></li>
          <li><span>Cheese</span><span>{cheese?.name} (₹{cheese?.price})</span></li>
          <li>
            <span>Vegetables</span>
            <span>{vegetables.length ? vegetables.map((v) => v.name).join(', ') : 'None'}</span>
          </li>
        </ul>
        <div className="summary-total">
          <span>Unit price: ₹{unitPrice}</span>
          <span>Total: ₹{total}</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="summary-card">
        <h3>Delivery details</h3>
        <label>Delivery address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} required />
        <label>Contact phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>

      <div className="builder-nav">
        <button className="btn-secondary" onClick={() => navigate('/builder')}>
          Edit pizza
        </button>
        <button className="btn-primary" onClick={proceedToCheckout}>
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
