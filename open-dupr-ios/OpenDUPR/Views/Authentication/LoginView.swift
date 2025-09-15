import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var animateGradient = false
    @FocusState private var focusedField: Field?
    
    enum Field {
        case email, password
    }
    
    var body: some View {
        ZStack {
            // Animated background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.blue.opacity(0.3),
                    Color.purple.opacity(0.3),
                    Color.pink.opacity(0.3)
                ]),
                startPoint: animateGradient ? .topLeading : .bottomTrailing,
                endPoint: animateGradient ? .bottomTrailing : .topLeading
            )
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) {
                    animateGradient.toggle()
                }
            }
            
            ScrollView {
                VStack(spacing: 30) {
                    Spacer(minLength: 60)
                    
                    // Logo and title
                    VStack(spacing: 20) {
                        Image(systemName: "sportscourt.fill")
                            .font(.system(size: 80))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.blue, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        
                        VStack(spacing: 8) {
                            Text("Open DUPR")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            
                            Text("Clean • Fast • Open Source")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Login form
                    VStack(spacing: 20) {
                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.primary)
                            
                            TextField("Enter your email", text: $email)
                                .textFieldStyle(ModernTextFieldStyle())
                                .keyboardType(.emailAddress)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .focused($focusedField, equals: .email)
                                .onSubmit {
                                    focusedField = .password
                                }
                        }
                        
                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.primary)
                            
                            HStack {
                                Group {
                                    if showPassword {
                                        TextField("Enter your password", text: $password)
                                    } else {
                                        SecureField("Enter your password", text: $password)
                                    }
                                }
                                .textContentType(.password)
                                .focused($focusedField, equals: .password)
                                .onSubmit {
                                    Task {
                                        await login()
                                    }
                                }
                                
                                Button(action: {
                                    hapticManager.buttonTap()
                                    showPassword.toggle()
                                }) {
                                    Image(systemName: showPassword ? "eye.slash" : "eye")
                                        .foregroundColor(.secondary)
                                }
                            }
                            .textFieldStyle(ModernTextFieldStyle())
                        }
                        
                        // Error message
                        if let errorMessage = authManager.errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(.horizontal)
                                .multilineTextAlignment(.center)
                        }
                        
                        // Login button
                        Button(action: {
                            Task {
                                await login()
                            }
                        }) {
                            HStack {
                                if authManager.isLoading {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                        .tint(.white)
                                }
                                
                                Text(authManager.isLoading ? "Signing In..." : "Sign In")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        }
                        .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                        .opacity(authManager.isLoading || email.isEmpty || password.isEmpty ? 0.6 : 1.0)
                    }
                    .padding(.horizontal, 32)
                    
                    Spacer()
                }
            }
        }
    }
    
    private func login() async {
        hapticManager.buttonTap()
        focusedField = nil
        
        await authManager.login(email: email, password: password)
        
        if authManager.isAuthenticated {
            hapticManager.successAction()
        } else {
            hapticManager.errorAction()
        }
    }
}

struct ModernTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
            )
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthenticationManager())
        .environmentObject(HapticManager())
}