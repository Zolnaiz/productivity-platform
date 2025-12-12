# Uncomment this line to define a global platform for your project
platform :ios, '12.0'

# CocoaPods analytics sends network stats synchronously affecting flutter build latency.
ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

def flutter_root
  generated_xcode_build_settings_path = File.expand_path(File.join('..', 'Flutter', 'Generated.xcconfig'), __FILE__)
  unless File.exist?(generated_xcode_build_settings_path)
    raise "#{generated_xcode_build_settings_path} must exist. If you're running pod install manually, make sure flutter pub get is executed first"
  end

  File.foreach(generated_xcode_build_settings_path) do |line|
    matches = line.match(/FLUTTER_ROOT\=(.*)/)
    return matches[1].strip if matches
  end
  raise "FLUTTER_ROOT not found in #{generated_xcode_build_settings_path}. Try deleting Generated.xcconfig, then run flutter pub get"
end

require File.expand_path(File.join('packages', 'flutter_tools', 'bin', 'podhelper'), flutter_root)

flutter_ios_podfile_setup

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
  
  # Firebase pods
  pod 'Firebase/Core'
  pod 'Firebase/Analytics'
  pod 'Firebase/Crashlytics'
  pod 'Firebase/Messaging'
  pod 'Firebase/Auth'
  
  # Other useful pods
  pod 'GoogleSignIn', '~> 5.0'
  pod 'FBSDKLoginKit', '~> 9.0'
  
  # Image loading and caching
  pod 'SDWebImage', '~> 5.0'
  
  # Networking
  pod 'Alamofire', '~> 5.0'
  
  # Keychain access
  pod 'KeychainAccess', '~> 4.0'
  
  # Local notifications
  pod 'UserNotifications', '~> 3.0'
  
  # Background tasks
  pod 'BackgroundTasks', '~> 2.0'
  
  # Add any other pods you might need
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    
    # Fix for iOS 12+ architectures
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
      config.build_settings['ENABLE_BITCODE'] = 'NO'
      
      # Swift version
      config.build_settings['SWIFT_VERSION'] = '5.0'
      
      # Enable modular headers for all pods
      config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
      config.build_settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'YES'
    end
  end
  
  # Workaround for Cocoapods issue with Flutter
  installer.pods_project.build_configurations.each do |config|
    config.build_settings.delete 'ARCHS'
    config.build_settings['VALID_ARCHS'] = 'arm64 arm64e armv7 armv7s x86_64'
  end
end