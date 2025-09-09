# DUPR API Reference Documentation

This folder contains all the API documentation and analysis files for the Open DUPR implementation.

## 📁 File Overview

### [`API_GUIDE.md`](./API_GUIDE.md)

**Primary implementation reference** - Contains the distilled, developer-ready API documentation for building Open DUPR.

**Includes:**

- Essential endpoints for MVP (auth, profile, match history)
- Complete request/response examples
- Error handling patterns
- Implementation priority guide
- Security considerations

### [`raw_openapi_spec.json`](./raw_openapi_spec.json)

**Complete OpenAPI specification** - The raw API documentation downloaded from DUPR's Swagger UI.

**Contains:**

- All 368 available endpoints
- Complete schema definitions
- Full OpenAPI 3.0 specification
- Source data for all analysis

### [`EXTRACTION_PROCESS.md`](./EXTRACTION_PROCESS.md)

**Methodology guide** - Documents how we extracted relevant information from the raw API docs.

**Covers:**

- Step-by-step extraction process
- jq commands used for analysis
- Filtering strategies
- Quality assurance checks
- Tips for future API analysis

## 🚀 Quick Start for Developers

1. **Start with**: [`API_GUIDE.md`](./API_GUIDE.md) - Everything you need to build the MVP
2. **Reference**: [`raw_openapi_spec.json`](./raw_openapi_spec.json) - For additional endpoint details
3. **Learn from**: [`EXTRACTION_PROCESS.md`](./EXTRACTION_PROCESS.md) - Understand the analysis methodology

## 🎯 MVP Implementation Order

### Phase 1 (Essential)

1. Authentication - `/auth/v1/login`
2. User Profile - `/user/v1/profile`
3. Match History - `/match/v1/history`

### Phase 2 (Enhanced)

1. Player Search - `/player/v1/search`
2. Rating History - `/player/v1/{id}/rating-history`
3. Advanced Filtering - `/match/v1/history` (POST)

## 🔗 Key URLs

- **API Base**: `https://api.dupr.gg/`
- **Swagger UI**: https://backend.mydupr.com/swagger-ui/index.html
- **OpenAPI Spec**: https://backend.mydupr.com/v3/api-docs/DUPR%20Backend%20APIs

## 📊 Stats

- **Total Endpoints**: 368
- **MVP Endpoints**: 6
- **File Size**: 414KB (raw spec)
- **Analysis Date**: August 2025

---
