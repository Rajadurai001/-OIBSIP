import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios.js';

const POLL_INTERVAL_MS = 8000;

const MyOrders = () => {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer;

    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load orders');
      } finally {
        if (!cancelled) timer = setTimeout(fetchOrders, POLL_INTERVAL_MS);
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!orders) return <div className="page-loading">Loading your orders...</div>;

  return (
    <div className="page">
      <h1>My Orders</h1>
      {orders.length === 0 && <p>You haven't placed any orders yet.</p>}
      <div className="order-list">
        {orders.map((o) => (
          <Link to={`/orders/${o._id}`} key={o._id} className="order-list-row">
            <div>
              <strong>#{o._id.slice(-6).toUpperCase()}</strong>
              <span className={`status-badge status-${o.status.replace(/\s+/g, '-').toLowerCase()}`}>
                {o.status}
              </span>
            </div>
            <span>₹{o.totalAmount}</span>
            <span>{new Date(o.createdAt).toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
