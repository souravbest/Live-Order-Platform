

interface BannerProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  onDismiss?: () => void;
}

// Pure UI component — no business logic inside
export function Banner({ type, message, onDismiss }: BannerProps) {
  const colors: Record<string, string> = {
    error: '#7f1d1d',
    warning: '#451a03',
    info: '#1e3a8a',
    success: '#14532d',
  };
  const textColors: Record<string, string> = {
    error: '#fca5a5',
    warning: '#fde047',
    info: '#93c5fd',
    success: '#86efac',
  };

  return (
    <div
      role="alert"
      style={{
        backgroundColor: colors[type],
        color: textColors[type],
        padding: '0.75rem 1.25rem',
        borderRadius: '0.375rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.875rem',
        fontWeight: 500,
        animation: 'slideDown 0.2s ease',
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1.125rem',
            lineHeight: 1,
            marginLeft: '1rem',
            padding: '0.25rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
