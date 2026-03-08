export const VeloxMark = ({ size = 36, color = "white", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" {...props}>
    <path
      d="M8 12L26 42L44 12"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 12L20 12L26 26"
      stroke="#2DD4F0"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
