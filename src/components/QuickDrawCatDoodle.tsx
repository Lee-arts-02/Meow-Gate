import { strokesToPath, strokesViewBox } from '../utils/strokesToPath';

type QuickDrawCatDoodleProps = {
  drawing: number[][][];
  className?: string;
  strokeWidth?: number;
};

export function QuickDrawCatDoodle({
  drawing,
  className = '',
  strokeWidth = 3,
}: QuickDrawCatDoodleProps) {
  const path = strokesToPath(drawing);
  const { viewBox } = strokesViewBox(drawing, 10);

  if (!path) {
    return (
      <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
        <text x="128" y="128" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.3">
          ?
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox={viewBox}
      className={`text-ink ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
