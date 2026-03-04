import { useState } from "react";
import { Search } from "lucide-react";
import * as Icons from "lucide-react";
import useEditorStore from "../store/useEditorStore";

const ICON_CATEGORIES = {
  Business: [
    "TrendingUp",
    "TrendingDown",
    "BarChart2",
    "PieChart",
    "DollarSign",
    "Briefcase",
    "Building2",
    "Users",
    "Target",
    "Award",
    "Star",
    "CheckCircle",
    "XCircle",
    "AlertCircle",
    "Zap",
    "Globe",
    "ShoppingCart",
    "Package",
    "Truck",
    "CreditCard",
  ],
  Communication: [
    "MessageCircle",
    "Mail",
    "Phone",
    "Video",
    "Bell",
    "Share2",
    "Wifi",
    "Bluetooth",
    "Radio",
    "Podcast",
    "Rss",
    "Link",
  ],
  "Tech & Data": [
    "Code2",
    "Database",
    "Server",
    "Cloud",
    "Lock",
    "Shield",
    "Cpu",
    "HardDrive",
    "Monitor",
    "Smartphone",
    "Layers",
    "GitBranch",
    "Terminal",
    "Bug",
    "Braces",
  ],
  "Navigation & UI": [
    "ArrowRight",
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
    "ChevronRight",
    "ChevronLeft",
    "Plus",
    "Minus",
    "X",
    "Check",
    "Search",
    "Settings",
    "Menu",
    "MoreHorizontal",
  ],
  "People & Society": [
    "User",
    "Users",
    "UserCheck",
    "Heart",
    "ThumbsUp",
    "Smile",
    "Baby",
    "GraduationCap",
    "Stethoscope",
  ],
  "Nature & Science": [
    "Sun",
    "Moon",
    "Cloud",
    "Leaf",
    "Flower2",
    "Mountain",
    "Waves",
    "Wind",
    "Flame",
    "Droplets",
    "Globe",
  ],
  "Shapes & Decoration": [
    "Circle",
    "Square",
    "Triangle",
    "Star",
    "Diamond",
    "Hexagon",
  ],
};

export default function GraphicsPanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Business");
  const [color, setColor] = useState("#7c3aed");
  const [size, setSize] = useState(80);
  const addElement = useEditorStore((s) => s.addElement);

  const cats = Object.keys(ICON_CATEGORIES);

  const icons = search
    ? Object.values(ICON_CATEGORIES)
        .flat()
        .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : ICON_CATEGORIES[category] || [];

  const addIcon = (iconName) => {
    addElement({
      type: "graphic",
      iconName,
      x: 100,
      y: 100,
      width: size,
      height: size,
      fill: color,
      strokeWidth: 1.5,
      rotation: 0,
      opacity: 1,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0"
        />
        <label className="text-xs text-gray-500">Size:</label>
        <select
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded px-2 py-1 flex-1"
        >
          <option value={40}>Small (40px)</option>
          <option value={80}>Medium (80px)</option>
          <option value={120}>Large (120px)</option>
          <option value={200}>XL (200px)</option>
        </select>
      </div>

      {!search && (
        <div className="flex gap-1.5 flex-wrap">
          {cats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                category === cat
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {icons.map((iconName) => {
          const IconComp = Icons[iconName];
          if (!IconComp) return null;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => addIcon(iconName)}
              title={iconName}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-transparent hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <IconComp
                className="w-7 h-7 group-hover:scale-110 transition-transform"
                style={{ color }}
                strokeWidth={1.5}
              />
              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                {iconName.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
