# Open DUPR iOS

A native iOS app for DUPR (Dynamic Universal Pickleball Rating) built with SwiftUI, targeting iOS 18+.

## Features

### ✨ Core Features
- **Native iOS 18 Design** - Modern SwiftUI interface following iOS 18 design guidelines
- **Comprehensive Haptic Feedback** - Tactile responses for all interactions
- **Smooth Animations** - Fluid transitions and micro-interactions throughout
- **Clean Architecture** - MVVM pattern with proper separation of concerns

### 🏓 DUPR Integration
- **Authentication** - Secure login with keychain storage
- **Player Profiles** - View your profile and other players' profiles
- **Match History** - Browse and filter match history with pull-to-refresh
- **Player Search** - Find and connect with other players
- **Social Features** - Follow/unfollow players and view follower counts
- **Match Recording** - Record new matches with intuitive UI
- **Activity Feed** - See updates from followed players

### 📱 iOS-Specific Features
- **Haptic Feedback** - Light, medium, heavy, and notification haptics
- **Pull-to-Refresh** - Native iOS refresh patterns
- **Navigation** - Proper iOS navigation with back buttons and modals
- **Dark Mode Support** - Respects system appearance settings
- **Accessibility** - VoiceOver and accessibility label support
- **Safe Area** - Proper handling of notches and home indicators

### 🌐 Hybrid Features
For complex features that would be time-intensive to implement natively, the app uses web views:
- **Validation Queue** - Web view for match validation
- **Match Details** - Detailed match analysis and statistics

## Architecture

### Project Structure
```
OpenDUPR/
├── OpenDUPRApp.swift          # App entry point
├── ContentView.swift          # Root content view
├── Managers/                  # Business logic managers
│   ├── AuthenticationManager.swift
│   ├── HapticManager.swift
│   └── KeychainManager.swift
├── Models/                    # Data models
│   ├── User.swift
│   ├── Match.swift
│   └── Player.swift
├── Network/                   # API layer
│   └── APIClient.swift
├── Views/                     # SwiftUI views
│   ├── Authentication/
│   ├── Profile/
│   ├── Matches/
│   ├── Search/
│   ├── Feed/
│   ├── RecordMatch/
│   ├── Player/
│   └── WebView/
└── Assets.xcassets           # App icons and colors
```

### Key Components

#### AuthenticationManager
- Handles login/logout flow
- Manages access and refresh tokens
- Secure keychain storage
- Automatic token refresh

#### HapticManager
- Centralized haptic feedback system
- Different haptic types for various interactions
- Performance optimized with prepared generators

#### APIClient
- RESTful API communication with DUPR backend
- Async/await based networking
- Automatic token injection
- Error handling and retry logic

## Requirements

- iOS 18.0+
- Xcode 16.0+
- Swift 6.0+

## Installation

### Prerequisites
1. Install Xcode 16.0 or later
2. Ensure you have an Apple Developer account (for device testing)

### Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd open-dupr-ios
   ```

2. Open the project:
   ```bash
   open OpenDUPR.xcodeproj
   ```

3. Select your development team in project settings

4. Build and run the project (⌘+R)

## Configuration

### API Configuration
The app connects to the DUPR API at `https://api.dupr.gg`. No additional configuration is required.

### Build Settings
- **Deployment Target**: iOS 18.0
- **Swift Language Version**: 6.0
- **Supported Devices**: iPhone only (Portrait orientation)

## Development

### Adding New Features
1. Create appropriate model in `Models/`
2. Add API endpoints in `APIClient.swift`
3. Create SwiftUI views in appropriate `Views/` subdirectory
4. Add haptic feedback using `HapticManager`
5. Ensure proper error handling and loading states

### Haptic Guidelines
- Use `buttonTap()` for button presses
- Use `cardTap()` for card/row selections
- Use `successAction()` for successful operations
- Use `errorAction()` for errors
- Use `pullToRefresh()` for refresh actions

### Animation Guidelines
- Use implicit animations for state changes
- Prefer `withAnimation()` for explicit animations
- Keep animation durations between 0.2-0.5 seconds
- Use `easeInOut` for most transitions

## API Integration

The app integrates with the DUPR API using the following endpoints:

### Authentication
- `POST /auth/v1/login` - User login
- `GET /auth/v1/refresh` - Token refresh

### User Data
- `GET /user/v1/profile` - User profile
- `GET /user/calculated/v1.0/stats/{id}` - User statistics

### Matches
- `GET /match/v1/history` - Match history
- `GET /player/v1/{id}/history` - Player match history

### Social
- `POST /player/v1/search` - Player search
- `GET /activity/v1.1/user/{id}/followingInfo` - Follow information
- `POST /activity/v1.1/user/{id}/follow` - Follow user
- `DELETE /activity/v1.1/user/{id}/follow` - Unfollow user

## Design System

### Colors
- Primary: System Blue
- Secondary: System Purple
- Accent: Dynamic based on system settings
- Background: System backgrounds with materials

### Typography
- Headlines: System font, bold weights
- Body: System font, regular weights
- Captions: System font, lighter weights

### Components
- Cards: Rounded rectangles with materials
- Buttons: Rounded rectangles with gradients
- Text Fields: Materials with subtle borders
- Navigation: Standard iOS navigation patterns

## Testing

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Profile data loading
- [ ] Match history pagination
- [ ] Player search functionality
- [ ] Follow/unfollow actions
- [ ] Match recording flow
- [ ] Haptic feedback on all interactions
- [ ] Pull-to-refresh on lists
- [ ] Dark mode appearance
- [ ] Rotation handling (portrait only)

## Performance Considerations

### Memory Management
- Uses `@StateObject` for managers
- Proper `@EnvironmentObject` usage
- Async image loading with placeholders
- Lazy loading for large lists

### Network Optimization
- Token caching and refresh
- Pagination for large datasets
- Error retry logic
- Background task handling

## Accessibility

The app includes:
- VoiceOver support
- Dynamic Type support
- High contrast mode compatibility
- Accessibility labels on interactive elements

## Future Enhancements

### Planned Features
- Push notifications for match updates
- Offline mode for cached data
- Advanced match statistics
- Tournament bracket views
- Location-based player discovery
- Apple Watch companion app

### Technical Improvements
- Unit test coverage
- UI test automation
- Crash reporting integration
- Analytics integration
- Performance monitoring

## Contributing

1. Follow Swift style guidelines
2. Add haptic feedback to new interactions
3. Include proper error handling
4. Add accessibility labels
5. Test on multiple device sizes
6. Ensure dark mode compatibility

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with SwiftUI and iOS 18 APIs
- Uses DUPR's public API
- Inspired by the open-dupr-react web application