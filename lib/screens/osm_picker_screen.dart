import 'dart:async';
import 'package:flutter/material.dart';
import '../services/geocoding_service.dart';

class PickedLocation {
  final double latitude;
  final double longitude;
  final String address;

  const PickedLocation({
    required this.latitude,
    required this.longitude,
    required this.address,
  });
}

class OsmPickerScreen extends StatefulWidget {
  final double initialLat;
  final double initialLng;

  const OsmPickerScreen({
    super.key,
    this.initialLat = 12.9716,
    this.initialLng = 77.5946,
  });

  @override
  State<OsmPickerScreen> createState() => _OsmPickerScreenState();
}

class _OsmPickerScreenState extends State<OsmPickerScreen> {
  late double _currentLat;
  late double _currentLng;
  final TextEditingController _searchController = TextEditingController();

  bool _isGeocoding = false;
  String _resolvedAddress = 'Resolving ward address...';
  List<GeocodedAddress> _searchResults = [];
  Timer? _debounceTimer;

  final List<Map<String, dynamic>> _quickLocations = [
    {
      'name': 'City Hall / Mahanagara Palike HQ',
      'sub': 'Central Control Room & Ombudsman',
      'lat': 12.9667,
      'lng': 77.5873,
    },
    {
      'name': 'Indiranagar 100 Feet Road',
      'sub': 'Ward 112 Commercial Corridor',
      'lat': 12.9716,
      'lng': 77.6412,
    },
    {
      'name': 'MG Road Metro Interchange',
      'sub': 'Central Pedestrian Spine',
      'lat': 12.9756,
      'lng': 77.6067,
    },
    {
      'name': 'Whitefield Tech Park Gate',
      'sub': 'Outer Ring Transit Zone',
      'lat': 12.9860,
      'lng': 77.7300,
    },
  ];

  @override
  void initState() {
    super.initState();
    _currentLat = widget.initialLat;
    _currentLng = widget.initialLng;
    _performReverseGeocode();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performReverseGeocode() async {
    if (!mounted) return;
    setState(() {
      _isGeocoding = true;
      _resolvedAddress = 'Resolving ward address...';
    });

    try {
      final res = await NominatimGeocodingService.reverseGeocode(
        latitude: _currentLat,
        longitude: _currentLng,
      );

      if (mounted) {
        setState(() {
          _resolvedAddress = res.formattedAddress;
          _isGeocoding = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _resolvedAddress =
              'Coordinates: ${_currentLat.toStringAsFixed(5)}, ${_currentLng.toStringAsFixed(5)} (Ward Area)';
          _isGeocoding = false;
        });
      }
    }
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _searchResults = []);
      return;
    }

    setState(() => _isGeocoding = true);
    final results = await NominatimGeocodingService.searchLocations(query);
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isGeocoding = false;
      });
    }
  }

  void _updateCoordinates(double newLat, double newLng) {
    setState(() {
      _currentLat = newLat;
      _currentLng = newLng;
      _isGeocoding = true;
      _resolvedAddress = 'Resolving ward address...';
      _searchResults = [];
    });

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performReverseGeocode();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'OpenStreetMap Location Picker',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 15,
                color: Color(0xFF0F172A),
              ),
            ),
            Text(
              'Instant Nominatim Reverse Geocoding',
              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // 1. Nominatim Forward Search Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              onSubmitted: _performSearch,
              decoration: InputDecoration(
                hintText: 'Search landmark, street, ward or pin code...',
                hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF0050C8)),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.arrow_forward_rounded, size: 20, color: Color(0xFF0050C8)),
                  onPressed: () => _performSearch(_searchController.text),
                ),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Search Results Dropdown
          if (_searchResults.isNotEmpty)
            Container(
              color: Colors.white,
              constraints: const BoxConstraints(maxHeight: 200),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _searchResults.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, idx) {
                  final item = _searchResults[idx];
                  return ListTile(
                    leading: const Icon(Icons.location_on_rounded, color: Color(0xFF0050C8), size: 20),
                    title: Text(item.formattedAddress, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    subtitle: Text('${item.latitude.toStringAsFixed(4)}, ${item.longitude.toStringAsFixed(4)}', style: const TextStyle(fontSize: 10)),
                    onTap: () {
                      _searchController.text = item.formattedAddress;
                      _updateCoordinates(item.latitude, item.longitude);
                    },
                  );
                },
              ),
            ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Simulated OSM Viewport with Active Pin
                  _buildOsmViewportCard(context),

                  const SizedBox(height: 16),

                  // Resolved Nominatim Address Card
                  _buildResolvedAddressCard(context),

                  const SizedBox(height: 16),

                  // Precision Coordinate Nudge Controls
                  _buildCoordinateNudgeControls(context),

                  const SizedBox(height: 16),

                  // Quick Ward Presets
                  _buildQuickPresetsSection(context),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomConfirmBar(context),
    );
  }

  Widget _buildOsmViewportCard(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFCBD5E1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background stylized grid representing OpenStreetMap tiles
          Positioned.fill(
            child: CustomPaint(
              painter: _OsmGridPainter(),
            ),
          ),
          // Center Marker
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFDC2626).withValues(alpha: 0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.location_pin, color: Colors.white, size: 28),
              ),
              Container(
                width: 12,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
          // OpenStreetMap Attribution badge (legal requirement)
          Positioned(
            bottom: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Text(
                '© OpenStreetMap contributors • Nominatim',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResolvedAddressCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF0050C8).withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0050C8).withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0050C8).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.pin_drop_rounded, color: Color(0xFF0050C8), size: 18),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Reverse Geocoded Address',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              if (_isGeocoding)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0050C8).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0050C8)),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Resolving...',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0050C8)),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'RESOLVED',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          _isGeocoding
              ? Container(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.sync_rounded, size: 16, color: Color(0xFF0050C8)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _resolvedAddress,
                          style: const TextStyle(
                            fontSize: 13,
                            fontStyle: FontStyle.italic,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0050C8),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : Text(
                  _resolvedAddress,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                    height: 1.4,
                  ),
                ),
          const SizedBox(height: 6),
          Text(
            'GPS Coordinates: ${_currentLat.toStringAsFixed(6)} N, ${_currentLng.toStringAsFixed(6)} E',
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 11,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoordinateNudgeControls(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Precision Pin Adjustments',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildNudgeButton('▲ North', () => _updateCoordinates(_currentLat + 0.001, _currentLng)),
              const SizedBox(width: 8),
              _buildNudgeButton('▼ South', () => _updateCoordinates(_currentLat - 0.001, _currentLng)),
              const SizedBox(width: 8),
              _buildNudgeButton('◄ West', () => _updateCoordinates(_currentLat, _currentLng - 0.001)),
              const SizedBox(width: 8),
              _buildNudgeButton('► East', () => _updateCoordinates(_currentLat, _currentLng + 0.001)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNudgeButton(String label, VoidCallback onPressed) {
    return Expanded(
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          side: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF334155)),
        ),
      ),
    );
  }

  Widget _buildQuickPresetsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Municipal Landmarks',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 8),
        ..._quickLocations.map((loc) {
          final isCurrent = (_currentLat - (loc['lat'] as double)).abs() < 0.0001 &&
              (_currentLng - (loc['lng'] as double)).abs() < 0.0001;

          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isCurrent ? const Color(0xFF0050C8) : const Color(0xFFE2E8F0),
                width: isCurrent ? 1.5 : 1,
              ),
            ),
            child: ListTile(
              leading: Icon(
                Icons.account_balance_rounded,
                color: isCurrent ? const Color(0xFF0050C8) : const Color(0xFF64748B),
                size: 20,
              ),
              title: Text(loc['name'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              subtitle: Text(loc['sub'] as String, style: const TextStyle(fontSize: 10)),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF94A3B8)),
              onTap: () => _updateCoordinates(loc['lat'] as double, loc['lng'] as double),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildBottomConfirmBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0050C8),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: () {
          Navigator.pop(
            context,
            PickedLocation(
              latitude: _currentLat,
              longitude: _currentLng,
              address: _resolvedAddress,
            ),
          );
        },
        child: const Text(
          'Confirm Pin Location & Address',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        ),
      ),
    );
  }
}

/// Custom painter for stylized OpenStreetMap grid simulation
class _OsmGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFCBD5E1).withValues(alpha: 0.6)
      ..strokeWidth = 1.0;

    const step = 24.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw stylized road vectors
    final roadPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = 6.0;

    canvas.drawLine(
      Offset(0, size.height * 0.4),
      Offset(size.width, size.height * 0.45),
      roadPaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.35, 0),
      Offset(size.width * 0.45, size.height),
      roadPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
