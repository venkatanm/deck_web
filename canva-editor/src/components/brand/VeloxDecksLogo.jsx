import { VeloxMark } from "./VeloxMark";

const sizes = { sm: 24, md: 36, lg: 52 };
const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

/** theme="dark"  → white text + cyan accent (for dark backgrounds)
 *  theme="light" → gray-900 text + blue-600 accent (for light backgrounds) */
export const VeloxDecksLogo = ({ size = "md", className = "", theme = "dark" }) => {
  const isLight = theme === "light";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <VeloxMark
        size={sizes[size]}
        color={isLight ? "#111827" : "white"}
        accentColor={isLight ? "#2563eb" : "#2DD4F0"}
      />
      <span className={`font-sans ${textSizes[size]} tracking-tight leading-none select-none`}>
        <span className="font-black" style={{ color: isLight ? "#111827" : "white" }}>Velox</span>
        <span className="font-light" style={{ color: isLight ? "#2563eb" : "#2DD4F0" }}> Decks</span>
      </span>
    </div>
  );
};
