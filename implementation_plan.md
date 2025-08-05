# Open DUPR Implementation Plan

## 1. Project Overview & Goals

This document outlines the high-level engineering plan for building **Open DUPR**, an unofficial, open-source web client for the DUPR (Dynamic Universal Pickleball Rating) system.

https://backend.mydupr.com/swagger-ui/index.html documents the API endpoints. The base url is https://api.dupr.gg/.

### Goals

- **Provide a Superior User Experience:** Create a clean, fast, intuitive, and ad-free web interface.
- **Lightweight & Accessible:** Build a static website using vanilla HTML, CSS, and JavaScript that is performant and accessible on all modern web browsers.
- **Progressive Web App (PWA):** Enable PWA functionality to allow users to "install" the website on their devices for an app-like experience.
- **Secure & Private Access:** Offer a way for users to interact with their DUPR account without unnecessary tracking or exposure to advertisements. The client will act as a secure proxy to DUPR's official services.

## 2. Technology Stack

The project will be built using fundamental web technologies to ensure it is lightweight and universally compatible.

- **Core Technologies:**
  - **HTML5:** For structuring the application's content.
  - **CSS3:** For styling the user interface, using a simple, modern CSS reset.
  - **JavaScript (ES6+):** For all application logic, including API interaction and DOM manipulation.
- **PWA:** A `manifest.json` file and a `service-worker.js` will be created to enable PWA features.
- **Deployment:** The static site will be deployed on **Render** (https://render.com) for reliable, fast, and free static site hosting.

## 3. API Reverse Engineering Strategy

The core of this project relies on interacting with DUPR's private API. This will be achieved by intercepting and analyzing the network traffic from the official DUPR website.

### Phase 1: API Discovery and Documentation

1.  **Traffic Interception:** Use the browser's built-in developer tools (Network tab) to monitor network requests made by the official DUPR website.
2.  **Action & Capture:** Perform standard user actions on the official site (e.g., login, search for a player, view profile, log a match) and capture the corresponding API calls.
3.  **Analyze & Document:** For each captured request, document the following:
    - **HTTP Method:** `GET`, `POST`, `PUT`, `DELETE`, etc.
    - **Endpoint URL:** The full URL of the API endpoint.
    - **Headers:** Pay close attention to `Authorization` (for tokens), `Content-Type`, and any custom headers.
    - **Request Payload (Body):** The JSON structure sent with `POST` or `PUT` requests.
    - **Response Payload:** The JSON structure returned by the server.

### Phase 2: API Client Implementation

1.  **Create a Wrapper:** Develop a JavaScript module (e.g., `api.js`) to serve as an API client.
2.  **Abstract Endpoints:** Create functions that correspond to the discovered API endpoints (e.g., `login(email, password)`, `getPlayer(id)`, `submitMatch(result)`). This will abstract the underlying `fetch` calls.
3.  **Handle Authentication:** Implement logic to manage the authentication flow, including storing and refreshing tokens using `localStorage` or `sessionStorage`. The client will handle attaching the `Authorization` header to all necessary requests.

## 4. Application Architecture

A simple, modular file structure is recommended.

```
/open-dupr
|
├── index.html
├── css/
|   └── style.css
├── js/
|   ├── main.js       # Main application logic, event listeners
|   ├── api.js        # DUPR API client
|   └── ui.js         # Functions for DOM manipulation and UI updates
|
├── manifest.json     # PWA manifest
└── service-worker.js # PWA service worker
```

## 5. Initial Scope (MVP)

The initial version of Open DUPR will focus on core read-only functionality, providing a stable base before adding more complex features.

1.  **Authentication:**
    - Build the login form and logic to handle user login/logout.
    - Securely store the authentication token in `localStorage`.
2.  **View Own Profile & Match History:**
    - Fetch and display the logged-in user's complete profile information.
    - Display the user's singles, doubles, and overall DUPR rating.
    - Display a list of the user's recent matches with scores and opponent details.

## 6. Future Enhancements

Once the MVP is stable, the following features will be prioritized for development.

- **Player Search:** Implement a feature to search for other DUPR players by name.
- **Match Logging:** Create the UI and logic for submitting new match results.
- **Detailed Match View:** Allow users to click on a match in their history to see more details.
- **PWA Implementation:** Add the `manifest.json` and a service worker to enable "Add to Home Screen" functionality and basic offline caching.

## 7. Security & Legal Considerations

### Security

- The application will handle user credentials. It is critical that these are only ever sent directly to DUPR's official API endpoints over HTTPS.
- Authentication tokens will be stored in the browser's `localStorage`. While convenient, this is susceptible to XSS attacks if the site has vulnerabilities. All user-generated content must be properly sanitized before being rendered to the DOM.

### Legal & Stability Disclaimer

- This is an **unofficial client**. It is not endorsed by or affiliated with DUPR Inc.
- The application's functionality is dependent on DUPR's private API. **DUPR could change their API at any time**, which may break this client partially or entirely. The project will need to adapt to such changes.
- The name "Open DUPR" should be used to clearly signal its open-source and unofficial nature.
