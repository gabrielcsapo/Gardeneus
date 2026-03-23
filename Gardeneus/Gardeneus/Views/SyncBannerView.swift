//
//  SyncBannerView.swift
//  Gardeneus
//

import SwiftUI

struct SyncBannerView: View {
    let syncEngine: SyncEngine?
    let isConnected: Bool

    private var pendingCount: Int {
        syncEngine?.pendingChangesCount ?? 0
    }

    var body: some View {
        if let syncEngine, syncEngine.isSyncing {
            HStack(spacing: 8) {
                ProgressView()
                    .controlSize(.small)
                Text("Syncing...")
                    .font(.caption.weight(.medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color.garden50.opacity(0.8), in: RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal)
            .transition(.move(edge: .top).combined(with: .opacity))
        } else if let error = syncEngine?.lastError {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.red)
                    .font(.caption)
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal)
            .transition(.move(edge: .top).combined(with: .opacity))
        } else if pendingCount > 0 && !isConnected {
            HStack(spacing: 8) {
                Image(systemName: "icloud.slash")
                    .foregroundStyle(.orange)
                    .font(.caption)
                Text("\(pendingCount) change\(pendingCount == 1 ? "" : "s") waiting to sync")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.orange.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal)
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}
