import { useCallback, useState } from 'react';
import { useGetQrCode } from '../../api/authHooks';
import '../../styles/login.css';
import { TotpInput } from '../shared/TotpInput';

export const OfferTfa = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [tfaCode, setTfaCode] = useState('');

  const { qrCode, enableTfa } = useGetQrCode();

  const handleSubmit = useCallback(async () => {
    try {
      await enableTfa(tfaCode);
      onDone();
    } catch (error) {
      console.error(error);
    }
  }, [tfaCode]);

  if (step === 0) {
    return (
      <div className="login-container">
        <div className="login-form-container login-help">
          <span>Do you want to setup two-factor authentication?</span>
          <div className="form-group">
            <button className="login-button" onClick={() => onDone()}>
              No
            </button>
            <button className="login-button" onClick={() => setStep(1)}>
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form-container text-center">
        <div className="login-help">Scan this code with your auth application</div>
        <br />
        <img src={qrCode} alt="TOTP QR Code" />
        <br />
        <form onSubmit={() => handleSubmit()} className="login-form">
          <div className="form-group">
            <div className="login-help">Enter the OTP code to verify the setup:</div>
            <TotpInput onComplete={(code) => setTfaCode(code)} />
            <button className="login-button" type="submit" disabled={tfaCode?.length < 6}>
              Enable TFA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
