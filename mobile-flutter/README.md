# Flutter mobile app

## Point the app at an API server

The API base URL includes the `/api` prefix. You can set it at build or run time
with `--dart-define`:

```sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

On the Android emulator, `10.0.2.2` reaches the host computer. For an iOS
simulator or a physical device, use a host name or LAN IP reachable from that
device, for example `http://192.168.1.20:3000/api`. The default is
`http://10.0.2.2:3000/api`.

You can also copy `.env.example` to `.env` and change `API_BASE_URL`; `.env` is
ignored by git. `--dart-define` takes precedence over `.env`.

## Run the Phase 1 backend integration test

Start the backend and seed its database using the commands in the repository
root brief. Then run the integration test on an Android emulator (or another
device that can reach the server):

```sh
cd mobile-flutter
flutter test integration_test/phase_one_backend_test.dart -d emulator-5554 \
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
