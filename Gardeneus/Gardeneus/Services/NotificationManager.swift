import Foundation
import UserNotifications
import SwiftData

class NotificationManager {
    static let shared = NotificationManager()

    private init() {}

    func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }

    /// Schedules a notification for a garden task
    func scheduleTaskReminder(taskId: String, title: String, body: String, date: Date) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.categoryIdentifier = "GARDEN_TASK"

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(identifier: "task-\(taskId)", content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request)
    }

    /// Schedules a frost alert for the evening before a frost date
    func scheduleFrostAlert(frostDate: String, isLast: Bool) {
        guard let date = parseDate(frostDate) else { return }

        let alertDate = Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date
        var components = Calendar.current.dateComponents([.year, .month, .day], from: alertDate)
        components.hour = 18
        components.minute = 0

        let content = UNMutableNotificationContent()
        content.title = isLast ? "Last Frost Tomorrow" : "First Frost Tomorrow"
        content.body = isLast
            ? "Your last frost date is tomorrow. Get ready to start transplanting!"
            : "Your first frost date is tomorrow. Protect tender plants!"
        content.sound = .default
        content.categoryIdentifier = "FROST_ALERT"

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let id = isLast ? "frost-last" : "frost-first"

        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        )
    }

    /// Schedules a daily watering reminder at 7 AM
    func scheduleWateringReminder(enabled: Bool) {
        let id = "watering-daily"
        if !enabled {
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Watering Reminder"
        content.body = "Time to check your garden beds and water as needed."
        content.sound = .default
        content.categoryIdentifier = "WATERING"

        var components = DateComponents()
        components.hour = 7
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)

        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        )
    }

    /// Removes all pending garden notifications
    func removeAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }

    private func parseDate(_ str: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: str)
    }
}
