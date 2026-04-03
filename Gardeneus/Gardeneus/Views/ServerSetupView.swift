import SwiftUI

struct ServerSetupView: View {
    @Environment(ServerDiscovery.self) private var serverDiscovery

    @State private var urlInput: String = ""
    @State private var isTesting: Bool = false
    @State private var testResult: TestResult?

    enum TestResult {
        case success
        case failure(String)
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 24) {
                // App icon
                Image(systemName: "leaf.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(Color("GardenGreen"))

                VStack(spacing: 8) {
                    Text("Welcome to Gardeneus")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Enter your server address to get started.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 16) {
                    TextField("http://192.168.1.100:3001", text: $urlInput)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .onSubmit { Task { await connect() } }

                    Button(action: { Task { await connect() } }) {
                        HStack(spacing: 8) {
                            if isTesting {
                                ProgressView()
                                    .tint(.white)
                            }
                            Text(isTesting ? "Connecting..." : "Connect")
                                .fontWeight(.medium)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color("GardenGreen"))
                    .disabled(urlInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isTesting)

                    if let testResult {
                        switch testResult {
                        case .success:
                            Label("Connected successfully", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                                .font(.subheadline)
                        case .failure(let message):
                            Label(message, systemImage: "xmark.circle.fill")
                                .foregroundStyle(.red)
                                .font(.subheadline)
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
            .padding(.horizontal, 40)

            Spacer()

            Text("You can change this later in Settings.")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .padding(.bottom, 24)
        }
    }

    private func connect() async {
        let trimmed = urlInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        isTesting = true
        testResult = nil

        // Temporarily set the URL so testConnection uses it
        serverDiscovery.serverURL = trimmed

        let success = await serverDiscovery.testConnection()

        if success {
            testResult = .success
        } else {
            // Clear the URL so isConfigured stays false
            serverDiscovery.serverURL = ""
            testResult = .failure("Could not connect to \(trimmed)")
        }

        isTesting = false
    }
}

#Preview {
    ServerSetupView()
        .environment(ServerDiscovery())
}
