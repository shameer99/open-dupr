# CORS Mitigation Plan for Open DUPR

## Overview

This document outlines a comprehensive plan to handle potential CORS (Cross-Origin Resource Sharing) enforcement by DUPR's API. Currently, Open DUPR directly communicates with `api.dupr.gg` from the browser, but if DUPR starts enforcing CORS headers, our application will be blocked from making these requests.

## Current Architecture

- **Frontend**: React SPA hosted at custom domain (e.g., `opendupr.com`)
- **API Calls**: Direct browser requests to `https://api.dupr.gg`
- **Authentication**: Bearer tokens stored in localStorage
- **Build Tool**: Vite with no current proxy configuration

## CORS Problem Scenarios

### Scenario 1: Strict CORS Policy
DUPR adds `Access-Control-Allow-Origin` headers that only permit their official domains:
```
Access-Control-Allow-Origin: https://dupr.gg, https://app.dupr.gg
```

### Scenario 2: Complete CORS Lockdown
DUPR blocks all cross-origin requests entirely or implements additional security measures like CSRF tokens.

## Mitigation Strategies

### Strategy 1: Backend Proxy Server (Recommended)

#### Implementation Plan

**Phase 1: Basic Proxy Setup**
1. Create a backend service (Node.js/Express or Python/FastAPI)
2. Deploy to cloud provider (Vercel, Railway, or AWS)
3. Implement simple proxy endpoints that mirror DUPR API structure
4. Update frontend to call our proxy instead of DUPR directly

**Phase 2: Enhanced Proxy Features**
1. Add request/response logging for debugging
2. Implement caching for frequently accessed data
3. Add rate limiting to prevent abuse
4. Add request validation and sanitization

#### Technical Implementation

**Backend Structure:**
```
proxy-server/
├── src/
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── match.js
│   │   ├── player.js
│   │   └── activity.js
│   ├── middleware/
│   │   ├── cors.js
│   │   ├── logging.js
│   │   └── rateLimit.js
│   └── utils/
│       └── duprClient.js
├── package.json
└── vercel.json
```

**Example Proxy Endpoint:**
```javascript
// routes/auth.js
app.post('/auth/v1/login', async (req, res) => {
  try {
    const response = await fetch('https://api.dupr.gg/auth/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
});
```

**Frontend Changes:**
```typescript
// Update BASE_URL in api.ts
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://api.opendupr.com"  // Our proxy server
  : "https://api.dupr.gg";      // Development fallback
```

#### Deployment Options

**Option A: Vercel (Recommended)**
- Serverless functions
- Easy deployment from GitHub
- Built-in HTTPS and CDN
- Cost: Free tier available

**Option B: Railway**
- Container-based deployment
- PostgreSQL database if needed
- Cost: ~$5/month

**Option C: AWS Lambda + API Gateway**
- Serverless architecture
- Highly scalable
- Cost: Pay per request

### Strategy 2: Browser Extension Approach

#### Implementation Plan

**Phase 1: Extension Development**
1. Create Chrome/Firefox extension
2. Implement content script injection
3. Add API request interception
4. Package and distribute extension

**Phase 2: User Experience**
1. Create installation guide
2. Add extension detection to web app
3. Provide fallback messaging for users without extension

#### Technical Implementation

**Extension Manifest:**
```json
{
  "manifest_version": 3,
  "name": "Open DUPR Helper",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "storage",
    "webRequest"
  ],
  "host_permissions": [
    "https://api.dupr.gg/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://opendupr.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

#### Pros and Cons

**Pros:**
- No server infrastructure needed
- Direct API access
- Lower latency

**Cons:**
- User friction (extension installation)
- Browser compatibility limitations
- Security concerns from users
- Distribution challenges

### Strategy 3: Client-Side Proxy (JSONP/CORS Anywhere)

#### Implementation Options

**Option A: CORS Anywhere Service**
```typescript
const PROXY_URL = "https://cors-anywhere.herokuapp.com/";
const BASE_URL = PROXY_URL + "https://api.dupr.gg";
```

**Option B: Custom JSONP Wrapper**
```typescript
// Only works for GET requests
const jsonpRequest = (url: string) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Implementation details...
  });
};
```

#### Pros and Cons

**Pros:**
- Quick implementation
- No server maintenance

**Cons:**
- Relies on third-party services
- Limited functionality (GET requests only for JSONP)
- Security and reliability concerns
- CORS Anywhere has rate limits

### Strategy 4: Mobile App Wrapper

#### Implementation Plan

**Phase 1: Progressive Web App (PWA)**
1. Enhance existing PWA capabilities
2. Add native app installation prompts
3. Implement offline functionality

**Phase 2: Native Mobile Apps**
1. Create React Native or Capacitor wrapper
2. Use native HTTP clients (no CORS restrictions)
3. Deploy to app stores

#### Technical Implementation

**Enhanced PWA Features:**
```javascript
// Add to vite.config.ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.dupr\.gg\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'dupr-api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          }
        }
      }
    ]
  }
})
```

## Implementation Timeline

### Immediate Response (Week 1)
1. **Monitor for CORS Issues**: Set up error monitoring to detect when CORS is enforced
2. **Prepare Backend Proxy**: Create basic Express.js proxy server ready for deployment
3. **Environment Variable Setup**: Add configuration for API endpoint switching

### Short-term Solution (Week 2-3)
1. **Deploy Backend Proxy**: Launch proxy server on Vercel/Railway
2. **Update Frontend**: Modify API calls to use proxy in production
3. **Testing**: Comprehensive testing of all API endpoints through proxy
4. **Documentation**: Update deployment and development docs

### Long-term Enhancements (Month 2-3)
1. **Caching Layer**: Implement Redis/memory caching for frequently accessed data
2. **Rate Limiting**: Add intelligent rate limiting and request queuing
3. **Monitoring**: Add API usage analytics and error tracking
4. **Performance**: Optimize proxy performance and add CDN if needed

## Configuration Management

### Environment Variables

**Frontend (.env):**
```bash
VITE_API_BASE_URL=https://api.opendupr.com
VITE_DUPR_API_URL=https://api.dupr.gg
VITE_USE_PROXY=true
```

**Backend (.env):**
```bash
DUPR_API_URL=https://api.dupr.gg
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://opendupr.com,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Feature Flags

Implement feature flags to easily switch between direct API calls and proxy:

```typescript
const API_CONFIG = {
  useProxy: import.meta.env.VITE_USE_PROXY === 'true',
  proxyUrl: import.meta.env.VITE_API_BASE_URL,
  directUrl: import.meta.env.VITE_DUPR_API_URL,
};

const BASE_URL = API_CONFIG.useProxy ? API_CONFIG.proxyUrl : API_CONFIG.directUrl;
```

## Testing Strategy

### Pre-CORS Testing
1. **Simulate CORS Errors**: Use browser dev tools to simulate CORS failures
2. **Proxy Testing**: Test all API endpoints through proxy server
3. **Performance Testing**: Compare response times (direct vs proxy)
4. **Error Handling**: Ensure graceful fallback when proxy is unavailable

### Post-CORS Testing
1. **Functionality Testing**: Verify all features work through proxy
2. **Authentication Flow**: Test login/logout/token refresh through proxy
3. **Real-time Features**: Test any polling or real-time functionality
4. **Mobile Testing**: Test PWA and mobile browser compatibility

## Risk Assessment

### High Risk Scenarios
1. **DUPR API Changes**: Sudden API changes could break proxy
2. **Rate Limiting**: DUPR might implement stricter rate limits
3. **Authentication Changes**: New auth mechanisms could require proxy updates
4. **Legal Issues**: DUPR might object to proxy usage

### Mitigation Strategies
1. **API Monitoring**: Automated testing of DUPR API changes
2. **Multiple Proxy Instances**: Deploy redundant proxy servers
3. **User Communication**: Clear messaging about potential service disruptions
4. **Legal Compliance**: Ensure proxy usage complies with DUPR's terms of service

## Cost Analysis

### Backend Proxy Costs

**Vercel (Recommended):**
- Free tier: 100GB bandwidth, 100GB function invocation
- Pro tier: $20/month for higher limits
- Estimated monthly cost: $0-20 depending on usage

**Railway:**
- $5/month base cost
- Additional usage-based charges
- Estimated monthly cost: $5-15

**AWS Lambda + API Gateway:**
- Pay per request model
- Estimated monthly cost: $1-10 for moderate usage

### Development Costs
- Initial proxy setup: 8-16 hours
- Testing and deployment: 4-8 hours
- Ongoing maintenance: 2-4 hours/month

## Security Considerations

### Data Protection
1. **No Data Storage**: Proxy should not store user data or credentials
2. **Request Logging**: Log only non-sensitive request metadata
3. **HTTPS Only**: Ensure all communications use HTTPS
4. **Input Validation**: Validate and sanitize all proxy requests

### Authentication Security
1. **Token Handling**: Proxy should not inspect or modify auth tokens
2. **Session Management**: No server-side session storage
3. **Rate Limiting**: Prevent abuse and DoS attacks
4. **CORS Configuration**: Properly configure CORS for frontend domains only

## Monitoring and Alerting

### Key Metrics
1. **Proxy Response Time**: Monitor API response times
2. **Error Rates**: Track 4xx/5xx errors from DUPR API
3. **Request Volume**: Monitor API usage patterns
4. **Uptime**: Track proxy server availability

### Alerting Setup
1. **CORS Detected**: Alert when CORS errors start occurring
2. **Proxy Down**: Alert when proxy server is unreachable
3. **High Error Rate**: Alert when DUPR API errors exceed threshold
4. **Rate Limit Hit**: Alert when approaching rate limits

## Documentation Updates

### User Documentation
1. **Installation Guide**: Update setup instructions for proxy usage
2. **Troubleshooting**: Add CORS-related troubleshooting section
3. **Feature Changes**: Document any functionality changes due to proxy

### Developer Documentation
1. **Proxy Setup**: Instructions for setting up development proxy
2. **API Changes**: Document any API wrapper modifications
3. **Deployment**: Update deployment instructions to include proxy

## Conclusion

The backend proxy server approach is the most robust long-term solution for handling CORS enforcement. It provides:

- **Reliability**: Full control over the communication layer
- **Performance**: Ability to add caching and optimization
- **Security**: Proper rate limiting and request validation
- **Flexibility**: Easy to modify and extend as needed

The implementation should be done proactively, with monitoring in place to detect when CORS enforcement begins. This approach ensures minimal disruption to users while maintaining all current functionality.

## Next Steps

1. **Immediate**: Set up error monitoring to detect CORS issues
2. **Week 1**: Create and test basic proxy server locally
3. **Week 2**: Deploy proxy server and update production configuration
4. **Week 3**: Comprehensive testing and documentation updates
5. **Ongoing**: Monitor performance and optimize as needed

This plan ensures Open DUPR remains functional regardless of DUPR's CORS policy changes while maintaining a high-quality user experience.