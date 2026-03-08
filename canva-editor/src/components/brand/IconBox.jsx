export const IconBox = ({ icon: Icon, size = 20, className = "" }) => (
  <div className={`w-10 h-10 rounded-icon bg-velox-cyan-dim border border-velox-cyan/15 flex items-center justify-center flex-shrink-0 ${className}`}>
    <Icon size={size} color="#2DD4F0" strokeWidth={1.5} />
  </div>
);
