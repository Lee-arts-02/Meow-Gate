import { QRCodeSVG } from 'qrcode.react';

type ShareQRCodeProps = {
  url: string;
};

export function ShareQRCode({ url }: ShareQRCodeProps) {
  return (
    <div className="sketch-card flex flex-col items-center gap-4 border-[3px] border-dashed border-ink/35 bg-[#fffdf8] px-8 py-8 shadow-[2px_3px_0_rgba(42,42,42,0.08)]">
      <p className="font-display text-center text-sm uppercase tracking-wide text-ink/55">
        Scan to test this Cat Gate
      </p>
      <div className="rounded-2xl border-2 border-ink/15 bg-white p-4">
        <QRCodeSVG value={url} size={220} level="M" includeMargin={false} />
      </div>
    </div>
  );
}
