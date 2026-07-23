import React from "react";

interface ConnectorProps {
  isHovered: boolean;
}

export function Connector({ isHovered }: ConnectorProps) {
  // SVG paths and double-sketched paths to create a doodle/hand-drawn look
  // color specifies the permanent color for each arrow (upper: black, bottom: yellow)
  const connectors = [
    {
      id: "top-left", // Connects "Scalable" card to Layer 4 (Application Layer)
      color: "#111111",
      path: "M 90,60 C 130,55 170,110 185,160",
      sketchPath: "M 91,59 C 132,56 168,112 186,159",
      arrowhead: "M 175,152 L 185,160 L 181,146",
      arrowheadSketch: "M 176,151 L 186,159 L 182,145",
      startX: 90,
      startY: 60,
      endX: 185,
      endY: 160,
    },
    {
      id: "top-right", // Connects "Reliable" card to Layer 3 (Service Layer)
      color: "#111111",
      path: "M 390,60 C 350,55 310,130 295,190",
      sketchPath: "M 389,61 C 348,54 312,132 294,189",
      arrowhead: "M 305,182 L 295,190 L 299,176",
      arrowheadSketch: "M 306,183 L 294,189 L 298,175",
      startX: 390,
      startY: 60,
      endX: 295,
      endY: 190,
    },
    {
      id: "bottom-left", // Connects "High Performance" card to Layer 2 (Analytics Layer)
      color: "#FFD84D",
      path: "M 125,340 C 155,340 175,290 185,220",
      sketchPath: "M 126,339 C 154,341 174,288 186,221",
      arrowhead: "M 179,232 L 185,220 L 191,228",
      arrowheadSketch: "M 180,231 L 186,221 L 192,229",
      startX: 125,
      startY: 340,
      endX: 185,
      endY: 220,
    },
    {
      id: "bottom-right", // Connects "Production Ready" card to Layer 1 (Infrastructure Layer)
      color: "#FFD84D",
      path: "M 355,340 C 325,340 305,310 295,250",
      sketchPath: "M 354,341 C 326,339 306,312 294,251",
      arrowhead: "M 301,262 L 295,250 L 289,258",
      arrowheadSketch: "M 302,263 L 294,251 L 288,259",
      startX: 355,
      startY: 340,
      endX: 295,
      endY: 250,
    },
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 select-none overflow-visible"
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Base Hand-Drawn / Doodle Sketched Lines */}
      {connectors.map((c) => (
        <g key={`${c.id}-base-group`} className="transition-all duration-300">
          {/* Main sketch line */}
          <path
            d={c.path}
            stroke={c.color}
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{
              opacity: isHovered ? 0.8 : 0.45,
            }}
          />
          {/* Secondary slightly offset sketchy line */}
          <path
            d={c.sketchPath}
            stroke={c.color}
            strokeWidth="0.8"
            strokeLinecap="round"
            style={{
              opacity: isHovered ? 0.5 : 0.25,
            }}
          />

          {/* Sketched Arrowheads */}
          <path
            d={c.arrowhead}
            stroke={c.color}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: isHovered ? 0.8 : 0.45,
            }}
          />
          <path
            d={c.arrowheadSketch}
            stroke={c.color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: isHovered ? 0.5 : 0.25,
            }}
          />
        </g>
      ))}

      {/* Network Traffic Glow Packets moving along the doodle paths */}
      {connectors.map((c) => (
        <path
          key={`${c.id}-packet`}
          d={c.path}
          stroke={c.color}
          strokeWidth={isHovered ? "2.2" : "1.6"}
          strokeLinecap="round"
          strokeDasharray="8 80"
          className="animate-flow-packet"
          style={{
            opacity: isHovered ? 1.0 : 0.75,
            transition: "stroke-width 0.3s, opacity 0.3s",
            animationDelay: c.id === "top-left" || c.id === "bottom-right" ? "0s" : "1.5s",
          }}
        />
      ))}

      {/* Pulsing Nodes where connectors attach */}
      {connectors.map((c) => (
        <g key={`${c.id}-nodes`}>
          {/* Card Anchor Node (Tiny Yellow Node) */}
          <circle
            cx={c.startX}
            cy={c.startY}
            r="3"
            fill="#FFD84D"
            className="animate-pulse"
            style={{ animationDuration: "2s" }}
          />
          <circle
            cx={c.startX}
            cy={c.startY}
            r={isHovered ? "6" : "0"}
            stroke="rgba(252, 221, 45, 0.4)"
            strokeWidth="1"
            className="transition-all duration-300"
          />

          {/* Stack Anchor Node (Pulsing Yellow Node) */}
          <circle
            cx={c.endX}
            cy={c.endY}
            r="3.5"
            fill="#FFD84D"
            className="animate-ping"
            style={{ animationDuration: "3s" }}
          />
          <circle
            cx={c.endX}
            cy={c.endY}
            r="3"
            fill="#FFD84D"
          />
        </g>
      ))}
    </svg>
  );
}
export default Connector;
