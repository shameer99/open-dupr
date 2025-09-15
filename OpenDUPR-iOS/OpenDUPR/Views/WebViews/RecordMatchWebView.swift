//
//  RecordMatchWebView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import WebKit

struct RecordMatchWebView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var haptic: HapticManager
    @State private var isLoading = true
    
    var body: some View {
        NavigationStack {
            ZStack {
                WebView(
                    url: URL(string: "https://opendupr.com/record-match")!,
                    isLoading: $isLoading,
                    onNavigationCommit: { _ in
                        haptic.impact(.light)
                    }
                )
                
                if isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
            .navigationTitle("Record Match")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        haptic.impact(.medium)
                        dismiss()
                    }
                }
            }
        }
    }
}

struct RatingHistoryWebView: View {
    let userId: Int
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var haptic: HapticManager
    @State private var isLoading = true
    
    var body: some View {
        NavigationStack {
            ZStack {
                WebView(
                    url: URL(string: "https://opendupr.com/player/\(userId)/rating-history")!,
                    isLoading: $isLoading,
                    onNavigationCommit: { _ in
                        haptic.impact(.light)
                    }
                )
                
                if isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
            .navigationTitle("Rating History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        haptic.impact(.medium)
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - WebView Component

struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    var onNavigationCommit: ((WKNavigation) -> Void)?
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        
        // Add access token to headers if available
        if let token = KeychainManager.shared.getAccessToken() {
            var request = URLRequest(url: url)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            webView.load(request)
        } else {
            webView.load(URLRequest(url: url))
        }
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {}
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebView
        
        init(_ parent: WebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
        }
        
        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            parent.onNavigationCommit?(navigation)
        }
    }
}