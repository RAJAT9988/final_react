/**
 * Atomo wordmark used at the top of the dashboard sidebar.
 */

type AtomoLogoProps = {
  className?: string;
};

export const AtomoLogo = ({ className }: AtomoLogoProps) => {
  return (
    <div className={className} aria-label="Atomo">
      <svg
        viewBox="0 0 140 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-auto"
        role="img"
      >
        <title>Atomo</title>
        <circle cx="14" cy="16" r="10" stroke="currentColor" strokeWidth="2" />
        <circle cx="14" cy="16" r="3.5" fill="currentColor" />
        <ellipse
          cx="14"
          cy="16"
          rx="10"
          ry="4"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="rotate(-35 14 16)"
        />
        <text
          x="32"
          y="22"
          fill="currentColor"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="18"
          fontWeight="700"
          letterSpacing="-0.02em"
        >
          Atomo
        </text>
      </svg>
    </div>
  );
};
