import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios.js';

// A handful of hardcoded "signature" combos just for browsing appeal -
// every one of them, and any fully custom combo, is actually built and
// priced through the step-by-step builder at /builder.
const SIGNATURE_PIZZAS = [
  { name: 'Margherita Classic', desc: 'Thin Crust, Classic Tomato, Mozzarella', tag: 'Bestseller' },
  { name: 'BBQ Chicken Blast', desc: 'Cheese Burst, BBQ Sauce, Cheddar + Onion, Bell Pepper', tag: 'Spicy' },
  { name: 'Garden Veggie', desc: 'Whole Wheat, Pesto, Mozzarella + Mushroom, Olives, Spinach', tag: 'Vegetarian' },
  { name: 'Four Cheese Deluxe', desc: 'Thick Crust, Alfredo, Parmesan + Cheddar', tag: 'Cheese Lovers' },
];

const Dashboard = () => {
  const [stock, setStock] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/pizza/options')
      .then(({ data }) => setStock(data))
      .catch(() => setError('Could not load live ingredient availability.'));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Our Pizzas</h1>
        <Link to="/builder" className="btn-primary">
          🍕 Build Your Own Pizza
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card-grid">
        {SIGNATURE_PIZZAS.map((p) => (
          <div className="pizza-card" key={p.name}>
            <div className="pizza-card-tag">{p.tag}</div>
            <h3>{p.name}</h3>
            <p>{p.desc}</p>
            <Link to="/builder" className="btn-secondary">
              Order a version of this
            </Link>
          </div>
        ))}
      </div>

      {stock && (
        <div className="stock-strip">
          <span>{stock.base.length} bases</span>
          <span>{stock.sauce.length} sauces</span>
          <span>{stock.cheese.length} cheeses</span>
          <span>{stock.vegetable.length} veggie toppings</span>
          <span>in stock right now</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
