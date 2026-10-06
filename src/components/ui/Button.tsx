import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: { background: '#3b82f6', color: '#fff', border: '1px solid #2563eb' },
  danger:  { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' },
  warning: { background: '#451a03', color: '#fde047', border: '1px solid #92400e' },
  ghost:   { background: 'transparent', color: '#94a3b8', border: '1px solid #2e3340' },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: '0.375rem 0.75rem', fontSize: '0.75rem' },
  md: { padding: '0.5rem 1.25rem', fontSize: '0.875rem' },
};

export function Button({ variant = 'primary', size = 'md', children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        borderRadius: '0.375rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        fontFamily: 'inherit',
        ...style,
      }}
      onMouseEnter={(e) => { (e.currentTarget.style.opacity = '0.85'); }}
      onMouseLeave={(e) => { (e.currentTarget.style.opacity = '1'); }}
    >
      {children}
    </button>
  );
}
