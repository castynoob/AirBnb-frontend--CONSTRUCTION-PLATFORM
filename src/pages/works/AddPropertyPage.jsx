import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Building2, MapPin, Search, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AddPropertyPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    building_name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    num_units: '',
    building_type: 'Apartment',
    latitude: 45.5017,
    longitude: -73.5673,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildingTypes = [
    { value: 'Apartment', key: 'apartment' },
    { value: 'Condominium', key: 'condominium' },
    { value: 'High-Rise', key: 'highRise' },
    { value: 'Townhouse', key: 'townhouse' },
    { value: 'Duplex', key: 'duplex' },
    { value: 'Triplex', key: 'triplex' },
    { value: 'Single Family', key: 'singleFamily' },
    { value: 'Multi-Family', key: 'multiFamily' },
    { value: 'Commercial Building', key: 'commercialBuilding' },
    { value: 'Mixed-Use', key: 'mixedUse' },
    { value: 'Student Housing', key: 'studentHousing' },
    { value: 'Senior Living', key: 'seniorLiving' }
  ];

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    const existingScript = document.querySelector('script[src*="leaflet.js"]');

    const initWithLocation = (L) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            initializeMap(lat, lng, L);
          },
          () => initializeMap(45.5017, -73.5673, L)
        );
      } else {
        initializeMap(45.5017, -73.5673, L);
      }
    };

    if (window.L && mapRef.current) {
      initWithLocation(window.L);
    } else if (!existingScript) {
      script.onload = () => { if (mapRef.current && window.L) initWithLocation(window.L); };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => { if (mapRef.current && window.L) initWithLocation(window.L); });
    }

    return () => { if (map) { map.remove(); setMap(null); } };
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'User-Agent': 'INTERVOS Construction Platform' } });
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        let fullAddr = '';
        if (a.house_number) fullAddr += a.house_number + ' ';
        if (a.road) fullAddr += a.road;
        const suburb = a.suburb || a.neighbourhood || '';
        if (suburb && !fullAddr.includes(suburb)) fullAddr += (fullAddr ? ', ' : '') + suburb;
        setFormData(prev => ({
          ...prev,
          address: fullAddr.trim() || prev.address,
          city: (a.city || a.town || a.village || a.municipality || prev.city),
          province: (a.state || a.province || prev.province),
          postal_code: (a.postcode || prev.postal_code),
        }));
      }
    } catch {}
  };

  const handleAddressSearch = (query) => {
    setAddressSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() || query.length < 3) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ca&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'INTERVOS Construction Platform' } });
        setSearchResults(await res.json() || []);
      } catch { setSearchResults([]); }
      setIsSearching(false);
    }, 400);
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat), lng = parseFloat(result.lon);
    const a = result.address || {};
    let fullAddr = '';
    if (a.house_number) fullAddr += a.house_number + ' ';
    if (a.road) fullAddr += a.road;
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, address: fullAddr.trim() || prev.address, city: a.city || a.town || a.village || a.municipality || prev.city, province: a.state || a.province || prev.province, postal_code: a.postcode || prev.postal_code }));
    if (map) { map.setView([lat, lng], 16); if (markerRef.current) markerRef.current.setLatLng([lat, lng]); }
    setSearchResults([]);
    setAddressSearch(result.display_name);
  };

  const initializeMap = (lat, lng, L) => {
    if (!mapRef.current || map) return;
    const m = L.map(mapRef.current, { attributionControl: false }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd' }).addTo(m);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(m);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      setFormData(prev => ({ ...prev, latitude: p.lat, longitude: p.lng }));
      reverseGeocode(p.lat, p.lng);
    });
    m.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setFormData(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    markerRef.current = marker;
    setMap(m);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address.trim() || !formData.city.trim()) {
      toast.error(t('addPropertyModal.addressRequired') || 'Address and city are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = JSON.parse(localStorage.getItem('userProfile'))?.token;
      const res = await fetch(`${API_BASE_URL}/api/properties/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, num_units: parseInt(formData.num_units) || 0 })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      toast.success(t('toasts.propertyAddedSuccess') || 'Property added successfully!');
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to add property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
    content: { flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' },
    title: { fontSize: '1.5rem', fontWeight: 700, color: '#0F223D', margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#0F223D', margin: '0 0 1.25rem 0' },
    label: { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' },
    input: { width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' },
    select: { width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    group: { marginBottom: '1rem' },
    req: { color: '#ef4444', marginLeft: '2px' },
    mapContainer: { width: '100%', flex: 1, minHeight: '500px', borderRadius: '0' },
    mapCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'sticky', top: '1rem', alignSelf: 'start' },
    mapHint: { fontSize: '0.75rem', color: '#6b7280', padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.35rem' },
    coords: { display: 'flex', gap: '1.5rem', padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#6b7280' },
    coordVal: { fontWeight: 600, color: '#111827', marginLeft: '0.25rem' },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.25rem 0 0', borderTop: '1px solid #f3f4f6', marginTop: '0.5rem' },
    cancelBtn: { padding: '0.625rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' },
    submitBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.5rem', border: 'none', borderRadius: '8px', background: '#00A5A9', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
    searchDrop: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' },
    searchItem: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', width: '100%', padding: '0.625rem 0.75rem', border: 'none', borderBottom: '1px solid #f3f4f6', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8125rem', color: '#374151' },
  };

  return (
    <div style={s.page}>
      <Nav />
      <div className="main-container" style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>
            <ArrowLeft size={16} /> {t('common.back') || 'Back'}
          </button>
          <Building2 size={22} style={{ color: '#00A5A9' }} />
          <h1 style={s.title}>{t('addPropertyModal.addNewProperty') || 'Add New Property'}</h1>
        </div>

        {/* Two-column layout */}
        <div style={s.grid}>
          {/* LEFT — Form */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>
              <Building2 size={18} style={{ color: '#00A5A9' }} />
              {t('addPropertyModal.buildingDetails') || 'Property Details'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Address Search */}
              <div style={{ ...s.group, position: 'relative' }}>
                <label style={s.label}>
                  <Search size={13} />
                  {t('addPropertyModal.searchAddress') || 'Search Address'}<span style={s.req}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    style={s.input}
                    placeholder={t('addPropertyModal.searchAddressPlaceholder') || 'Type an address (e.g. 123 Rue Saint-Denis, Montreal)'}
                  />
                  {isSearching && (
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                      <Loader2 size={16} style={{ color: '#00A5A9', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div style={s.searchDrop}>
                    {searchResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => selectSearchResult(r)} style={s.searchItem}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <MapPin size={14} style={{ color: '#00A5A9', flexShrink: 0, marginTop: '2px' }} />
                        <span>{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Building Name */}
              <div style={s.group}>
                <label style={s.label}>{t('addPropertyModal.buildingName') || 'Building Name'} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({t('common.optional') || 'Optional'})</span></label>
                <input name="building_name" value={formData.building_name} onChange={handleChange} style={s.input} placeholder={t('addPropertyModal.buildingNamePlaceholder') || 'e.g., Sunrise Apartments'} />
              </div>

              {/* Auto-filled address fields */}
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>{t('addPropertyModal.autoFillDescription') || 'These fields auto-fill when you search or pin a location'}</p>
                <div style={s.group}>
                  <label style={s.label}>{t('addPropertyModal.streetAddress') || 'Street Address'}<span style={s.req}>*</span></label>
                  <input name="address" value={formData.address} onChange={handleChange} style={s.input} required />
                </div>
                <div style={s.row}>
                  <div style={s.group}>
                    <label style={s.label}>{t('addPropertyModal.city') || 'City'}<span style={s.req}>*</span></label>
                    <input name="city" value={formData.city} onChange={handleChange} style={s.input} required />
                  </div>
                  <div style={s.group}>
                    <label style={s.label}>{t('addPropertyModal.provinceState') || 'Province'}</label>
                    <input name="province" value={formData.province} onChange={handleChange} style={s.input} />
                  </div>
                </div>
                <div style={s.group}>
                  <label style={s.label}>{t('addPropertyModal.postalCode') || 'Postal Code'}</label>
                  <input name="postal_code" value={formData.postal_code} onChange={handleChange} style={s.input} />
                </div>
              </div>

              {/* Building Type & Units */}
              <div style={s.row}>
                <div style={s.group}>
                  <label style={s.label}>{t('addPropertyModal.buildingType') || 'Building Type'}<span style={s.req}>*</span></label>
                  <select name="building_type" value={formData.building_type} onChange={handleChange} style={s.select} required>
                    {buildingTypes.map(bt => (
                      <option key={bt.value} value={bt.value}>{t(`addPropertyModal.${bt.key}`) || bt.value}</option>
                    ))}
                  </select>
                </div>
                <div style={s.group}>
                  <label style={s.label}>{t('addPropertyModal.numberOfUnits') || 'Number of Units'}<span style={s.req}>*</span></label>
                  <input name="num_units" type="number" value={formData.num_units} onChange={handleChange} style={s.input} min="1" required placeholder={t('addPropertyModal.unitsPlaceholder') || 'e.g., 12'} />
                </div>
              </div>

              {/* Footer */}
              <div style={s.footer}>
                <button type="button" onClick={() => navigate(-1)} style={s.cancelBtn} disabled={isSubmitting}>
                  {t('addPropertyModal.cancel') || 'Cancel'}
                </button>
                <button type="submit" style={{ ...s.submitBtn, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> {t('addPropertyModal.adding') || 'Adding...'}</> : <><Plus size={16} /> {t('addPropertyModal.addProperty') || 'Add Property'}</>}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT — Map */}
          <div style={s.mapCard}>
            <div style={s.mapHint}>
              <MapPin size={13} style={{ color: '#00A5A9' }} />
              {t('addPropertyModal.mapInstruction') || 'Click on the map or drag the marker to set location. Address fields will auto-fill.'}
            </div>
            <div ref={mapRef} style={s.mapContainer} />
            <div style={s.coords}>
              <span>{t('addPropertyModal.latitude') || 'Lat'}:<span style={s.coordVal}>{formData.latitude.toFixed(6)}</span></span>
              <span>{t('addPropertyModal.longitude') || 'Lng'}:<span style={s.coordVal}>{formData.longitude.toFixed(6)}</span></span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"],
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AddPropertyPage;
