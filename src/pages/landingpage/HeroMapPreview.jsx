// =============================================================================
// Hero Map Preview — REAL map tiles + custom SVG pins
// =============================================================================
//
// Uses the same CartoDB Voyager tile server the actual app uses (see
// HomePageEntrepreneur.jsx), so the landing-page hero renders a genuine
// street map of Montreal with real terrain, water, roads, and district
// labels. Non-interactive: no zoom, no pan, no scroll-hijack. Pins are
// inline SVG rendered via L.divIcon so they stay crisp and match the
// visual language of the pins the product actually uses.
// =============================================================================

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// -----------------------------------------------------------------------------
// SVG pin factory — builds an L.divIcon whose content is an inline SVG. Same
// glyph shape as the app's own map pins (dark filled circle, white outline,
// count badge). `hot=true` renders in urgent red; false in brand teal.
// -----------------------------------------------------------------------------
const buildPinIcon = ({ count, hot = false, size = 42 }) => {
  const color = hot ? "#dc2626" : "#14919B";
  const pulse = hot
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" opacity="0.18">
         <animate attributeName="r" values="${size / 2};${size / 2 + 8};${size / 2}" dur="2.4s" repeatCount="indefinite"/>
         <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2.4s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const html = `
    <svg width="${size + 16}" height="${size + 16}" viewBox="0 0 ${size + 16} ${size + 16}" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
      <g transform="translate(8 8)">
        ${pulse}
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}"
                stroke="#ffffff" stroke-width="3"
                filter="drop-shadow(0 3px 6px rgba(15,34,61,0.35))"/>
        <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle"
              fill="#ffffff" font-family="'Segoe UI', system-ui, sans-serif"
              font-size="${Math.round(size * 0.36)}" font-weight="700">${count}</text>
      </g>
    </svg>
  `;
  return L.divIcon({
    html,
    className: "lp-heromap-pin",
    iconSize: [size + 16, size + 16],
    iconAnchor: [(size + 16) / 2, (size + 16) / 2],
    popupAnchor: [0, -size / 2],
  });
};

// -----------------------------------------------------------------------------
// Pins to plot around the Montreal area (Longueuil / Brossard).
// Coordinates are hand-picked to sit over actual streets/districts so it
// reads like a real live view of jobs across a portfolio.
// -----------------------------------------------------------------------------
const PINS = [
  // Main callout — auto-open popup
  { lat: 45.507, lng: -73.573, count: 53, hot: true,  size: 44, featured: true },
  // Brossard/Longueuil area — matches the reference screenshot
  { lat: 45.484, lng: -73.484, count: 54, hot: true,  size: 44 },
  // Longueuil
  { lat: 45.545, lng: -73.518, count: 12, hot: true,  size: 38 },
  // Verdun / Nuns' Island
  { lat: 45.470, lng: -73.560, count: 8,  hot: false, size: 34 },
  // Plateau Mont-Royal
  { lat: 45.530, lng: -73.586, count: 6,  hot: false, size: 32 },
  // Downtown
  { lat: 45.501, lng: -73.575, count: 4,  hot: false, size: 30 },
  // Westmount
  { lat: 45.485, lng: -73.605, count: 3,  hot: false, size: 30 },
  // Saint-Laurent
  { lat: 45.517, lng: -73.674, count: 5,  hot: false, size: 32 },
  // Anjou / East end
  { lat: 45.615, lng: -73.560, count: 4,  hot: false, size: 30 },
  // Kirkland / West Island fringe
  { lat: 45.451, lng: -73.834, count: 2,  hot: false, size: 28 },
  // La Prairie
  { lat: 45.415, lng: -73.500, count: 2,  hot: false, size: 28 },
  // South Shore — Saint-Hubert
  { lat: 45.499, lng: -73.415, count: 3,  hot: false, size: 30 },
];

const HeroMapPreview = () => {
  // Center shifted WEST so the eastern half (with the cluster of Longueuil
  // / Brossard / river-side pins) sits under the right side of the viewport
  // — which is where the hero content DOESN'T cover the map.
  const CENTER = [45.505, -73.680];
  const ZOOM = 11;

  return (
    <div className="lp-heromap-wrap" aria-hidden="true">
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        // Prevents Leaflet keyboard-focus outlines and accidental interactions
        // from bubbling out of the hero.
        tap={false}
      >
        {/* Same CartoDB Voyager tiles the actual product uses — clean,
            English-first labels, subtle colour palette. */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {PINS.map((p, i) => (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            icon={buildPinIcon({ count: p.count, hot: p.hot, size: p.size })}
            interactive={false}
            keyboard={false}
          >
            {p.featured && (
              <Popup
                className="lp-heromap-popup"
                autoClose={false}
                closeOnClick={false}
                closeButton={false}
                autoPan={false}
              >
                <div className="lp-heromap-popup-inner">
                  <div className="lp-heromap-popup-avatar">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#14919B" strokeWidth="2">
                      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="lp-heromap-popup-title">Zuni</div>
                    <div className="lp-heromap-popup-sub">111 Chemin de la Pointe-Nord</div>
                    <div className="lp-heromap-popup-pill">53 Open Jobs</div>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Floating stats card in the corner — reinforces "live data" and
          gives the hero a product/dashboard feel without an image asset. */}
      <div className="lp-heromap-stats">
        <div className="lp-heromap-stats-row">
          <div className="lp-heromap-dot lp-heromap-dot-hot" />
          <span>3 urgent</span>
        </div>
        <div className="lp-heromap-stats-row">
          <div className="lp-heromap-dot lp-heromap-dot-open" />
          <span>141 open</span>
        </div>
        <div className="lp-heromap-stats-row">
          <div className="lp-heromap-dot lp-heromap-dot-done" />
          <span>12 done today</span>
        </div>
      </div>
    </div>
  );
};

export default HeroMapPreview;
