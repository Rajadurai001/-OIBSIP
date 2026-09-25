import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/axios.js';

const STATUS_OPTIONS = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'];
const POLL_INTERVAL_MS = 10000;

// Admin order management panel. Updating a status here writes straight to
// the order in the DB - the user's dashboard/tracking page picks it up on
// its own next poll, so the change appears there within a few seconds.
const OrderManagement = () => {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = () => {
    adminApi
      .get('/admin/orders', { params: filter ? { status: filter } : {} })
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders'));
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    setError('');
    try {
      const { data } = await adminApi.put(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!orders) return <div className="page-loading">Loading orders...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Order Management</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6).toUpperCase()}</td>
              <td>{o.user?.name}<br /><small>{o.user?.phone}</small></td>
              <td>
                {o.items.map((item, idx) => (
                  <div key={idx}>
                    {item.base?.name}, {item.sauce?.name}, {item.cheese?.name} × {item.quantity}
                  </div>
                ))}
              </td>
              <td>₹{o.totalAmount}</td>
              <td>
                <select
                  value={o.status}
                  disabled={updatingId === o._id}
                  onChange={(e) => updateStatus(o._id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6}>No orders found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderManagement;
