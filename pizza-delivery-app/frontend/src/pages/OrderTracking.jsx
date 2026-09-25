import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/axios.js';

const STATUS_STEPS = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'];
const POLL_INTERVAL_MS = 5000;

// Polls the order every few seconds so a status change the admin makes
// shows up here without the user needing to refresh.
const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer;

    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load order');
      } finally {
        if (!cancelled) timer = setTimeout(fetchOrder, POLL_INTERVAL_MS);
      }
    };

    fetchOrder();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!order) return <div className="page-loading">Loading order...</div>;

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="page">
      <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>

      {order.status === 'Cancelled' ? (
        <div className="alert alert-error">This order was cancelled.</div>
      ) : (
        <div className="tracking-strip">
          {STATUS_STEPS.map((s, idx) => (
            <div key={s} className={`tracking-step ${idx <= currentStepIndex ? 'reached' : ''}`}>
              <div className="tracking-dot" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      <div className="summary-card">
        <h3>Items</h3>
        {order.items.map((item, idx) => (
          <div key={idx} className="order-item-row">
            <span>
              {item.base?.name}, {item.sauce?.name}, {item.cheese?.name}
              {item.vegetables?.length ? `, ${item.vegetables.map((v) => v.name).join(', ')}` : ''}
              {' '}× {item.quantity}
            </span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="summary-total">
          <span>Total paid: ₹{order.totalAmount}</span>
        </div>
      </div>

      <p><Link to="/orders">← Back to my orders</Link></p>
    </div>
  );
};

export default OrderTracking;
