// components/CropSelector.jsx
import React from "react";

const CROPS = [
  { id: "corn",       label: "Corn",        icon: "🌽" },
  { id: "soybean",    label: "Soybean",     icon: "🫘" },
  { id: "wheat",      label: "Wheat",       icon: "🌾" },
  { id: "tomato",     label: "Tomato",      icon: "🍅" },
  { id: "strawberry", label: "Strawberry",  icon: "🍓" },
];

export default function CropSelector({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CROPS.map(crop => (
        <button
          key={crop.id}
          onClick={() => onChange(crop.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all
            ${selected === crop.id
              ? "bg-ember border-ember text-stone-dark"
              : "bg-transparent border-stone/30 text-stone hover:border-ember hover:text-ember"
            }`}
        >
          <span>{crop.icon}</span>
          {crop.label}
        </button>
      ))}
    </div>
  );
}
