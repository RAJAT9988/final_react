type AtomoLogoProps = {
  className?: string;
};

export const AtomoLogo = ({ className }: AtomoLogoProps) => {
  return (
    <div
      className={`flex items-center gap-2.5 ${className ?? ''}`}
      aria-label="Atomo"
    >
      <img
        src="/atomo.png"
        alt=""
        className="h-8 w-8 shrink-0 object-contain invert"
      />
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Atomo
      </span>
    </div>
  );
};
