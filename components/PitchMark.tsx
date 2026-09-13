export function PitchMark() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <line
        x1="400"
        y1="0"
        x2="400"
        y2="800"
        stroke="#97CADB"
        strokeOpacity="0.06"
        strokeWidth="1.5"
      />
      <circle
        cx="400"
        cy="400"
        r="110"
        stroke="#97CADB"
        strokeOpacity="0.06"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="400" cy="400" r="3" fill="#97CADB" fillOpacity="0.08" />
    </svg>
  );
}
