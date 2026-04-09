// src/components/Common/FormInput.jsx
import React from 'react';

export const FormInput = ({ label, name, type = 'text', value, onChange, error, required, placeholder, ...props }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={name} style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: 6,
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = '#3b82f6';
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = '#d1d5db';
        }}
        {...props}
      />
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

export const FormSelect = ({ label, name, value, onChange, options, error, required, placeholder }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={name} style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: 6,
          fontSize: 14,
          backgroundColor: 'white',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = '#3b82f6';
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = '#d1d5db';
        }}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

export const FormTextarea = ({ label, name, value, onChange, rows = 3, error, required, placeholder }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={name} style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: 6,
          fontSize: 14,
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = '#3b82f6';
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = '#d1d5db';
        }}
      />
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

// Additional form components for consistency

export const FormCheckbox = ({ label, name, checked, onChange, error, required }) => {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        style={{
          width: 16,
          height: 16,
          cursor: 'pointer',
          accentColor: '#3b82f6',
        }}
      />
      <label htmlFor={name} style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {error && <p style={{ marginLeft: 'auto', fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

export const FormRadioGroup = ({ label, name, value, onChange, options, error, required }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {options.map(option => (
          <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: '#374151' }}>{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
};