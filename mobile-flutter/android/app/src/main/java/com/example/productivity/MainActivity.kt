package com.example.productivity

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.GeneratedPluginRegistrant

class MainActivity : FlutterActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Handle splash screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val splashScreen = installSplashScreen()
            splashScreen.setKeepOnScreenCondition { true }
        }
        
        // Make app full screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        
        // Make status bar and navigation bar transparent
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            WindowCompat.setDecorFitsSystemWindows(window, false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
        }
        
        // Keep screen on for debugging (remove in production)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        super.onCreate(savedInstanceState)
    }
    
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        // Register all Flutter plugins
        GeneratedPluginRegistrant.registerWith(flutterEngine)
        
        // Add custom platform channels if needed
        // Example:
        // flutterEngine.platformViewsController.registry
        //     .registerViewFactory("native_view", NativeViewFactory())
        
        // Set up method channels
        setupMethodChannels(flutterEngine)
    }
    
    private fun setupMethodChannels(flutterEngine: FlutterEngine) {
        // Example method channel setup
        // val methodChannel = MethodChannel(
        //     flutterEngine.dartExecutor.binaryMessenger,
        //     "com.example.productivity/channel"
        // )
        // 
        // methodChannel.setMethodCallHandler { call, result ->
        //     when (call.method) {
        //         "getDeviceInfo" -> {
        //             val deviceInfo = mapOf(
        //                 "brand" to Build.BRAND,
        //                 "model" to Build.MODEL,
        //                 "sdkVersion" to Build.VERSION.SDK_INT.toString(),
        //                 "version" to Build.VERSION.RELEASE
        //             )
        //             result.success(deviceInfo)
        //         }
        //         "showToast" -> {
        //             val message = call.arguments as String
        //             Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        //             result.success(true)
        //         }
        //         else -> result.notImplemented()
        //     }
        // }
    }
    
    override fun onResume() {
        super.onResume()
        // App resumed logic
    }
    
    override fun onPause() {
        super.onPause()
        // App paused logic
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Cleanup resources
    }
    
    override fun onBackPressed() {
        // Handle back button press
        // You can send a message to Flutter to handle navigation
        super.onBackPressed()
    }
    
    // Handle deep links
    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        // Handle deep link intents
        // Example: if (intent.action == Intent.ACTION_VIEW) {
        //     val data = intent.dataString
        //     // Send data to Flutter
        // }
    }
    
    // Handle permissions result
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        // Handle permission results if needed
    }
    
    // Handle activity result
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        // Handle activity results (e.g., file picker, image picker)
    }
}