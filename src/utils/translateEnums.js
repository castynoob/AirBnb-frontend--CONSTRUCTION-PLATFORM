// Centralized helpers for translating DB enum values (status, urgency, category)
// stored in English so the FR interface doesn't leak words like "completed", "Other", "High".
//
// All helpers share a contract: if value is empty → ''; if unknown → return raw value
// (so user-entered categories like "Mag assume" still display) ; if key missing → raw value.

const STATUS_KEY = {
  open: 'statusOpenBadge',
  pending: 'statusOpenBadge',
  accepted: 'statusAcceptedBadge',
  approved: 'statusAcceptedBadge',
  active: 'statusAcceptedBadge',
  ongoing: 'statusOngoingBadge',
  in_progress: 'statusOngoingBadge',
  completed: 'statusCompletedBadge',
  done: 'statusCompletedBadge',
  declined: 'statusDeclinedBadge',
  rejected: 'statusDeclinedBadge',
  cancelled: 'statusDeclinedBadge',
  canceled: 'statusDeclinedBadge',
};

const URGENCY_KEY = {
  low: 'urgencyLow',
  medium: 'urgencyMedium',
  normal: 'urgencyMedium',
  high: 'urgencyHigh',
  urgent: 'urgencyUrgent',
  planned: 'urgencyPlanned',
};

const CATEGORY_KEY = {
  plumbing: 'categoryPlumbing', plomberie: 'categoryPlumbing',
  electrical: 'categoryElectrical', electricite: 'categoryElectrical', electricité: 'categoryElectrical',
  hvac: 'categoryHVAC', heating: 'categoryHVAC',
  roofing: 'categoryRoofing', toiture: 'categoryRoofing',
  masonry: 'categoryMasonry', maconnerie: 'categoryMasonry', maçonnerie: 'categoryMasonry',
  painting: 'categoryPainting', peinture: 'categoryPainting',
  flooring: 'categoryFlooring',
  landscaping: 'categoryLandscaping',
  windowsdoors: 'categoryWindowsDoors', windows: 'categoryWindowsDoors', doors: 'categoryWindowsDoors',
  generalrepair: 'categoryGeneralRepair',
  carpentry: 'categoryCarpentry', menuiserie: 'categoryCarpentry',
  other: 'categoryOther', autre: 'categoryOther',
};

function resolve(t, key, raw) {
  const full = `submissions.${key}`;
  const v = t(full);
  return v === full ? raw : v;
}

// Status badge translation. uppercase=true keeps the raw key value (already uppercase);
// uppercase=false converts to title-case ("ACCEPTÉ" → "Accepté", "COMPLETED" → "Completed").
export function translateStatus(t, value, { uppercase = false } = {}) {
  if (!value) return '';
  const norm = String(value).toLowerCase().trim().replace(/[\s-]+/g, '_');
  const key = STATUS_KEY[norm];
  if (!key) return value;
  const v = resolve(t, key, value);
  if (uppercase) return v;
  return v.charAt(0).toLocaleUpperCase() + v.slice(1).toLocaleLowerCase();
}

export function translateUrgency(t, value) {
  if (!value) return '';
  const key = URGENCY_KEY[String(value).toLowerCase().trim()];
  if (!key) return value;
  return resolve(t, key, value);
}

export function translateCategory(t, value) {
  if (!value) return '';
  const norm = String(value).toLowerCase().replace(/[\s/]+/g, '');
  const key = CATEGORY_KEY[norm];
  if (!key) return value;
  return resolve(t, key, value);
}

const PROPERTY_TYPE_KEY = {
  apartment: 'propertyTypeApartment', appartement: 'propertyTypeApartment',
  condominium: 'propertyTypeCondominium', condo: 'propertyTypeCondominium', copropriete: 'propertyTypeCondominium',
  highrise: 'propertyTypeHighRise', tourdhabitation: 'propertyTypeHighRise',
  townhouse: 'propertyTypeTownhouse', maisondeville: 'propertyTypeTownhouse',
  duplex: 'propertyTypeDuplex',
  triplex: 'propertyTypeTriplex',
  singlefamily: 'propertyTypeSingleFamily', maisonunifamiliale: 'propertyTypeSingleFamily',
  multifamily: 'propertyTypeMultiFamily', multifamilial: 'propertyTypeMultiFamily',
  commercialbuilding: 'propertyTypeCommercial', commercial: 'propertyTypeCommercial', immeublecommercial: 'propertyTypeCommercial',
  mixeduse: 'propertyTypeMixedUse', usagemixte: 'propertyTypeMixedUse',
  studenthousing: 'propertyTypeStudentHousing', logementetudiant: 'propertyTypeStudentHousing',
  seniorliving: 'propertyTypeSeniorLiving', residencedaines: 'propertyTypeSeniorLiving',
};

export function translatePropertyType(t, value) {
  if (!value) return '';
  const norm = String(value).toLowerCase().replace(/[\s/-]+/g, '');
  const key = PROPERTY_TYPE_KEY[norm];
  if (!key) return value;
  const full = `submissions.${key}`;
  const v = t(full);
  return v === full ? value : v;
}
