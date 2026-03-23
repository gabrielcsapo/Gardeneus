import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(ServerDiscovery.self) private var serverDiscovery

    @Query private var settings: [Settings]

    var syncEngine: SyncEngine?
    @State private var isSyncing = false
    @State private var showSyncAlert = false
    @State private var syncAlertMessage = ""
    @State private var wateringReminders = UserDefaults.standard.bool(forKey: "wateringReminders")
    @State private var notificationsEnabled = false

    private var userSettings: Settings? { settings.first }

    var body: some View {
        NavigationStack {
            Form {
                // Server connection
                serverSection

                // Sync controls
                syncSection

                // Garden info (read-only from server)
                if let s = userSettings {
                    gardenInfoSection(s)
                }

                // Notifications
                notificationsSection

                // About
                aboutSection
            }
            .navigationTitle("Settings")
            .alert("Sync", isPresented: $showSyncAlert) {
                Button("OK") {}
            } message: {
                Text(syncAlertMessage)
            }
        }
    }

    // MARK: - Server Section

    @ViewBuilder
    private var serverSection: some View {
        @Bindable var discovery = serverDiscovery
        Section {
            TextField("Server URL", text: $discovery.serverURL)
                .textContentType(.URL)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .keyboardType(.URL)

            HStack {
                Circle()
                    .fill(serverDiscovery.isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                Text(serverDiscovery.isConnected ? "Connected" : "Not Connected")
                    .font(.subheadline)
                Spacer()
                Button("Test") {
                    Task {
                        await serverDiscovery.testConnection()
                    }
                }
                .font(.subheadline.weight(.medium))
            }

            if let lastChecked = serverDiscovery.lastChecked {
                Text("Last checked: \(lastChecked.formatted(date: .abbreviated, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        } header: {
            Text("Server Connection")
        } footer: {
            Text("Enter the URL of your Gardeneus web server (e.g. http://192.168.1.100:3001)")
        }
    }

    // MARK: - Sync Section

    private var syncSection: some View {
        Section("Sync") {
            Button {
                Task { await performFullSync() }
            } label: {
                HStack {
                    Label("Full Sync", systemImage: "arrow.triangle.2.circlepath")
                    Spacer()
                    if isSyncing {
                        ProgressView()
                            .controlSize(.small)
                    }
                }
            }
            .disabled(isSyncing || !serverDiscovery.isConnected)

            Button {
                Task { await performIncrementalSync() }
            } label: {
                Label("Incremental Sync", systemImage: "arrow.clockwise")
            }
            .disabled(isSyncing || !serverDiscovery.isConnected || syncEngine?.lastSyncDate == nil)

            if let relative = syncEngine?.lastSyncRelative {
                HStack {
                    Text("Last sync")
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(relative)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if let error = syncEngine?.lastError {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }
        }
    }

    // MARK: - Garden Info

    private func gardenInfoSection(_ s: Settings) -> some View {
        Section("Garden Info") {
            infoRow("Zone", value: s.zone)
            infoRow("Zip Code", value: s.zipCode)
            infoRow("Last Frost", value: s.lastFrostDate)
            infoRow("First Frost", value: s.firstFrostDate)
            if let lat = s.latitude, let lon = s.longitude {
                infoRow("Location", value: String(format: "%.4f, %.4f", lat, lon))
            }
        }
    }

    private func infoRow(_ label: String, value: String?) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text(value ?? "-")
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        Section {
            Toggle("Watering Reminders", isOn: $wateringReminders)
                .onChange(of: wateringReminders) { _, enabled in
                    UserDefaults.standard.set(enabled, forKey: "wateringReminders")
                    NotificationManager.shared.scheduleWateringReminder(enabled: enabled)
                }

            Button("Schedule Frost Alerts") {
                if let s = userSettings {
                    if let last = s.lastFrostDate {
                        NotificationManager.shared.scheduleFrostAlert(frostDate: last, isLast: true)
                    }
                    if let first = s.firstFrostDate {
                        NotificationManager.shared.scheduleFrostAlert(frostDate: first, isLast: false)
                    }
                    syncAlertMessage = "Frost alerts scheduled!"
                    showSyncAlert = true
                }
            }
            .disabled(userSettings?.lastFrostDate == nil)

            if !notificationsEnabled {
                Button("Enable Notifications") {
                    Task {
                        notificationsEnabled = await NotificationManager.shared.requestPermission()
                    }
                }
            }
        } header: {
            Text("Notifications")
        } footer: {
            Text("Get reminders for watering and frost date alerts.")
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        Section("About") {
            HStack {
                Text("App Version")
                Spacer()
                Text("1.0.0")
                    .foregroundStyle(.secondary)
            }
            HStack {
                Text("Data Source")
                Spacer()
                Text("Gardeneus Web")
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Sync Actions

    private func performFullSync() async {
        guard let syncEngine else { return }
        isSyncing = true
        defer { isSyncing = false }
        do {
            try await syncEngine.fullSync()
            syncAlertMessage = "Full sync completed successfully!"
            showSyncAlert = true
        } catch {
            syncAlertMessage = "Sync failed: \(error.localizedDescription)"
            showSyncAlert = true
        }
    }

    private func performIncrementalSync() async {
        guard let syncEngine else { return }
        isSyncing = true
        defer { isSyncing = false }
        do {
            try await syncEngine.incrementalSync()
            syncAlertMessage = "Incremental sync completed!"
            showSyncAlert = true
        } catch {
            syncAlertMessage = "Sync failed: \(error.localizedDescription)"
            showSyncAlert = true
        }
    }
}
