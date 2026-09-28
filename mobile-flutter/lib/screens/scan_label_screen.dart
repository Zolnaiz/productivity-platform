import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../utils/phase_one_strings.dart';

/// Which area a 5S label names, read from the link its QR code carries.
///
/// The web prints `<site>/zone/<plan>/<zone>` on every label, so a label
/// stuck to a wall a year ago still names its area. Anything else - a code
/// from another system, a label from another site's app - names nothing.
({String planId, String zoneId})? zoneFromLabel(String raw) {
  final uri = Uri.tryParse(raw.trim());
  if (uri == null) return null;
  final segments = uri.pathSegments;
  final at = segments.indexOf('zone');
  if (at < 0 || segments.length < at + 3) return null;
  final planId = segments[at + 1];
  final zoneId = segments[at + 2];
  if (planId.isEmpty || zoneId.isEmpty) return null;
  return (planId: planId, zoneId: zoneId);
}

/// The camera, pointed at a zone's label.
///
/// The label's code opened the web page in a browser, where the person had
/// to sign in again on a phone that already had the app. Scanned here, it
/// opens the area in the app, walk and red tags one tap away.
class ScanLabelScreen extends StatefulWidget {
  const ScanLabelScreen({super.key});

  @override
  State<ScanLabelScreen> createState() => _ScanLabelScreenState();
}

class _ScanLabelScreenState extends State<ScanLabelScreen> {
  bool _done = false;
  String? _notALabel;

  void _onDetect(BarcodeCapture capture) {
    if (_done) return;
    for (final code in capture.barcodes) {
      final raw = code.rawValue;
      if (raw == null) continue;
      final zone = zoneFromLabel(raw);
      if (zone != null) {
        _done = true;
        Navigator.of(context).pop(zone);
        return;
      }
      setState(() => _notALabel = raw);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('scanLabel'))),
      body: Stack(children: [
        MobileScanner(
          onDetect: _onDetect,
          errorBuilder: (context, error) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(strings.text('cameraUnavailable'), textAlign: TextAlign.center),
            ),
          ),
        ),
        Positioned(
          left: 16,
          right: 16,
          bottom: 32,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                _notALabel == null ? strings.text('scanHint') : strings.text('notALabel'),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
