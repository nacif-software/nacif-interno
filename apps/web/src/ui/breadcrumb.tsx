import { Fragment } from 'react';
import { Link } from 'react-router';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Navegação" className="flex items-center text-[15px]">
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 && (
            <span aria-hidden className="px-2 text-line">
              /
            </span>
          )}
          {item.to ? (
            <Link to={item.to} className="text-ink-muted hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink" aria-current="page">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
