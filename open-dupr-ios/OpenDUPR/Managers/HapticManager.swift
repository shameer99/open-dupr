import Foundation
import UIKit

@MainActor
class HapticManager: ObservableObject {
    
    enum HapticType {
        case light
        case medium
        case heavy
        case success
        case warning
        case error
        case selection
    }
    
    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let notificationFeedback = UINotificationFeedbackGenerator()
    private let selectionFeedback = UISelectionFeedbackGenerator()
    
    init() {
        // Prepare generators for better performance
        lightImpact.prepare()
        mediumImpact.prepare()
        heavyImpact.prepare()
        notificationFeedback.prepare()
        selectionFeedback.prepare()
    }
    
    func trigger(_ type: HapticType) {
        switch type {
        case .light:
            lightImpact.impactOccurred()
        case .medium:
            mediumImpact.impactOccurred()
        case .heavy:
            heavyImpact.impactOccurred()
        case .success:
            notificationFeedback.notificationOccurred(.success)
        case .warning:
            notificationFeedback.notificationOccurred(.warning)
        case .error:
            notificationFeedback.notificationOccurred(.error)
        case .selection:
            selectionFeedback.selectionChanged()
        }
    }
    
    // Convenience methods for common interactions
    func buttonTap() {
        trigger(.light)
    }
    
    func cardTap() {
        trigger(.medium)
    }
    
    func successAction() {
        trigger(.success)
    }
    
    func errorAction() {
        trigger(.error)
    }
    
    func tabSelection() {
        trigger(.selection)
    }
    
    func pullToRefresh() {
        trigger(.medium)
    }
}