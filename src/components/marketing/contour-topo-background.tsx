"use client";

import React from "react";

interface TopoBackgroundProps {
  className?: string;
  opacity?: number;
  strokeColor?: string;
  withGrid?: boolean;
}

export function ContourTopoBackground({
  className = "",
  opacity = 0.08,
  strokeColor = "currentColor",
  withGrid = true,
}: TopoBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <defs>
          <pattern
            id="cadastral-grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke={strokeColor}
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            <circle cx="0" cy="0" r="1.5" fill={strokeColor} />
            <circle cx="80" cy="0" r="1.5" fill={strokeColor} />
            <circle cx="0" cy="80" r="1.5" fill={strokeColor} />
            <circle cx="80" cy="80" r="1.5" fill={strokeColor} />
          </pattern>
        </defs>

        {withGrid && (
          <rect width="100%" height="100%" fill="url(#cadastral-grid)" />
        )}

        {/* Major Topographic Contour Elevation Loops */}
        <g stroke={strokeColor} strokeWidth="1.2" fill="none">
          {/* Contour Line 1 - 1,270m */}
          <path d="M-100 220 C 150 180, 280 290, 480 240 C 680 190, 850 310, 1100 260 C 1300 220, 1450 340, 1600 300" />
          
          {/* Contour Line 2 - 1,280m */}
          <path d="M-100 340 C 120 280, 310 410, 560 360 C 780 320, 940 460, 1180 400 C 1360 360, 1500 480, 1600 440" />

          {/* Contour Line 3 - 1,290m (Main Plateau) */}
          <path
            d="M-100 480 C 180 420, 350 560, 640 500 C 880 450, 1020 620, 1260 550 C 1420 500, 1520 620, 1600 580"
            strokeWidth="1.8"
          />

          {/* Contour Line 4 - 1,300m */}
          <path d="M-100 620 C 220 560, 420 710, 720 650 C 960 600, 1120 780, 1340 700 C 1480 650, 1560 760, 1600 720" />

          {/* Contour Line 5 - 1,310m */}
          <path d="M-100 760 C 260 700, 480 840, 800 790 C 1040 750, 1200 910, 1420 850 C 1520 810, 1580 890, 1600 860" />
        </g>

        {/* Intermediate Elevation Isolines */}
        <g stroke={strokeColor} strokeWidth="0.75" strokeDasharray="4 6" fill="none">
          <path d="M-100 160 C 100 120, 240 220, 440 180 C 640 140, 810 250, 1060 210 C 1260 170, 1410 280, 1600 240" />
          <path d="M-100 280 C 140 230, 290 350, 520 300 C 730 260, 900 390, 1140 330 C 1330 290, 1470 410, 1600 370" />
          <path d="M-100 410 C 160 350, 330 480, 600 430 C 830 380, 980 540, 1220 470 C 1390 430, 1500 550, 1600 510" />
          <path d="M-100 550 C 200 490, 390 640, 680 580 C 920 530, 1070 700, 1300 630 C 1450 580, 1540 690, 1600 650" />
          <path d="M-100 690 C 240 630, 450 780, 760 720 C 1000 670, 1160 840, 1380 780 C 1500 730, 1570 830, 1600 790" />
        </g>

        {/* Survey Cadastral Pins & Altitude Markers */}
        <g fill={strokeColor} className="text-[10px] font-mono select-none">
          <text x="320" y="275" opacity="0.8">▲ 1,280 m (Kabulonga Ridge)</text>
          <text x="740" y="485" opacity="0.8">▲ 1,295 m (Leopards Hill)</text>
          <text x="1150" y="385" opacity="0.8">▲ 1,285 m (Roma Park)</text>
          <text x="180" y="540" opacity="0.8">⌖ Stand 8942-A (2,400m²)</text>
          <text x="960" y="680" opacity="0.8">⌖ Stand 1102 (650m²)</text>
        </g>
      </svg>
    </div>
  );
}
