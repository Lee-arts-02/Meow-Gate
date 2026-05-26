import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function NewCityPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/build', { replace: true });
  }, [navigate]);

  return (
    <div className="paper-bg flex min-h-screen items-center justify-center px-4">
      <p className="font-display text-lg text-ink/70">Starting a fresh Cat City…</p>
    </div>
  );
}
