import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/axios.js';

const CATEGORY_LABELS = { base: 'Pizza Bases', sauce: 'Sauces', cheese: 'Cheeses', vegetable: 'Vegetables' };

// Inventory dashboard: shows current stock for every ingredient category,
// lets the admin manually update stock/price/threshold. Low-stock items
// (below their configured threshold) are highlighted - the actual email
// alert is sent by the backend's node-cron job, this just mirrors the state.
const AdminDashboard = () => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'base', stock: 50, price: 0, lowStockThreshold: 20 });

  const loadInventory = () => {
    adminApi
      .get('/admin/inventory')
      .then(({ data }) => setItems(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load inventory'));
  };

  useEffect(loadInventory, []);

  const handleFieldChange = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, [field]: value } : it)));
  };

  const saveItem = async (item) => {
    setSavingId(item._id);
    setError('');
    try {
      const { data } = await adminApi.put(`/admin/inventory/${item._id}`, {
        stock: Number(item.stock),
        price: Number(item.price),
        lowStockThreshold: Number(item.lowStockThreshold),
        isAvailable: item.isAvailable,
      });
      setItems((prev) => prev.map((it) => (it._id === data._id ? data : it)));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await adminApi.post('/admin/inventory', {
        ...newItem,
        stock: Number(newItem.stock),
        price: Number(newItem.price),
        lowStockThreshold: Number(newItem.lowStockThreshold),
      });
      setItems((prev) => [...prev, data]);
      setNewItem({ name: '', category: 'base', stock: 50, price: 0, lowStockThreshold: 20 });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add item');
    }
  };

  if (error && !items) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!items) return <div className="page-loading">Loading inventory...</div>;

  const grouped = items.reduce((acc, it) => {
    acc[it.category] = acc[it.category] || [];
    acc[it.category].push(it);
    return acc;
  }, {});

  return (
    <div className="page">
      <h1>Inventory Dashboard</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
        <div key={cat} className="inventory-section">
          <h2>{label}</h2>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Price (₹)</th>
                <th>Low-stock threshold</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(grouped[cat] || []).map((item) => (
                <tr key={item._id} className={item.stock < item.lowStockThreshold ? 'row-low-stock' : ''}>
                  <td>{item.name}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={item.stock}
                      onChange={(e) => handleFieldChange(item._id, 'stock', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => handleFieldChange(item._id, 'price', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={item.lowStockThreshold}
                      onChange={(e) => handleFieldChange(item._id, 'lowStockThreshold', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      onChange={(e) => handleFieldChange(item._id, 'isAvailable', e.target.checked)}
                    />
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      disabled={savingId === item._id}
                      onClick={() => saveItem(item)}
                    >
                      {savingId === item._id ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="inventory-section">
        <h2>Add new ingredient</h2>
        <form className="inline-form" onSubmit={addItem}>
          <input
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          >
            <option value="base">Base</option>
            <option value="sauce">Sauce</option>
            <option value="cheese">Cheese</option>
            <option value="vegetable">Vegetable</option>
          </select>
          <input
            type="number"
            placeholder="Stock"
            value={newItem.stock}
            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Threshold"
            value={newItem.lowStockThreshold}
            onChange={(e) => setNewItem({ ...newItem, lowStockThreshold: e.target.value })}
          />
          <button className="btn-primary" type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
