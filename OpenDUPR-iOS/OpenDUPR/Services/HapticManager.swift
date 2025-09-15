//
//  HapticManager.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import Foundation
import UIKit
import CoreHaptics

class HapticManager: ObservableObject {
    static let shared = HapticManager()
    
    private var engine: CHHapticEngine?
    private let impactGenerator = UIImpactFeedbackGenerator()
    private let selectionGenerator = UISelectionFeedbackGenerator()
    private let notificationGenerator = UINotificationFeedbackGenerator()
    
    private init() {
        prepareHaptics()
    }
    
    private func prepareHaptics() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        
        do {
            engine = try CHHapticEngine()
            try engine?.start()
        } catch {
            print("Haptic engine failed to start: \(error)")
        }
        
        impactGenerator.prepare()
        selectionGenerator.prepare()
        notificationGenerator.prepare()
    }
    
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    func selection() {
        selectionGenerator.selectionChanged()
    }
    
    func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notificationGenerator.notificationOccurred(type)
    }
    
    // Custom haptic patterns for special interactions
    func playCustomPattern(intensity: Float = 1.0, sharpness: Float = 1.0, duration: TimeInterval = 0.1) {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics,
              let engine = engine else {
            impact(.medium)
            return
        }
        
        do {
            let pattern = try CHHapticPattern(
                events: [
                    CHHapticEvent(
                        eventType: .hapticTransient,
                        parameters: [
                            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                            CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness)
                        ],
                        relativeTime: 0,
                        duration: duration
                    )
                ],
                parameters: []
            )
            
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: 0)
        } catch {
            print("Failed to play custom haptic: \(error)")
            impact(.medium)
        }
    }
    
    // Special patterns
    func successPattern() {
        playCustomPattern(intensity: 0.8, sharpness: 0.8, duration: 0.1)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.playCustomPattern(intensity: 1.0, sharpness: 1.0, duration: 0.15)
        }
    }
    
    func bouncePattern() {
        playCustomPattern(intensity: 1.0, sharpness: 0.5, duration: 0.1)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
            self?.playCustomPattern(intensity: 0.5, sharpness: 0.5, duration: 0.1)
        }
    }
}