import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import type { Role } from './lib/permissions';

// Route-level code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: Infinity },
    mutations: { retry: 0 },
  },
});

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" style={{
      padding: '2rem', color: '#fca5a5', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      maxWidth: 600, margin: '4rem auto',
    }}>
      <h2>Something went wrong</h2>
      <pre style={{ fontSize: '0.85rem', color: '#f87171', whiteSpace: 'pre-wrap' }}>
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        style={{
          background: '#3b82f6', color: '#fff', border: 'none',
          padding: '0.5rem 1.25rem', borderRadius: '0.375rem',
          cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start',
        }}
      >
        Try again
      </button>
    </div>
  );
}

function App() {
  const [role, setRole] = useState<Role>('agent');

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => queryClient.clear()}>
          <Suspense fallback={
            <div style={{ padding: '2rem', color: '#94a3b8', fontFamily: 'inherit' }}>
              Loading dashboard…
            </div>
          }>
            <Routes>
              <Route path="/" element={<DashboardPage role={role} onRoleChange={setRole} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
