'use client';

import { useEffect, useState } from 'react';

export function MainArea({ children }: { children: React.ReactNode }) {
  const [isCortes, setIsCortes] = useState(false);

  useEffect(() => {
    function sync() {
      setIsCortes(localStorage.getItem('cg160_mode') === 'cortes');
    }
    sync();
    window.addEventListener('storage', sync);
    // poll for same-tab mode switch
    const iv = setInterval(sync, 300);
    return () => { window.removeEventListener('storage', sync); clearInterval(iv); };
  }, []);

  return (
    <main className={`flex-1 overflow-y-auto transition-colors duration-200 ${isCortes ? 'bg-[#0a0202]' : 'bg-gray-950'}`}>
      {children}
    </main>
  );
}
