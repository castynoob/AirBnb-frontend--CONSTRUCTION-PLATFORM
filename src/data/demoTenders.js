// =============================================================================
// Demo tenders — simulated properties + open jobs across Québec, used by the
// demo-mode toggle so the entrepreneur map looks busy during investor pitches
// even when the real platform is quiet.
//
// Shape matches what HomePageEntrepreneur / the map + popups already read:
//   Property: { id, name, address, city, province, latitude, longitude }
//   Job:      { id, property_id, title, category, urgency, status: 'open',
//               budget_min, budget_max }
//
// The IDs use a fixed `demo-*` prefix so they never collide with real UUIDs.
// If a user clicks through to a job detail page from a demo pin, the request
// will 404 — that's fine; demos are meant to be shown, not clicked around.
// =============================================================================

// Small helper so IDs stay compact and predictable.
const p = (n) => `demo-prop-${n}`;
const j = (n) => `demo-job-${n}`;

// Roughly ordered by pin density we want per city. Coordinates are clustered
// slightly around each city centre so pins don't all overlap.
export const demoProperties = [
  // ── Montréal ──────────────────────────────────────────────────────────────
  { id: p(1),  name: "Le Solano Condos",         address: "1230 rue Saint-Denis",    city: "Montréal", province: "QC", latitude: 45.5152, longitude: -73.5615 },
  { id: p(2),  name: "Résidences du Vieux-Port", address: "455 rue de la Commune O", city: "Montréal", province: "QC", latitude: 45.5019, longitude: -73.5545 },
  { id: p(3),  name: "Tour Belvédère",           address: "3510 av. du Parc",        city: "Montréal", province: "QC", latitude: 45.5152, longitude: -73.5851 },
  { id: p(4),  name: "Griffin Lofts",            address: "1620 rue Notre-Dame O",   city: "Montréal", province: "QC", latitude: 45.4880, longitude: -73.5654 },
  { id: p(5),  name: "Plateau Verdant",          address: "4200 rue Saint-Hubert",   city: "Montréal", province: "QC", latitude: 45.5300, longitude: -73.5860 },
  { id: p(6),  name: "Rosemont Terraces",        address: "5810 boul. Rosemont",     city: "Montréal", province: "QC", latitude: 45.5555, longitude: -73.5760 },

  // ── Laval ─────────────────────────────────────────────────────────────────
  { id: p(7),  name: "Cartier Riverside",        address: "3050 boul. Le Carrefour", city: "Laval",    province: "QC", latitude: 45.5687, longitude: -73.7231 },
  { id: p(8),  name: "Les Jardins de Chomedey",  address: "270 boul. Cartier O",     city: "Laval",    province: "QC", latitude: 45.5477, longitude: -73.7350 },
  { id: p(9),  name: "Complexe Vimont",          address: "1290 boul. René-Laennec", city: "Laval",    province: "QC", latitude: 45.6220, longitude: -73.6912 },

  // ── Longueuil ─────────────────────────────────────────────────────────────
  { id: p(10), name: "Rive-Sud Estates",         address: "2405 chemin Chambly",     city: "Longueuil",province: "QC", latitude: 45.5453, longitude: -73.5087 },
  { id: p(11), name: "Îlot Charlemagne",         address: "990 rue Saint-Charles O", city: "Longueuil",province: "QC", latitude: 45.5340, longitude: -73.5175 },

  // ── Québec City ───────────────────────────────────────────────────────────
  { id: p(12), name: "Le Château Bellevue",      address: "10 rue Saint-Louis",      city: "Québec",   province: "QC", latitude: 46.8121, longitude: -71.2078 },
  { id: p(13), name: "Résidences Saint-Roch",    address: "775 rue Saint-Vallier E", city: "Québec",   province: "QC", latitude: 46.8171, longitude: -71.2245 },
  { id: p(14), name: "Domaine Sillery",          address: "1450 av. Maguire",        city: "Québec",   province: "QC", latitude: 46.7717, longitude: -71.2597 },
  { id: p(15), name: "Tour du Faubourg",         address: "525 boul. Charest E",     city: "Québec",   province: "QC", latitude: 46.8140, longitude: -71.2265 },

  // ── Gatineau ──────────────────────────────────────────────────────────────
  { id: p(16), name: "Les Berges du Ruisseau",   address: "45 boul. Saint-Joseph",   city: "Gatineau", province: "QC", latitude: 45.4520, longitude: -75.7156 },
  { id: p(17), name: "Aylmer Heights",           address: "220 rue Principale",      city: "Gatineau", province: "QC", latitude: 45.3969, longitude: -75.8478 },

  // ── Sherbrooke ────────────────────────────────────────────────────────────
  { id: p(18), name: "Domaine Magog",            address: "2445 rue King O",         city: "Sherbrooke",province:"QC", latitude: 45.4030, longitude: -71.9280 },
  { id: p(19), name: "Résidences Jacques-Cartier",address:"280 rue Belvédère N",     city: "Sherbrooke",province:"QC", latitude: 45.4102, longitude: -71.8880 },

  // ── Trois-Rivières ────────────────────────────────────────────────────────
  { id: p(20), name: "Cap-de-la-Madeleine Lofts",address:"830 boul. Sainte-Madeleine",city:"Trois-Rivières",province:"QC",latitude:46.3607,longitude:-72.5236 },
  { id: p(21), name: "Coteau Terraces",          address:"1105 rue Notre-Dame Centre",city:"Trois-Rivières",province:"QC",latitude:46.3452,longitude:-72.5479 },

  // ── Brossard ──────────────────────────────────────────────────────────────
  { id: p(22), name: "Quartier DIX30 Residences",address:"9160 boul. Leduc",        city:"Brossard",  province:"QC", latitude: 45.4498, longitude: -73.4761 },
  { id: p(23), name: "Panama Towers",            address:"7250 boul. Taschereau",   city:"Brossard",  province:"QC", latitude: 45.4587, longitude: -73.4657 },

  // ── Terrebonne / Lévis ────────────────────────────────────────────────────
  { id: p(24), name: "Vieux-Terrebonne Condos",  address:"825 rue Saint-Louis",     city:"Terrebonne",province:"QC", latitude: 45.7009, longitude: -73.6414 },
  { id: p(25), name: "Chaudière Riverfront",     address:"5959 boul. de la Rive-Sud",city:"Lévis",    province:"QC", latitude: 46.7817, longitude: -71.1795 },
];

// Job templates — realistic construction titles + rough budget bands per category.
// We loop over these and stamp property_ids so each property gets 1-8 open jobs.
const JOB_TEMPLATES = [
  { title: "Replace lobby flooring (marble → porcelain)",   category: "Flooring",       urgency: "medium", budget_min:  8500, budget_max: 14000 },
  { title: "Repaint 3 stairwells + hallways",               category: "Painting",       urgency: "low",    budget_min:  4200, budget_max:  7800 },
  { title: "Rooftop membrane replacement",                  category: "Roofing",        urgency: "high",   budget_min: 42000, budget_max: 68000 },
  { title: "HVAC coil cleaning — 24 units",                 category: "HVAC",           urgency: "medium", budget_min:  6800, budget_max: 11200 },
  { title: "Kitchen renovation — 2-bedroom unit",           category: "Renovation",     urgency: "medium", budget_min: 22000, budget_max: 38000 },
  { title: "Balcony railing repair (6 units)",              category: "Metalwork",      urgency: "high",   budget_min: 12500, budget_max: 19000 },
  { title: "Front lobby door + auto-close hinge",           category: "Doors/Windows",  urgency: "medium", budget_min:  3800, budget_max:  6400 },
  { title: "Parking garage crack sealing + line paint",     category: "Concrete",       urgency: "low",    budget_min: 15000, budget_max: 24000 },
  { title: "Emergency lighting inspection + repair",        category: "Electrical",     urgency: "high",   budget_min:  2400, budget_max:  4100 },
  { title: "Full bathroom retile — 3 rentals",              category: "Tile Work",      urgency: "medium", budget_min:  9500, budget_max: 16800 },
  { title: "Deep clean HVAC ductwork — 4 floors",           category: "HVAC",           urgency: "medium", budget_min:  7200, budget_max: 12400 },
  { title: "Landscape refresh — front entrance",            category: "Landscaping",    urgency: "low",    budget_min:  5600, budget_max:  9800 },
  { title: "Elevator pit waterproofing",                    category: "Waterproofing",  urgency: "high",   budget_min: 18000, budget_max: 27000 },
  { title: "Replace 12 apartment door frames",              category: "Carpentry",      urgency: "medium", budget_min:  8100, budget_max: 13600 },
  { title: "Basement sump pump replacement",                category: "Plumbing",       urgency: "high",   budget_min:  2800, budget_max:  4600 },
  { title: "Stucco patching — north façade",                city_bias: null,            category: "Siding Installation", urgency: "medium", budget_min: 6400, budget_max: 11800 },
  { title: "Window caulking — full building",               category: "Waterproofing",  urgency: "low",    budget_min:  4400, budget_max:  7200 },
  { title: "Fire escape steel repair",                      category: "Welding",        urgency: "urgent", budget_min: 14000, budget_max: 22500 },
];

// Deterministic pseudo-random helper — no `Math.random` so the fake feed is
// stable across reloads (a stable demo is easier to talk over).
const seededPick = (arr, seed) => arr[seed % arr.length];
const seededRange = (min, max, seed) => min + (seed % (max - min + 1));

export const demoJobs = (() => {
  const jobs = [];
  let counter = 1;
  demoProperties.forEach((prop, propIdx) => {
    const openCount = 1 + ((propIdx * 3 + 7) % 6); // 1..6 open jobs per property
    for (let i = 0; i < openCount; i++) {
      const seed = propIdx * 17 + i * 5;
      const tpl = seededPick(JOB_TEMPLATES, seed);
      jobs.push({
        id: j(counter++),
        property_id: prop.id,
        title: tpl.title,
        category: tpl.category,
        urgency: tpl.urgency,
        status: "open",
        // Wobble the budget a bit so each job feels distinct.
        budget_min: tpl.budget_min + seededRange(0, 400, seed),
        budget_max: tpl.budget_max + seededRange(0, 900, seed),
        is_budget_hidden: false,
        created_at: new Date(2026, 6, 15 - (propIdx % 10)).toISOString(),
        // Denormalised property fields so any code path that expects them on
        // the job (some cards do) has them without a join.
        property_name: prop.name,
        property_address: prop.address,
        property_city: prop.city,
        property_province: prop.province,
        property_latitude: prop.latitude,
        property_longitude: prop.longitude,
      });
    }
  });
  return jobs;
})();
