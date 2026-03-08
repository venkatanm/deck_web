export const EyebrowLabel = ({ children, className = "" }) => (
  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-chip bg-velox-cyan-dim border border-velox-cyan/25 text-velox-cyan text-[11px] font-semibold tracking-[0.18em] uppercase ${className}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-velox-cyan" style={{ boxShadow: "0 0 6px #2DD4F0" }} />
    {children}
  </div>
);
