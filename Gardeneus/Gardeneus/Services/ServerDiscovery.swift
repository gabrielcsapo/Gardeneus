import Foundation
import Observation

// MARK: - Server Discovery

@Observable
class ServerDiscovery {
    var serverURL: String {
        didSet {
            UserDefaults.standard.set(serverURL, forKey: Self.serverURLKey)
        }
    }
    var isConnected: Bool = false
    var lastChecked: Date?

    private static let serverURLKey = "serverURL"
    private static let defaultURL = "http://localhost:3001"

    init() {
        self.serverURL = UserDefaults.standard.string(forKey: Self.serverURLKey) ?? Self.defaultURL
    }

    /// Tests whether the currently configured server URL is reachable
    /// by performing a health check request. Updates `isConnected`
    /// and `lastChecked` accordingly.
    @discardableResult
    func testConnection() async -> Bool {
        guard let client = makeAPIClient() else {
            await MainActor.run { [self] in
                isConnected = false
                lastChecked = Date()
            }
            return false
        }

        do {
            let healthy = try await client.healthCheck()
            await MainActor.run { [self] in
                isConnected = healthy
                lastChecked = Date()
            }
            return healthy
        } catch {
            await MainActor.run { [self] in
                isConnected = false
                lastChecked = Date()
            }
            return false
        }
    }

    /// Creates an `APIClient` instance from the current server URL.
    /// Returns `nil` if the URL string is not a valid URL.
    func makeAPIClient() -> APIClient? {
        let trimmed = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let url = URL(string: trimmed) else {
            return nil
        }
        return APIClient(baseURL: url)
    }
}
