import { VeloxMark } from "./VeloxMark";

const sizes = { sm: 24, md: 36, lg: 52 };
const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

export const VeloxDecksLogo = ({ size = "md", className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <VeloxMark size={sizes[size]} />
    <span className={`font-sans ${textSizes[size]} tracking-tight leading-none select-none`}>
      <span className="font-black text-white">Velox</span>
      <span className="font-light" style={{ color: "#2DD4F0" }}> Decks</span>
    </span>
  </div>
);
