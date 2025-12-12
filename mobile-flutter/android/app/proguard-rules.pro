# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Material Design
-keep class android.support.design.** { *; }
-keep interface android.support.design.** { *; }
-keep public class android.support.v7.widget.** { *; }
-keep public class android.support.v4.widget.** { *; }

# Square
-keep class com.squareup.** { *; }
-dontwarn com.squareup.**

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Retrofit
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# GSON
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.stream.** { *; }

# Jackson
-keep class com.fasterxml.jackson.** { *; }

# Support library
-keep public class * extends android.support.v4.app.Fragment
-keep public class * extends android.app.Fragment
-keep public class * extends android.support.v4.app.DialogFragment
-keep public class * extends android.app.DialogFragment

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Signature

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom view classes
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
    public void set*(...);
}

# Keep parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep R classes
-keep class **.R$* {
    <fields>;
}

# Keep application class
-keep public class * extends android.app.Application

# Keep activity classes
-keep public class * extends android.app.Activity

# Keep service classes
-keep public class * extends android.app.Service

# Keep broadcast receiver classes
-keep public class * extends android.content.BroadcastReceiver

# Keep content provider classes
-keep public class * extends android.content.ContentProvider