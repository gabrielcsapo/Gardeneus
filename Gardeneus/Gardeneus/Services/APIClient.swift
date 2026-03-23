import Foundation

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, body: String?)
    case decodingError(Error)
    case encodingError(Error)
    case networkError(Error)
    case noData
    case serverUnreachable

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode, let body):
            return "HTTP error \(statusCode)\(body.map { ": \($0)" } ?? "")"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .noData:
            return "No data received"
        case .serverUnreachable:
            return "Server is unreachable"
        }
    }
}

// MARK: - HTTP Method

private enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - API Client

actor APIClient {
    let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: URL) {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    // MARK: - Private Helpers

    private func buildURL(path: String, queryItems: [URLQueryItem]? = nil) throws -> URL {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems
        guard let url = components?.url else {
            throw APIError.invalidURL
        }
        return url
    }

    private func request<T: Decodable>(
        method: HTTPMethod,
        path: String,
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        let url = try buildURL(path: path, queryItems: queryItems)
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                urlRequest.httpBody = try encoder.encode(body)
            } catch {
                throw APIError.encodingError(error)
            }
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    private func requestVoid(
        method: HTTPMethod,
        path: String,
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws {
        let url = try buildURL(path: path, queryItems: queryItems)
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                urlRequest.httpBody = try encoder.encode(body)
            } catch {
                throw APIError.encodingError(error)
            }
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }
    }

    /// Send a raw JSON dictionary body (for partial updates with [String: Any]).
    private func requestWithRawJSON<T: Decodable>(
        method: HTTPMethod,
        path: String,
        jsonDict: [String: Any]
    ) async throws -> T {
        let url = try buildURL(path: path)
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        urlRequest.httpBody = try JSONSerialization.data(withJSONObject: jsonDict)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    /// Send a raw JSON dictionary body without decoding the response.
    private func requestVoidRawJSON(
        method: HTTPMethod,
        path: String,
        jsonDict: [String: Any]
    ) async throws {
        let url = try buildURL(path: path)
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        urlRequest.httpBody = try JSONSerialization.data(withJSONObject: jsonDict)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }
    }

    /// Returns raw JSON dictionary (for weather and other untyped responses).
    private func requestRawJSON(
        method: HTTPMethod,
        path: String,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> [String: Any] {
        let url = try buildURL(path: path, queryItems: queryItems)
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw APIError.invalidResponse
        }

        return json
    }

    // MARK: - Health Check

    func healthCheck() async throws -> Bool {
        let url = try buildURL(path: "/api/health")
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        urlRequest.timeoutInterval = 5

        do {
            let (_, response) = try await session.data(for: urlRequest)
            guard let httpResponse = response as? HTTPURLResponse else {
                return false
            }
            return (200...299).contains(httpResponse.statusCode)
        } catch {
            return false
        }
    }

    // MARK: - Settings

    func getSettings() async throws -> SettingsDTO? {
        return try await request(method: .get, path: "/api/settings")
    }

    func updateSettings(_ data: SettingsDTO) async throws -> SettingsDTO {
        return try await request(method: .post, path: "/api/settings", body: data)
    }

    // MARK: - Yards

    func getYards() async throws -> [YardDTO] {
        return try await request(method: .get, path: "/api/yards")
    }

    func getYard(id: Int) async throws -> YardDTO {
        return try await request(method: .get, path: "/api/yards/\(id)")
    }

    func createYard(name: String, widthFt: Int, heightFt: Int) async throws -> YardDTO {
        let body: [String: Any] = ["name": name, "widthFt": widthFt, "heightFt": heightFt]
        return try await requestWithRawJSON(method: .post, path: "/api/yards", jsonDict: body)
    }

    func deleteYard(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/yards/\(id)")
    }

    // MARK: - Elements

    func getElements(yardId: Int) async throws -> [YardElementDTO] {
        return try await request(method: .get, path: "/api/yards/\(yardId)/elements")
    }

    func createElement(yardId: Int, data: [String: Any]) async throws {
        try await requestVoidRawJSON(method: .post, path: "/api/yards/\(yardId)/elements", jsonDict: data)
    }

    func updateElement(id: Int, data: [String: Any]) async throws -> YardElementDTO {
        return try await requestWithRawJSON(method: .put, path: "/api/elements/\(id)", jsonDict: data)
    }

    func deleteElement(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/elements/\(id)")
    }

    // MARK: - Plants (read-only)

    func getPlants() async throws -> [PlantDTO] {
        return try await request(method: .get, path: "/api/plants")
    }

    // MARK: - Plantings

    func getPlantings() async throws -> [PlantingDTO] {
        return try await request(method: .get, path: "/api/plantings")
    }

    func createPlanting(_ data: PlantingDTO) async throws {
        try await requestVoid(method: .post, path: "/api/plantings", body: data)
    }

    func updatePlanting(id: Int, data: [String: Any]) async throws -> PlantingDTO {
        return try await requestWithRawJSON(method: .patch, path: "/api/plantings/\(id)", jsonDict: data)
    }

    func deletePlanting(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/plantings/\(id)")
    }

    // MARK: - Log Entries

    func getLogEntries() async throws -> [LogEntryDTO] {
        return try await request(method: .get, path: "/api/log-entries")
    }

    func createLogEntry(_ data: LogEntryDTO) async throws {
        try await requestVoid(method: .post, path: "/api/log-entries", body: data)
    }

    func deleteLogEntry(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/log-entries/\(id)")
    }

    // MARK: - Seed Inventory

    func getSeeds() async throws -> [SeedInventoryDTO] {
        return try await request(method: .get, path: "/api/seed-inventory")
    }

    func addSeed(_ data: SeedInventoryDTO) async throws {
        try await requestVoid(method: .post, path: "/api/seed-inventory", body: data)
    }

    func deleteSeed(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/seed-inventory/\(id)")
    }

    // MARK: - Tasks

    func getTasks() async throws -> [GardenTaskDTO] {
        return try await request(method: .get, path: "/api/tasks")
    }

    func createTask(_ data: GardenTaskDTO) async throws {
        try await requestVoid(method: .post, path: "/api/tasks", body: data)
    }

    func completeTask(id: Int) async throws {
        try await requestVoid(method: .put, path: "/api/tasks/\(id)/complete")
    }

    func deleteTask(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/tasks/\(id)")
    }

    // MARK: - Pests (read-only)

    func getPests() async throws -> [PestDiseaseDTO] {
        return try await request(method: .get, path: "/api/pests")
    }

    // MARK: - Soil Profiles

    func getSoilProfiles() async throws -> [SoilProfileDTO] {
        return try await request(method: .get, path: "/api/soil-profiles")
    }

    func addSoilProfile(_ data: SoilProfileDTO) async throws {
        try await requestVoid(method: .post, path: "/api/soil-profiles", body: data)
    }

    func deleteSoilProfile(id: Int) async throws {
        try await requestVoid(method: .delete, path: "/api/soil-profiles/\(id)")
    }

    // MARK: - Weather

    func getWeather(lat: Double? = nil, lon: Double? = nil) async throws -> [String: Any] {
        var queryItems: [URLQueryItem] = []
        if let lat { queryItems.append(URLQueryItem(name: "lat", value: String(lat))) }
        if let lon { queryItems.append(URLQueryItem(name: "lon", value: String(lon))) }
        return try await requestRawJSON(method: .get, path: "/api/weather", queryItems: queryItems.isEmpty ? nil : queryItems)
    }

    // MARK: - Photos

    struct PhotoUploadResponse: Codable {
        let fileName: String
        let path: String
    }

    /// Upload a photo as multipart form data. Returns the server filename.
    func uploadPhoto(imageData: Data, fileName: String) async throws -> String {
        let url = try buildURL(path: "/api/photos")
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"

        let boundary = "Boundary-\(UUID().uuidString)"
        urlRequest.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        // fileName field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"fileName\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(fileName)\r\n".data(using: .utf8)!)
        // file field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        urlRequest.httpBody = body

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let bodyStr = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: bodyStr)
        }

        let result = try decoder.decode(PhotoUploadResponse.self, from: data)
        return result.fileName
    }

    // MARK: - Sync

    func fullSync() async throws -> SyncResponseDTO {
        return try await request(method: .get, path: "/api/sync")
    }

    func incrementalSync(since: String) async throws -> SyncResponseDTO {
        let queryItems = [URLQueryItem(name: "since", value: since)]
        return try await request(method: .get, path: "/api/sync", queryItems: queryItems)
    }

    func pushSync(_ data: SyncResponseDTO) async throws -> PushSyncResponseDTO {
        return try await request(method: .post, path: "/api/sync", body: data)
    }
}
