# Flutter mobile app

What it does today, against the real API: sign in (with token refresh), **My
tasks** — the work assigned to the signed-in person, whose status they can
move — and **Today**, where they write up the day's work with the hours it
took. The write-up is saved with its clock entry through `POST
/work-logs/daily`, so the monthly report counts the hours once. **Inbox**
shows what the person has been told: work given to them and the morning
reminders. Every screen reads in Mongolian and English, and there is nothing
else in the app - the earlier expense, questionnaire, report and profile
screens were built on sample data, never spoke to the server, and have been
removed.

## Point the app at an API server

The API base URL includes the `/api` prefix. You can set it at build or run time
with `--dart-define`:

```sh
flutter run --flavor dev --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

On the Android emulator, `10.0.2.2` reaches the host computer. For an iOS
simulator or a physical device, use a host name or LAN IP reachable from that
device, for example `http://192.168.1.20:3000/api`. The default is
`http://10.0.2.2:3000/api`.

You can also copy `.env.example` to `.env` and change `API_BASE_URL`; `.env` is
ignored by git. `--dart-define` takes precedence over `.env`.

## Build for Android

The app has three flavors - `dev`, `staging`, `production` - so every Android
build names one; without it Flutter builds all three and then cannot find the
APK it expected:

```sh
flutter run --flavor dev --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

The Android toolchain is Gradle 9.3.1 with Android Gradle Plugin 9.1, which
compiles the app's Kotlin itself (built-in Kotlin, at version 2.3.20) -
Flutter's own current template versions - because the current Android Studio
ships Java 25, which older Gradle cannot run on. Flutter reports no
toolchain warnings with it.
The SDK needs platform 36, Build-Tools 36.1.0 and NDK 28.2.13676358; Android
Studio's SDK Manager installs them.

## Build a release

```sh
flutter build apk --release --flavor production --dart-define=API_BASE_URL=https://your-server/api
```

The APK is in `build/app/outputs/flutter-apk/app-production-release.apk`. To
sign it with the organization's own key rather than the debug key, create
`android/key.properties` (git ignores it, and the keystore):

```properties
storeFile=C:/path/to/release.jks
storePassword=...
keyAlias=release
keyPassword=...
```

Without it the build warns and signs with the debug key, which installs for
testing but cannot be published or updated from. Keep the keystore and its
passwords somewhere backed up: an app signed with a lost key cannot be
updated in place.

The release build shrinks the code, and was checked to install and open on
an Android 35 emulator; the first attempt crashed on launch, because a
WorkManager dependency nothing used lost a class to shrinking.

## Run the Phase 1 backend integration test

Start the backend and seed its database using the commands in the repository
root brief. Then run the integration test on an Android emulator (or another
device that can reach the server):

```sh
cd mobile-flutter
flutter test integration_test/phase_one_backend_test.dart -d emulator-5554 --flavor dev \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

It uses the seeded `owner@example.com` / `Password123` credentials by default.
Set `MOBILE_TEST_EMAIL` and `MOBILE_TEST_PASSWORD` with `--dart-define` to use
another test account. The test signs in through the API and requests `/tasks`.

For a host-side live API check without an emulator, run real HTTP sign-in,
refresh, and task-list assertions from the test runner:

```sh
flutter test test/phase_one_live_backend_test.dart \\
  --dart-define=API_BASE_URL=http://localhost:3000/api
```

## Check the Flutter client

```sh
flutter analyze
flutter test
```
