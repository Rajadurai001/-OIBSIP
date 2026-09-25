import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';
import StepIndicator from '../components/StepIndicator.jsx';

const STEPS = ['Base', 'Sauce', 'Cheese', 'Vegetables'];

const PizzaBuilder = () => {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState({ base: null, sauce: null, cheese: null, vegetables: [] });
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/pizza/options')
      .then(({ data }) => setOptions(data))
      .catch(() => setError('Could not load pizza options. Please try again later.'));
  }, []);

  const toggleVegetable = (id) => {
    setSelection((prev) => {
      const has = prev.vegetables.includes(id);
      return {
        ...prev,
        vegetables: has ? prev.vegetables.filter((v) => v !== id) : [...prev.vegetables, id],
      };
    });
  };

  const canGoNext = () => {
    if (step === 0) return !!selection.base;
    if (step === 1) return !!selection.sauce;
    if (step === 2) return !!selection.cheese;
    return true; // vegetables step is optional
  };

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      // Hand off the raw selection (ids only) to the order summary page -
      // pricing is always recalculated server-side, never trusted from here.
      sessionStorage.setItem(
        'pizzaOrder',
        JSON.stringify({ ...selection, quantity })
      );
      navigate('/order-summary');
    }
  };

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!options) return <div className="page-loading">Loading pizza options...</div>;

  const renderSingleSelect = (category) => (
    <div className="option-grid">
      {options[category].map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`option-card ${selection[category] === opt.id ? 'selected' : ''}`}
          onClick={() => setSelection({ ...selection, [category]: opt.id })}
        >
          <span className="option-name">{opt.name}</span>
          <span className="option-price">{opt.price > 0 ? `+₹${opt.price}` : 'Free'}</span>
        </button>
      ))}
      {options[category].length === 0 && <p>No {category}s currently in stock.</p>}
    </div>
  );

  return (
    <div className="page">
      <h1>Build Your Pizza</h1>
      <StepIndicator steps={STEPS} current={step} />

      <div className="builder-panel">
        {step === 0 && (
          <>
            <h2>Step 1 · Choose a base</h2>
            {renderSingleSelect('base')}
          </>
        )}
        {step === 1 && (
          <>
            <h2>Step 2 · Choose a sauce</h2>
            {renderSingleSelect('sauce')}
          </>
        )}
        {step === 2 && (
          <>
            <h2>Step 3 · Choose a cheese</h2>
            {renderSingleSelect('cheese')}
          </>
        )}
        {step === 3 && (
          <>
            <h2>Step 4 · Choose vegetables (optional, select any)</h2>
            <div className="option-grid">
              {options.vegetable.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`option-card ${selection.vegetables.includes(opt.id) ? 'selected' : ''}`}
                  onClick={() => toggleVegetable(opt.id)}
                >
                  <span className="option-name">{opt.name}</span>
                  <span className="option-price">+₹{opt.price}</span>
                </button>
              ))}
            </div>

            <div className="quantity-row">
              <label>Quantity</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </>
        )}
      </div>

      <div className="builder-nav">
        <button className="btn-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </button>
        <button className="btn-primary" disabled={!canGoNext()} onClick={goNext}>
          {step === STEPS.length - 1 ? 'Review Order' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default PizzaBuilder;
