import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    // Android notification channel
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    // iOS notification settings
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Firebase messaging setup
    await _setupFirebaseMessaging();
    
    _isInitialized = true;
  }

  Future<void> _setupFirebaseMessaging() async {
    // Request permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (kDebugMode) {
      print('Notification permission: ${settings.authorizationStatus}');
    }

    // Get FCM token
    String? token = await _firebaseMessaging.getToken();
    if (kDebugMode) {
      print('FCM Token: $token');
    }

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessageHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_showLocalNotification);

    // Handle notification taps when app is terminated/background
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'productivity_channel',
      'Productivity Platform',
      channelDescription: 'Notifications for Productivity Platform',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
    );

    DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotificationsPlugin.show(
      0,
      message.notification?.title ?? 'New Notification',
      message.notification?.body ?? 'You have a new notification',
      notificationDetails,
      payload: message.data['type'] ?? 'general',
    );
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    required String payload,
  }) async {
    AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'local_channel',
      'Local Notifications',
      channelDescription: 'Local notifications from the app',
      importance: Importance.high,
      priority: Priority.high,
    );

    DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotificationsPlugin.show(
      0,
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  void _onNotificationTap(NotificationResponse response) {
    if (kDebugMode) {
      print('Notification tapped: ${response.payload}');
    }
    // Handle notification tap based on payload
    // You can use Provider or Navigation service here
  }

  void _onMessageOpenedApp(RemoteMessage message) {
    if (kDebugMode) {
      print('Message opened from background: ${message.data}');
    }
    // Handle notification when app is opened from background
  }

  static Future<void> _firebaseBackgroundMessageHandler(
      RemoteMessage message) async {
    if (kDebugMode) {
      print('Background message received: ${message.notification?.title}');
    }
  }

  Future<String?> getFCMToken() async {
    return await _firebaseMessaging.getToken();
  }

  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }

  Future<void> cancelAllNotifications() async {
    await _localNotificationsPlugin.cancelAll();
  }
}