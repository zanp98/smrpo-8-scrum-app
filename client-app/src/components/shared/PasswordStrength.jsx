import { passwordStrength } from 'check-password-strength';
import '../../styles/shared/passwordStrength.css';

export const PasswordStrengthMeter = ({ password = '' }) => {
  if (!password) {
    return null;
  }
  const strength = passwordStrength(password);
  return (
    <>
      <div className="color-indicators">
        <span className={strength.id >= 0 ? 'valid' : ''}></span>
        <span className={strength.id >= 1 ? 'valid' : ''}></span>
        <span className={strength.id >= 2 ? 'valid' : ''}></span>
        <span className={strength.id >= 3 ? 'valid' : ''}></span>
      </div>
      <div className="password-strength-text">Your password is {strength.value}</div>
    </>
  );
};
