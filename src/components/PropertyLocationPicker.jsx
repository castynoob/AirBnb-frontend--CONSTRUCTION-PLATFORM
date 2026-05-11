import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const DEFAULT_LAT = 45.5017;
const DEFAULT_LNG = -73.5673;

function PropertyLocationPicker({ value, onChange, mapHeight = 280 }) {
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const latitude = value.latitude ?? DEFAULT_LAT;
  const longitude = value.longitude ?? DEFAULT_LNG;

  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector('script[src*="leaflet.js"]');

    const initWithLocation = (L) => {
      if (value.latitude && value.longitude) {
        initializeMap(value.latitude, value.longitude, L);
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            onChange({ latitude: lat, longitude: lng });
            initializeMap(lat, lng, L);
          },
          () => initializeMap(DEFAULT_LAT, DEFAULT_LNG, L)
        );
      } else {
        initializeMap(DEFAULT_LAT, DEFAULT_LNG, L);
      }
    };

    if (window.L && mapRef.current) {
      initWithLocation(window.L);
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if (mapRef.current && window.L) initWithLocation(window.L);
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => {
        if (mapRef.current && window.L) initWithLocation(window.L);
      });
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "User-Agent": "INTERVOS Construction Platform" } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        let fullAddr = "";
        if (a.house_number) fullAddr += a.house_number + " ";
        if (a.road) fullAddr += a.road;
        const suburb = a.suburb || a.neighbourhood || "";
        if (suburb && !fullAddr.includes(suburb)) {
          fullAddr += (fullAddr ? ", " : "") + suburb;
        }
        onChange({
          address: fullAddr.trim() || value.address,
          city: a.city || a.town || a.village || a.municipality || value.city,
          province: a.state || a.province || value.province,
          postal_code: a.postcode || value.postal_code,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleAddressSearch = (query) => {
    setAddressSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ca&limit=5&addressdetails=1`,
          { headers: { "User-Agent": "INTERVOS Construction Platform" } }
        );
        setSearchResults((await res.json()) || []);
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const a = result.address || {};
    let fullAddr = "";
    if (a.house_number) fullAddr += a.house_number + " ";
    if (a.road) fullAddr += a.road;
    onChange({
      latitude: lat,
      longitude: lng,
      address: fullAddr.trim() || value.address,
      city: a.city || a.town || a.village || a.municipality || value.city,
      province: a.state || a.province || value.province,
      postal_code: a.postcode || value.postal_code,
    });
    if (map) {
      map.setView([lat, lng], 16);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    }
    setSearchResults([]);
    setAddressSearch(result.display_name);
  };

  const initializeMap = (lat, lng, L) => {
    if (!mapRef.current || map) return;
    const worldBounds = L.latLngBounds([-90, -180], [90, 180]);
    const m = L.map(mapRef.current, {
      attributionControl: false,
      worldCopyJump: false,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 2,
    }).setView([lat, lng], 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      noWrap: true,
      bounds: worldBounds,
    }).addTo(m);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(m);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChange({ latitude: p.lat, longitude: p.lng });
      reverseGeocode(p.lat, p.lng);
    });
    m.on("click", (e) => {
      marker.setLatLng(e.latlng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    markerRef.current = marker;
    setMap(m);
  };

  const s = {
    wrap: { display: "flex", flexDirection: "column", gap: "0.75rem" },
    searchWrap: { position: "relative" },
    searchInput: {
      width: "100%",
      padding: "0.625rem 0.75rem 0.625rem 2rem",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "0.875rem",
      color: "#111827",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    searchIcon: {
      position: "absolute",
      left: "0.625rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
      pointerEvents: "none",
    },
    spinner: {
      position: "absolute",
      right: "0.75rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#00A5A9",
      animation: "spin 0.6s linear infinite",
    },
    searchDrop: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      zIndex: 50,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      maxHeight: "200px",
      overflowY: "auto",
      marginTop: "4px",
    },
    searchItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.5rem",
      width: "100%",
      padding: "0.625rem 0.75rem",
      border: "none",
      borderBottom: "1px solid #f3f4f6",
      background: "none",
      cursor: "pointer",
      textAlign: "left",
      fontSize: "0.8125rem",
      color: "#374151",
    },
    mapBox: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
    },
    mapHint: {
      fontSize: "0.75rem",
      color: "#6b7280",
      padding: "0.5rem 0.75rem",
      borderBottom: "1px solid #f3f4f6",
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
      background: "#fafbfc",
    },
    mapDiv: { width: "100%", height: `${mapHeight}px` },
    coords: {
      display: "flex",
      gap: "1.25rem",
      padding: "0.5rem 0.75rem",
      borderTop: "1px solid #f3f4f6",
      fontSize: "0.75rem",
      color: "#6b7280",
      background: "#fafbfc",
    },
    coordVal: { fontWeight: 600, color: "#111827", marginLeft: "0.25rem" },
  };

  return (
    <div style={s.wrap}>
      <div style={s.searchWrap}>
        <Search size={14} style={s.searchIcon} />
        <input
          type="text"
          value={addressSearch}
          onChange={(e) => handleAddressSearch(e.target.value)}
          style={s.searchInput}
          placeholder={
            t("addPropertyModal.searchAddressPlaceholder") ||
            "Search address (e.g. 123 Rue Saint-Denis, Montreal)"
          }
        />
        {isSearching && <Loader2 size={16} style={s.spinner} />}
        {searchResults.length > 0 && (
          <div style={s.searchDrop}>
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSearchResult(r)}
                style={s.searchItem}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <MapPin size={14} style={{ color: "#00A5A9", flexShrink: 0, marginTop: "2px" }} />
                <span>{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={s.mapBox}>
        <div style={s.mapHint}>
          <MapPin size={13} style={{ color: "#00A5A9" }} />
          {t("addPropertyModal.mapInstruction") ||
            "Click the map or drag the marker to set the location. Address fields will auto-fill."}
        </div>
        <div ref={mapRef} style={s.mapDiv} />
        <div style={s.coords}>
          <span>
            {t("addPropertyModal.latitude") || "Lat"}:
            <span style={s.coordVal}>{Number(latitude).toFixed(6)}</span>
          </span>
          <span>
            {t("addPropertyModal.longitude") || "Lng"}:
            <span style={s.coordVal}>{Number(longitude).toFixed(6)}</span>
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default PropertyLocationPicker;
