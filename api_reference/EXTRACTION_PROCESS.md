# API Documentation Extraction Process

## Overview

This guide documents how we extracted the relevant API endpoints from the DUPR Swagger UI documentation for the Open DUPR implementation.

## Source Information

- **Swagger UI URL**: https://backend.mydupr.com/swagger-ui/index.html
- **OpenAPI JSON URL**: https://backend.mydupr.com/v3/api-docs/DUPR%20Backend%20APIs
- **Base API URL**: https://api.dupr.gg/
- **Total Endpoints**: 368

## Step-by-Step Extraction Process

### 1. Download the Raw OpenAPI Specification

```bash
curl -s "https://backend.mydupr.com/v3/api-docs/DUPR%20Backend%20APIs" > raw_openapi_spec.json
```

This gives us the complete API specification in OpenAPI 3.0 format.

### 2. Analyze the Overall Structure

```bash
# Count total endpoints
jq '.paths | keys | length' raw_openapi_spec.json
# Output: 368

# Get overview of all endpoint paths
jq '.paths | keys | .[]' raw_openapi_spec.json
```

### 3. Filter for MVP-Relevant Endpoints

#### Authentication Endpoints

```bash
jq '.paths | keys | .[]' raw_openapi_spec.json | grep -E "(login|auth|signup)"
```

Key findings:

- `/auth/{version}/login` - Primary login endpoint
- `/auth/{version}/refresh` - Token refresh
- `/auth/{version}/signup` - User registration

#### User Profile Endpoints

```bash
jq '.paths | keys | .[]' raw_openapi_spec.json | grep -E "(profile|user)" | grep -v admin
```

Key findings:

- `/user/{version}/profile` - Get/update user profile

#### Match & Rating Endpoints

```bash
jq '.paths | keys | .[]' raw_openapi_spec.json | grep -E "(match|history|rating)" | grep -v admin
```

Key findings:

- `/match/{version}/history` - User match history
- `/player/{version}/{id}/rating-history` - Rating progression
- `/brackets/match/{version}/history` - Tournament match history

#### Player Search Endpoints

```bash
jq '.paths | keys | .[]' raw_openapi_spec.json | grep -E "(search|player)" | grep -v admin
```

Key findings:

- `/player/{version}/search` - Search for players
- `/player/search/byDuprId` - Find player by DUPR ID

### 4. Extract Detailed Endpoint Information

For each relevant endpoint, we extracted:

#### Endpoint Definition

```bash
jq '.paths["/auth/{version}/login"]' raw_openapi_spec.json
```

This gives us:

- HTTP method (GET, POST, etc.)
- Parameters (path, query, headers)
- Request body schema
- Response schema
- Security requirements

#### Request/Response Schemas

```bash
jq '.components.schemas.LoginRequest' raw_openapi_spec.json
jq '.components.schemas.AuthResponse' raw_openapi_spec.json
jq '.components.schemas.UserResponse' raw_openapi_spec.json
```

This provides:

- Required fields
- Data types
- Example values
- Field descriptions

### 5. Identify Data Relationships

By examining the schemas, we mapped the data flow:

```
LoginRequest → AuthResponse → accessToken
accessToken → UserResponse (via /user/profile)
UserResponse → PlayerRatingResponse (embedded stats)
accessToken → MatchResponse[] (via /match/history)
```

### 6. Create MVP Priority Matrix

We categorized endpoints by implementation priority:

**Phase 1 (Essential for MVP)**:

- Authentication (`/auth/v1/login`)
- User Profile (`/user/v1/profile`)
- Match History (`/match/v1/history`)

**Phase 2 (Enhanced Features)**:

- Player Search (`/player/v1/search`)
- Rating History (`/player/v1/{id}/rating-history`)
- Advanced Filters (`/match/v1/history` POST)

## Key Tools Used

### jq Commands for Analysis

```bash
# List all endpoints
jq '.paths | keys'

# Filter endpoints by pattern
jq '.paths | keys | .[]' | grep "pattern"

# Extract specific endpoint details
jq '.paths["/endpoint/path"]'

# Extract schema definitions
jq '.components.schemas.SchemaName'

# Count items
jq '.paths | keys | length'
```

### grep Patterns for Filtering

```bash
# Authentication related
grep -E "(login|auth|signup)"

# User data related
grep -E "(profile|user|player)"

# Match data related
grep -E "(match|history|rating)"

# Exclude admin endpoints
grep -v admin

# Multiple patterns
grep -E "pattern1|pattern2"
```

## Analysis Strategy

1. **Breadth First**: Get overview of all available endpoints
2. **Filter by Relevance**: Focus on MVP requirements (auth, profile, matches)
3. **Deep Dive**: Extract complete schemas for selected endpoints
4. **Relationship Mapping**: Understand data dependencies
5. **Prioritization**: Rank by implementation importance

## Quality Checks

- ✅ Verified all endpoints return JSON responses
- ✅ Confirmed authentication requirements
- ✅ Validated request/response schemas
- ✅ Checked for pagination patterns
- ✅ Identified error response formats
- ✅ Mapped data relationships

## Output Files

1. **API_GUIDE.md** - Distilled, implementation-ready documentation
2. **raw_openapi_spec.json** - Complete original specification
3. **EXTRACTION_PROCESS.md** - This methodology guide

## Tips for Future API Analysis

1. **Start with Structure**: Always understand the overall API layout first
2. **Use jq Effectively**: Master filtering and extraction with jq
3. **Focus on MVP**: Don't get overwhelmed by all available endpoints
4. **Validate Assumptions**: Test key endpoints to confirm behavior
5. **Document Everything**: Keep track of your analysis process
6. **Prioritize Pragmatically**: Many endpoints are not be necessary for the scope of this project

This methodology can be applied to analyze any OpenAPI/Swagger specification efficiently.
