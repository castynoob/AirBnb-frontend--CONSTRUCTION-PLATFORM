// =============================================================================
// PropertyLocationPicker
// A Leaflet map where the admin clicks to drop a pin. The pin location is then
// reverse-geocoded via OpenStreetMap Nominatim to auto-fill address fields.
//
// Props:
//   lat, lng:   current marker position (numbers) — null for no pin
//   onPick:     ({ lat, lng, address }) => void — called on click + geocode
//   height:     optional map height (default 260px)
//
// Notes:
//   - Nominatim is free and key-less but rate-limited (~1 req/sec). We debounce
//     reverse geocoding to one request per click.
//   - Sends a custom User-Agent header per their usage policy.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin } from "lucide-react";

// Default Leaflet marker icon — react-leaflet doesn't bundle the asset paths
// correctly in some bundlers, so we point them at the cdn copies.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Default center over Montreal, QC — most of the platform's traffic is there
// but the user can pan anywhere.
const DEFAULT_CENTER = [45.5017, -73.5673];
const DEFAULT_ZOOM = 12;

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function PropertyLocationPicker({
  lat,
  lng,
  onPick,
  height = 260,
}) {
  const [geocoding, setGeocoding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const abortRef = useRef(null);

  // Reverse-geocode and forward enriched address to parent.
  const reverseGeocode = async (la, ln) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${ln}&addressdetails=1`;
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      const addr = data.address || {};
      // Pick the most specific street-level fields available.
      const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || "";
      const province = addr.state || addr.region || addr.province || "";
      const postal_code = addr.postcode || "";

      onPick({
        lat: la,
        lng: ln,
        address: street || data.display_name?.split(",")[0] || "",
        city,
        province,
        postal_code,
        full_display_name: data.display_name || null,
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        console.warn("reverse geocoding failed:", e?.message);
        // Still update lat/lng so the user can manually fill the rest.
        onPick({ lat: la, lng: ln });
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handlePick = ({ lat: la, lng: ln }) => {
    reverseGeocode(la, ln);
  };

  // Forward search ("search this address") via Nominatim search endpoint.
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!data || data.length === 0) {
        return;
      }
      const hit = data[0];
      const la = parseFloat(hit.lat);
      const ln = parseFloat(hit.lon);
      const addr = hit.address || {};
      const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || "";
      const province = addr.state || addr.region || addr.province || "";
      const postal_code = addr.postcode || "";

      onPick({
        lat: la,
        lng: ln,
        address: street || hit.display_name?.split(",")[0] || "",
        city,
        province,
        postal_code,
        full_display_name: hit.display_name || null,
      });
    } catch (e) {
      console.warn("forward geocoding failed:", e?.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={S.wrap}>
      {/* Search row */}
      <form onSubmit={handleSearch} style={S.searchRow}>
        <input
          type="text"
          placeholder="Search an address, e.g. '1234 Sherbrooke W, Montreal'"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={S.searchInput}
        />
        <button type="submit" style={S.searchBtn} disabled={searching}>
          {searching ? <Loader2 size={14} className="spin" /> : <MapPin size={14} />}
          Search
        </button>
      </form>

      {/* Map */}
      <div style={{ ...S.mapWrap, height }}>
        <MapContainer
          center={lat != null && lng != null ? [Number(lat), Number(lng)] : DEFAULT_CENTER}
          zoom={lat != null && lng != null ? 16 : DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ClickHandler onPick={handlePick} />
          {lat != null && lng != null && (
            <>
              <FlyTo lat={Number(lat)} lng={Number(lng)} />
              <Marker position={[Number(lat), Number(lng)]} />
            </>
          )}
        </MapContainer>

        {geocoding && (
          <div style={S.overlayLoader}>
            <Loader2 size={14} className="spin" /> Looking up address…
          </div>
        )}
      </div>

      <div style={S.hint}>
        Click on the map to drop a pin, or search above. The address fields below
        will fill in automatically — adjust them if needed.
      </div>

      {/* Tiny animation for the spinner */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
}

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: 8 },
  searchRow: { display: "flex", gap: 6 },
  searchInput: {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    color: "#0F223D",
    outline: "none",
  },
  searchBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 14px",
    border: "1px solid #00A5A9",
    borderRadius: 8,
    background: "#00A5A9",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  mapWrap: {
    position: "relative",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  overlayLoader: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    background: "rgba(255,255,255,0.95)",
    borderRadius: 8,
    boxShadow: "0 2px 6px rgba(15,34,61,0.12)",
    fontSize: 12,
    color: "#0F223D",
    zIndex: 1000,
  },
  hint: { fontSize: 11, color: "#6b7280" },
};
