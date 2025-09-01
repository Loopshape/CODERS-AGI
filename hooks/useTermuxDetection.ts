import { useState, useEffect } from 'react';

export const useTermuxDetection = (): boolean => {
  const [isTermux, setIsTermux] = useState(false);

  useEffect(() => {
    // This is a simple simulation. In a real-world scenario, detection might be more complex.
    // We check for 'Android' in the user agent as a proxy for Termux, which primarily runs on Android.
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setIsTermux(true);
    }
  }, []);

  return isTermux;
};
