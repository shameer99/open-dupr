import SwiftUI
import WebKit

struct WebViewContainer: View {
    let url: URL
    let title: String
    
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    @State private var isLoading = true
    @State private var canGoBack = false
    @State private var canGoForward = false
    
    var body: some View {
        VStack(spacing: 0) {
            if isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                WebView(
                    url: url,
                    isLoading: $isLoading,
                    canGoBack: $canGoBack,
                    canGoForward: $canGoForward,
                    authToken: authManager.getValidToken
                )
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button(action: {
                    hapticManager.buttonTap()
                    // Refresh web view
                }) {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
    }
}

struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var canGoBack: Bool
    @Binding var canGoForward: Bool
    let authToken: () async -> String?
    
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        Task {
            if let token = await authToken() {
                var request = URLRequest(url: url)
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                
                await MainActor.run {
                    webView.load(request)
                }
            }
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        let parent: WebView
        
        init(_ parent: WebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.canGoBack = webView.canGoBack
            parent.canGoForward = webView.canGoForward
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }
    }
}

// Validation Queue Web View
struct ValidationQueueWebView: View {
    var body: some View {
        WebViewContainer(
            url: URL(string: "https://dupr.com/validation-queue")!,
            title: "Validation Queue"
        )
    }
}

// Match Details Web View
struct MatchDetailsWebView: View {
    let matchId: Int
    
    var body: some View {
        WebViewContainer(
            url: URL(string: "https://dupr.com/match/\(matchId)")!,
            title: "Match Details"
        )
    }
}

#Preview {
    NavigationView {
        ValidationQueueWebView()
            .environmentObject(AuthenticationManager())
            .environmentObject(HapticManager())
    }
}