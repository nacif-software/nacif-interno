import { useEffect, useState } from 'react';

/** Acompanha uma media query. Em ambientes sem matchMedia (testes) devolve `fallback`. */
export function useMediaQuery(query: string, fallback = true): boolean {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [matches, setMatches] = useState(() =>
    supported ? window.matchMedia(query).matches : fallback,
  );

  useEffect(() => {
    if (!supported) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query, supported]);

  return matches;
}

/** Breakpoint `md` do Tailwind (768px): layout desktop do design. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
