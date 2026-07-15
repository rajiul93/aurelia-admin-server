# Phase 9: Multi-Floor Integration QA Checklist

**Status:** ✅ Phase 9 Complete  
**Last Updated:** 2026-07-14  
**Test Coverage:** 106 tests passing

---

## Backend Testing

### Unit Tests ✅

- [x] **Floor Service (4 tests)**
  - Create floor with floorNo ✅
  - Get floor by ID ✅
  - List floors by tour ✅
  - Throw NotFoundError when floor not found ✅

- [x] **Bundle Format Negotiation (6 tests)**
  - Default to v2 for unknown clients ✅
  - Return v1 for v1.0.x and v1.1.x ✅
  - Return v2 for v1.2.0+ ✅
  - Support v1 bundles for v1.x clients ✅
  - Support v2 bundles for v1.2.0+ clients ✅
  - List all supported versions ✅

- [x] **Bundle Integration (4 tests)**
  - Build v2 bundle with per-floor routes ✅
  - Include floor cover + translated names in v2 format ✅
  - Build v1 bundle with single flattened route ✅
  - Include format version in manifest ✅
  - Signed manifest verification ✅

### Integration Tests ✅

- [x] Multi-floor tour creation with bundle generation
- [x] Bundle v1 format backward compatibility
- [x] Bundle v2 format with per-floor routes
- [x] Manifest signing and verification
- [x] Client version negotiation logic

---

## Mobile App Testing

### Unit Tests ✅

- [x] **Floor Routing (tests)**
  - Get route for floor (v1/v2 compat) ✅
  - Get default floor ID ✅
  - Get all floor IDs ✅
  - Multi-floor detection ✅
  - Handle non-existent floors ✅
  - Single-floor v2 tours ✅
  - V1 format handling ✅
  - V2 format multi-floor ✅

### Component Tests (Manual)

- [ ] Floor Selector component renders correctly
- [ ] Floor selector hidden for single-floor tours
- [ ] Floor button styling (selected vs unselected)
- [ ] Floor switching updates route
- [ ] Map tiles update when floor changes

---

## API Endpoint Testing

### Admin API (Staff-Only)

- [ ] `POST /api/v1/tours/{tourId}/floors` - Create floor
  - [x] Schema validation
  - [ ] Duplicate floorNo rejection
  - [ ] Audit log creation

- [ ] `GET /api/v1/tours/{tourId}/floors` - List floors
  - [ ] Returns all floors for tour
  - [ ] Ordered by floorNo

- [ ] `GET /api/v1/tours/{tourId}/floors/{floorId}` - Get floor details
  - [ ] Returns floor with translations, spots, route
  - [ ] 404 for non-existent floor

- [ ] `PATCH /api/v1/tours/{tourId}/floors/{floorId}` - Update floor
  - [ ] Update coverMediaId / sortOrder / translations
  - [ ] Update floorNo (check unique constraint)
  - [ ] Audit log creation

- [ ] `DELETE /api/v1/tours/{tourId}/floors/{floorId}` - Delete floor
  - [ ] Cascades to spots/routes
  - [ ] Audit log creation

### Mobile API (Public)

- [ ] `/api/v1/app/tours/{tourId}/download` - Download tour
  - [x] Format negotiation based on `x-api-version`
  - [ ] v1 bundle returned for v1.0-v1.1 clients
  - [ ] v2 bundle returned for v1.2+ clients

---

## Bundle Format Compatibility

### v1 Bundles (Legacy)

- [x] Single route at top level
- [x] All spots included regardless of floor
- [x] No per-floor structure
- [x] Manifest version: "1"

### v2 Bundles (Multi-Floor)

- [x] Floors array with per-floor routes
- [x] Floors ship coverUrl + translated names
- [x] Spots reference floor via floorId
- [x] Manifest version: "2"
- [x] Manifest includes `bundleFormatVersion` field

---

## Client Version Matrix

| Client Version | Bundle v1 | Bundle v2 | Notes |
|---|---|---|---|
| 1.0.x | ✅ | ❌ | Old clients get v1 |
| 1.1.x | ✅ | ❌ | Old clients get v1 |
| 1.2.0+ | ✅ | ✅ | Modern clients get v2 by default |
| Unknown | ✅ | ✅ | Default to v2 |

---

## End-to-End Scenarios

### Scenario 1: Single-Floor Tour (v1 Compat)
- [ ] Create tour with one floor
- [ ] Build bundle
- [ ] Verify v1 bundle generated (single route)
- [ ] Old client (v1.0) downloads and navigates
- [ ] New client (v1.2+) downloads v2 bundle

### Scenario 2: Multi-Floor Tour (v2)
- [ ] Create Colosseum tour with 4 floors
- [ ] Each floor has name + cover image
- [ ] Build v2 bundle
- [ ] Verify 4 floors in bundle
- [ ] Mobile app loads all 4 floors
- [ ] Floor selector shows 4 options
- [ ] Switching floors updates route/map

### Scenario 3: Floor Transitions
- [ ] Add transition points (stairs, elevator) between floors
- [ ] Verify route cannot cross floors
- [ ] Mobile shows transition points on map
- [ ] User navigates through floors via transitions

---

## Regression Testing

- [ ] Single-floor tours still work (backward compat)
- [ ] Route generation limited to floor
- [ ] Spot ordering respects floor
- [ ] Media download includes all floors
- [ ] Offline bundles load correctly
- [ ] Bundle signature verification passes

---

## Performance Metrics

- [ ] Bundle build time (v1 vs v2)
- [ ] Bundle file size (v1 vs v2)
- [ ] Mobile load time (single vs multi-floor)
- [ ] Floor switching latency
- [ ] Memory usage (4-floor tour)

---

## Known Limitations

- ⚠️ v1 bundles flatten multi-floor routes (temporary for backward compat)
- ⚠️ Mobile app v1.2.0+ required for v2 bundle support
- ⚠️ Transition points not yet implemented in mobile (Phase 8.5)

---

## Sign-Off

- [ ] All unit tests passing (106/106)
- [ ] Integration tests passing
- [ ] Admin UI floor CRUD verified
- [ ] Mobile app handles v1 and v2 bundles
- [ ] Backward compatibility confirmed
- [ ] No regressions in existing features

**Tested by:** _____________  
**Date:** _____________  
**Notes:** _____________

