//
//  MoreView.swift
//  Gardeneus
//

import SwiftUI

struct MoreView: View {
    @Environment(ServerDiscovery.self) private var serverDiscovery
    var syncEngine: SyncEngine?

    @State private var isSyncing = false

    var body: some View {
        NavigationStack {
            List {
                // Sync status
                Section {
                    syncStatusRow
                }

                Section("Garden") {
                    NavigationLink {
                        PlantLibraryView()
                    } label: {
                        Label("Plants", systemImage: "leaf.circle")
                            .foregroundStyle(.primary)
                    }
                }

                Section {
                    NavigationLink {
                        SettingsView(syncEngine: syncEngine)
                    } label: {
                        Label("Settings", systemImage: "gearshape")
                            .foregroundStyle(.primary)
                    }
                }
            }
            .navigationTitle("More")
        }
    }

    private var syncStatusRow: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(serverDiscovery.isConnected ? Color.green : Color.red)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(serverDiscovery.isConnected ? "Connected" : "Offline")
                    .font(.subheadline.weight(.medium))
                if let relative = syncEngine?.lastSyncRelative {
                    Text("Synced \(relative)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Never synced")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if serverDiscovery.isConnected {
                Button("Sync Now") {
                    Task { await performSync() }
                }
                .font(.caption.weight(.medium))
                .buttonStyle(.bordered)
                .tint(.gardenGreen)
                .disabled(isSyncing)
            }
        }
    }

    private func performSync() async {
        guard let syncEngine else { return }
        isSyncing = true
        defer { isSyncing = false }
        do {
            try await syncEngine.fullSync()
        } catch {
            print("Sync error: \(error)")
        }
    }
}
