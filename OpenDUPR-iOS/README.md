# Open DUPR iOS

A native iOS implementation of Open DUPR using SwiftUI, built for iOS 18+.

## Features

### Native iOS Implementation
- **SwiftUI**: Modern declarative UI framework
- **iOS 18 Design**: Following latest Apple design guidelines
- **Haptic Feedback**: Rich haptic patterns throughout the app
- **Smooth Animations**: Spring animations and transitions
- **Dark Mode**: Full dark mode support with system integration

### Core Features
- ✅ **Authentication**: Secure login with Keychain storage
- ✅ **Profile Management**: View and manage your pickleball profile
- ✅ **Activity Feed**: See matches from players you follow
- ✅ **Player Search**: Find players near you with location support
- ✅ **Match History**: View detailed match history
- ✅ **Social Features**: Follow/unfollow players, view followers
- ✅ **Match Validation**: Approve or reject pending matches
- ✅ **Settings**: Theme customization and account management

### WebView Features
For complex features, we use WebView integration:
- 📊 **Rating History Chart**: Complex data visualization
- 📝 **Record Match**: Complex form with player selection

## Architecture

### Project Structure
```
OpenDUPR/
├── App/                    # App entry point and configuration
├── Models/                 # Data models
├── Views/                  # SwiftUI views
│   ├── Auth/              # Login and authentication
│   ├── Profile/           # User profile views
│   ├── Feed/              # Activity feed
│   ├── Search/            # Player search
│   ├── Match/             # Match history and details
│   ├── Social/            # Followers/following
│   ├── Validation/        # Match validation queue
│   └── WebViews/          # WebView wrappers
├── Services/              # API and data services
│   ├── APIService.swift   # Network layer
│   ├── AuthManager.swift  # Authentication management
│   ├── KeychainManager.swift # Secure storage
│   ├── HapticManager.swift # Haptic feedback
│   └── ThemeManager.swift # Theme and appearance
└── Utils/                 # Utilities and extensions
```

### Key Technologies
- **SwiftUI**: UI framework
- **Combine**: Reactive programming for data flow
- **CoreHaptics**: Advanced haptic feedback
- **CoreLocation**: Location services
- **WebKit**: WebView integration
- **Keychain**: Secure token storage

## Haptic Feedback

The app uses sophisticated haptic feedback patterns:
- **Selection**: Light tap for UI selections
- **Impact**: Medium/heavy feedback for actions
- **Notification**: Success/error/warning patterns
- **Custom Patterns**: Bounce and success animations

## Animations

Smooth, responsive animations throughout:
- **Spring Animations**: Natural, physics-based movements
- **Transitions**: Asymmetric slide and fade effects
- **Loading States**: Shimmer effects on skeletons
- **Interactive**: Gesture-driven animations

## Requirements

- iOS 18.0+
- Xcode 15.4+
- Swift 5.9+

## Installation

1. Clone the repository
2. Open `OpenDUPR.xcodeproj` in Xcode
3. Build and run on iOS 18+ device or simulator

## API Integration

The app connects to the official DUPR API:
- Base URL: `https://api.dupr.gg`
- Authentication: Bearer token with automatic refresh
- Error handling: Comprehensive error states
- Loading states: Skeleton screens during data fetch

## Design Highlights

- **Modern iOS 18 Design**: Clean, native interface
- **Custom Colors**: DUPR green branding with semantic colors
- **Glass Morphism**: Ultra-thin material backgrounds
- **Adaptive Layout**: Responsive to different screen sizes
- **Accessibility**: Full VoiceOver support

## Future Enhancements

- Push notifications for match updates
- Offline support with data caching
- Widget extensions for quick stats
- Apple Watch companion app
- SharePlay for viewing matches together

## License

This project is open source and follows the same license as the main Open DUPR project.