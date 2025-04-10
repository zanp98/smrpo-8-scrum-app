import React, { useRef } from 'react';

export const TotpInput = ({ onComplete }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value) {
      e.target.value = value.charAt(0); // Max 1 digit
      if (index < 5) inputsRef.current[index + 1].focus();
    }

    const totp = inputsRef.current.map((input) => input.value).join('');
    onComplete?.(totp);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[...Array(6)].map((_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="1"
          ref={(el) => (inputsRef.current[i] = el)}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          style={{
            width: '2rem',
            height: '2.5rem',
            fontSize: '1.5rem',
            textAlign: 'center',
            borderRadius: '5px',
            border: '1px solid #ccc',
          }}
        />
      ))}
    </div>
  );
};
