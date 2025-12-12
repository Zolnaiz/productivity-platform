package com.example.productivity

import android.app.Application
import android.content.Context
import android.os.StrictMode
import android.util.Log
import androidx.work.Configuration
import com.facebook.FacebookSdk
import com.facebook.appevents.AppEventsLogger
import com.google.firebase.FirebaseApp
import com.google.firebase.crashlytics.FirebaseCrashlytics
import io.sentry.android.core.SentryAndroid

class DebugApplication : Application(), Configuration.Provider {
    
    companion object {
        private const val TAG = "DebugApplication"
        var instance: DebugApplication? = null
            private set
    }
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Enable StrictMode for detecting issues during development
        enableStrictMode()
        
        // Initialize Firebase for debug
        initializeFirebase()
        
        // Initialize Facebook SDK for debug
        initializeFacebook()
        
        // Initialize Sentry for error tracking in debug
        initializeSentry()
        
        // Initialize WorkManager configuration
        initializeWorkManager()
        
        // Log application start
        Log.d(TAG, "DebugApplication started")
    }
    
    private fun enableStrictMode() {
        if (BuildConfig.DEBUG) {
            StrictMode.setThreadPolicy(
                StrictMode.ThreadPolicy.Builder()
                    .detectDiskReads()
                    .detectDiskWrites()
                    .detectNetwork()
                    .penaltyLog()
                    .penaltyFlashScreen()
                    .build()
            )
            
            StrictMode.setVmPolicy(
                StrictMode.VmPolicy.Builder()
                    .detectLeakedSqlLiteObjects()
                    .detectLeakedClosableObjects()
                    .detectActivityLeaks()
                    .detectLeakedRegistrationObjects()
                    .penaltyLog()
                    .build()
            )
            
            Log.d(TAG, "StrictMode enabled for debug")
        }
    }
    
    private fun initializeFirebase() {
        try {
            FirebaseApp.initializeApp(this)
            
            // Enable Crashlytics only for non-debug builds in production
            // For debug, we can disable it or enable debug mode
            FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(false)
            
            Log.d(TAG, "Firebase initialized for debug")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Firebase: ${e.message}")
        }
    }
    
    private fun initializeFacebook() {
        try {
            FacebookSdk.sdkInitialize(applicationContext)
            FacebookSdk.setAutoInitEnabled(true)
            FacebookSdk.fullyInitialize()
            AppEventsLogger.activateApp(this)
            
            Log.d(TAG, "Facebook SDK initialized for debug")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Facebook SDK: ${e.message}")
        }
    }
    
    private fun initializeSentry() {
        try {
            SentryAndroid.init(this) { options ->
                options.dsn = "https://debug@sentry.io/123456"
                options.environment = "development"
                options.isDebug = true
                options.tracesSampleRate = 1.0
                options.profilesSampleRate = 1.0
                options.setBeforeSend { event, hint ->
                    // Filter out debug events if needed
                    if (event.tags?.containsKey("debug") == true) {
                        return@setBeforeSend null
                    }
                    event
                }
            }
            
            Log.d(TAG, "Sentry initialized for debug")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Sentry: ${e.message}")
        }
    }
    
    private fun initializeWorkManager() {
        // WorkManager is automatically initialized
        Log.d(TAG, "WorkManager configuration set for debug")
    }
    
    override fun getWorkManagerConfiguration(): Configuration {
        return Configuration.Builder()
            .setMinimumLoggingLevel(Log.DEBUG)
            .setJobSchedulerJobIdRange(1000, 2000)
            .setMaxSchedulerLimit(20)
            .build()
    }
    
    fun getDebugPreferences(): android.content.SharedPreferences {
        return getSharedPreferences("debug_prefs", Context.MODE_PRIVATE)
    }
    
    fun logDebugEvent(event: String, data: Map<String, Any> = emptyMap()) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Debug Event: $event - Data: $data")
            
            // Store in debug preferences for later analysis
            val prefs = getDebugPreferences()
            val events = prefs.getStringSet("debug_events", mutableSetOf()) ?: mutableSetOf()
            events.add("${System.currentTimeMillis()}: $event")
            prefs.edit().putStringSet("debug_events", events).apply()
        }
    }
    
    fun clearDebugData() {
        if (BuildConfig.DEBUG) {
            val prefs = getDebugPreferences()
            prefs.edit().clear().apply()
            Log.d(TAG, "Debug data cleared")
        }
    }
    
    fun getDebugInfo(): Map<String, Any> {
        return mapOf(
            "version" to BuildConfig.VERSION_NAME,
            "buildType" to BuildConfig.BUILD_TYPE,
            "debug" to BuildConfig.DEBUG,
            "applicationId" to BuildConfig.APPLICATION_ID,
            "buildTime" to BuildConfig.BUILD_TIME,
            "gitHash" to BuildConfig.GIT_HASH
        )
    }
    
    override fun onTerminate() {
        super.onTerminate()
        Log.d(TAG, "DebugApplication terminated")
        instance = null
    }
}