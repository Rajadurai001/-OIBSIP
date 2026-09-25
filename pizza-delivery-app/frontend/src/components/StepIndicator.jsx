import React from 'react';

const StepIndicator = ({ steps, current }) => (
  <div className="step-indicator">
    {steps.map((label, idx) => (
      <div key={label} className={`step ${idx === current ? 'active' : ''} ${idx < current ? 'done' : ''}`}>
        <span className="step-dot">{idx < current ? '✓' : idx + 1}</span>
        <span className="step-label">{label}</span>
      </div>
    ))}
  </div>
);

export default StepIndicator;
