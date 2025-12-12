import UIKit
import Flutter
import Firebase

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Initialize Firebase
    FirebaseApp.configure()
    
    GeneratedPluginRegistrant.register(with: self)
    
    // Set minimum background fetch interval
    UIApplication.shared.setMinimumBackgroundFetchInterval(UIApplication.backgroundFetchIntervalMinimum)
    
    // Configure notifications
    UNUserNotificationCenter.current().delegate = self
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // Handle remote notifications
  override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    // Handle FCM messages
    Messaging.messaging().appDidReceiveMessage(userInfo)
    
    completionHandler(.newData)
  }
  
  // Handle notification registration
  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // Pass device token to Firebase
    Messaging.messaging().apnsToken = deviceToken
    
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }
  
  // Handle notification center delegate for foreground notifications
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Show notification even when app is in foreground
    completionHandler([[.banner, .sound, .badge]])
  }
  
  // Handle notification tap
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    
    // Handle notification data
    if let notificationType = userInfo["type"] as? String {
      // Navigate based on notification type
      handleNotificationNavigation(type: notificationType, data: userInfo)
    }
    
    completionHandler()
  }
  
  private func handleNotificationNavigation(type: String, data: [AnyHashable: Any]) {
    // Get Flutter view controller
    guard let controller = window?.rootViewController as? FlutterViewController else {
      return
    }
    
    let channel = FlutterMethodChannel(
      name: "com.example.productivityplatform/notifications",
      binaryMessenger: controller.binaryMessenger
    )
    
    // Send notification data to Flutter
    channel.invokeMethod("onNotificationTap", arguments: [
      "type": type,
      "data": data
    ])
  }
  
  // Handle deep links
  override func application(
    _ application: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // Handle deep links
    return super.application(application, open: url, options: options)
  }
  
  // Handle universal links
  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    // Handle universal links
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
  
  // Handle background fetch
  override func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    // Perform background sync
    syncDataInBackground(completionHandler: completionHandler)
  }
  
  private func syncDataInBackground(completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    // Implement background sync logic
    // For now, just return no new data
    completionHandler(.noData)
  }
  
  // Handle memory warning
  override func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    // Clear cache if needed
    URLCache.shared.removeAllCachedResponses()
  }
}