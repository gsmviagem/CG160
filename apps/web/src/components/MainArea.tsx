'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function MainArea({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const [isCortes, setIsCortes] = useState(false);
  const [animKey, setAnimKey]   = useState(0);
  const prevPath  = useRef(pathname);

  /* sync mode from localStorage */
  useEffect(() => {
    function sync() {
      setIsCortes(localStorage.getItem('cg160_mode') === 'cortes');
    }
    sync();
    const iv = setInterval(sync, 200);
    return () => clearInterval(iv);
  }, []);

  /* trigger re-animation on route change */
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setAnimKey(k => k + 1);
    }
  }, [pathname]);

  const bg = isCortes
    ? 'bg-[radial-gradient(ellipse_80%_50%_at_80%_-10%,rgba(120,20,20,0.15),transparent)] bg-[#0a0203]'
    : 'bg-[radial-gradient(ellipse_80%_50%_at_80%_-10%,rgba(60,50,140,0.12),transparent)] bg-[#060812]';

  return (
    <main
      className={`
        flex-1 overflow-y-auto transition-colors duration-300 min-h-screen
        ${bg}
      `}
    >
      <div key={animKey} className="page-enter h-full">
        {children}
      </div>
    </main>
  );
}
