import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShareQRCode } from '../components/ShareQRCode';
import { SketchButton } from '../components/SketchButton';
import { buildVisitUrl, loadSharedCity } from '../logic/shareState';
import type { ShareState } from '../logic/shareState';

const RESUME_SCENE_KEY = 'cat-builder-resume-scene';

export function ShareCityPage() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const [share, setShare] = useState<ShareState | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [copyHint, setCopyHint] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cityId) {
        setShare(null);
        return;
      }
      const loaded = await loadSharedCity(cityId);
      if (!cancelled) setShare(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [cityId]);

  const visitUrl = cityId ? buildVisitUrl(cityId) : '';

  const copyLink = useCallback(async () => {
    if (!visitUrl) return;
    try {
      await navigator.clipboard.writeText(visitUrl);
      setCopied(true);
      setCopyHint(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setCopyHint(true);
      linkRef.current?.focus();
      linkRef.current?.select();
    }
  }, [visitUrl]);

  const keepTeaching = () => {
    sessionStorage.setItem(RESUME_SCENE_KEY, 'teach');
    navigate('/build');
  };

  if (share === undefined) {
    return (
      <div className="paper-bg flex min-h-screen items-center justify-center">
        <p className="font-display text-ink/70">Loading your share page…</p>
      </div>
    );
  }

  if (share === null || !cityId) {
    return (
      <div className="paper-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl text-ink">This Cat City link is missing</h1>
        <p className="story-text max-w-md text-ink/75">
          We could not load this Cat City. Try creating a new share link from the builder.
        </p>
        <SketchButton variant="primary" onClick={() => navigate('/build')}>
          Go to Cat City
        </SketchButton>
      </div>
    );
  }

  return (
    <div className="paper-bg min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-8 px-4 py-10 md:px-8">
        <motion.header
          className="text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl text-ink md:text-4xl">Share Your Cat City</h1>
          <p className="story-text mx-auto mt-2 max-w-xl text-ink/75">
            Invite someone to draw a cat and test your Cat Gate. Save this page or QR code
            before refreshing — your new drawings are only kept until you leave or reload.
          </p>
          {share.cityName && (
            <p className="mt-2 font-display text-lg text-ink/80">{share.cityName}</p>
          )}
        </motion.header>

        <ShareQRCode url={visitUrl} />

        <motion.div
          className="sketch-card flex w-full max-w-lg flex-col gap-4 p-6"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <label className="font-display text-xs uppercase tracking-wide text-ink/50" htmlFor="share-link">
            Share link
          </label>
          <input
            ref={linkRef}
            id="share-link"
            readOnly
            className="w-full rounded-xl border-2 border-dashed border-ink/25 bg-paper-light px-3 py-2 font-mono text-xs text-ink/80 md:text-sm"
            value={visitUrl}
            onFocus={(e) => e.target.select()}
          />
          <SketchButton variant="primary" onClick={copyLink}>
            {copied ? 'Link copied.' : 'Copy Link'}
          </SketchButton>
          {copyHint && (
            <p className="text-center text-sm text-ink/70">Copy this link to share.</p>
          )}
        </motion.div>

        <div className="flex w-full max-w-lg flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row">
          <SketchButton variant="secondary" onClick={() => navigate(`/visit/${cityId}`)}>
            Preview Visitor Test
          </SketchButton>
          <SketchButton variant="secondary" onClick={keepTeaching}>
            Keep Teaching
          </SketchButton>
          <SketchButton variant="ghost" onClick={() => navigate('/new')}>
            Start Over
          </SketchButton>
        </div>
      </div>
    </div>
  );
}
