import { enableUserTfa, getUserQRCode } from './backend';
import { useCallback, useEffect, useState } from 'react';

export const useGetQrCode = () => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserQRCode().then((result) => {
      setQrCode(result.data.qrCode);
    });
  }, [setQrCode]);

  const enableTfa = useCallback((code) => {
    setLoading(true);
    enableUserTfa(code).finally(() => setLoading(false));
  }, []);
  return {
    qrCode,
    enableTfa,
    loading,
  };
};
