# Open DUPR

An unofficial, open-source web client for DUPR (Dynamic Universal Pickleball Rating) system.

## 🎯 MVP Status: ✅ COMPLETE

The MVP implementation is complete and ready for testing!

### ✅ Implemented Features

- **🔐 Authentication**: Secure login with DUPR credentials
- **👤 Profile Display**: View your ratings, stats, and profile details
- **🏓 Match History**: Browse your recent matches with scores and opponents
- **📱 Responsive Design**: Expert-level mobile, tablet, and desktop experience
- **⚡ Performance**: Fast, lightweight vanilla JavaScript implementation

## 🚀 Quick Start

1. **Start a local server**:

   ```bash
   # Using Python (recommended)
   python3 -m http.server 8080

   # Or using Node.js
   npx http-server -p 8080
   ```

2. **Open in browser**: Visit `http://localhost:8080`

3. **Login**: Use your existing DUPR credentials

4. **Explore**: View your profile and match history!

## 📁 Project Structure

```
open-dupr/
├── index.html              # Main application
├── css/style.css           # Expert-level responsive styling
├── js/
│   ├── main.js             # Application logic & coordination
│   ├── api.js              # DUPR API client
│   └── ui.js               # DOM manipulation & UI updates
├── api_reference/          # Complete API documentation
│   ├── API_GUIDE.md        # Implementation-ready API docs
│   ├── raw_openapi_spec.json
│   └── EXTRACTION_PROCESS.md
├── TESTING.md              # Testing instructions
└── implementation_plan.md  # Original project plan
```

## 🏗️ Architecture

Built with **vanilla HTML, CSS, and JavaScript** for maximum compatibility and performance:

- **API Client** (`js/api.js`): Handles all DUPR API interactions
- **UI Manager** (`js/ui.js`): Manages DOM updates and user interactions
- **Main App** (`js/main.js`): Coordinates application flow and state
- **Responsive CSS**: Expert-level styling with modern design principles

## 🎨 Design Features

- **Minimal & Clean**: Focus on content with expert-level typography
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Accessible**: WCAG compliant with keyboard navigation support
- **Fast Loading**: Lightweight assets and optimized performance
- **Modern Animations**: Smooth transitions and micro-interactions

## 🔧 Testing

See [`TESTING.md`](./TESTING.md) for comprehensive testing instructions.

**Quick Test**:

1. Start local server: `python3 -m http.server 8080`
2. Visit: `http://localhost:8080`
3. Login with your DUPR credentials
4. Navigate between Profile and Match History tabs

## 📖 API Documentation

Complete API reference available in [`api_reference/`](./api_reference/):

- **[API_GUIDE.md](./api_reference/API_GUIDE.md)** - Implementation-ready documentation
- **[EXTRACTION_PROCESS.md](./api_reference/EXTRACTION_PROCESS.md)** - How we analyzed the API
- **[raw_openapi_spec.json](./api_reference/raw_openapi_spec.json)** - Complete OpenAPI specification

## 🛣️ Roadmap

### Phase 2 (Future Enhancements)

- **Player Search**: Find and view other players' profiles
- **Match Logging**: Submit new match results
- **Detailed Views**: Expanded match details and statistics
- **PWA Features**: Offline support and installable web app

## ⚖️ Legal & Disclaimer

- **Unofficial Client**: Not affiliated with or endorsed by DUPR Inc.
- **Open Source**: MIT Licensed - see implementation plan for details
- **API Dependency**: Functionality depends on DUPR's private API
- **Credentials**: Your login information is sent directly to DUPR's servers

## 🏓 About DUPR

DUPR (Dynamic Universal Pickleball Rating) is the most accurate global pickleball rating system, trusted by clubs, tournaments, and players worldwide. Learn more at [dupr.com](https://dupr.com).

---

**Ready to test?** Follow the [testing guide](./TESTING.md) to get started!
