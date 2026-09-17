import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';

class OsmPickerScreen extends StatefulWidget {
  final LatLng initialLocation;

  const OsmPickerScreen({
    super.key,
    this.initialLocation = const LatLng(28.6139, 77.2090),
  });

  @override
  State<OsmPickerScreen> createState() => _OsmPickerScreenState();
}

class _OsmPickerScreenState extends State<OsmPickerScreen> {
  late LatLng _selectedPosition;
  late final MapController _mapController;
  bool _isLocating = false;
  bool _isGeocoding = false;
  String _resolvedAddress = 'Resolving address...';

  // Search
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _selectedPosition = widget.initialLocation;
    _mapController = MapController();
    _reverseGeocode(_selectedPosition);
    _fetchLiveLocation();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  Future<void> _reverseGeocode(LatLng pos) async {
    setState(() => _isGeocoding = true);

    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.latitude}&lon=${pos.longitude}&zoom=18&addressdetails=1',
      );
      final response = await http.get(uri, headers: {'User-Agent': 'CivicFixApp/2.0'});

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted && data is Map && data.containsKey('display_name')) {
          setState(() => _resolvedAddress = data['display_name'].toString());
          return;
        }
      }
      if (mounted) {
        setState(() {
          _resolvedAddress = 'Lat: ${pos.latitude.toStringAsFixed(5)}, Lng: ${pos.longitude.toStringAsFixed(5)}';
        });
      }
    } catch (e) {
      debugPrint("Reverse geocode error: $e");
      if (mounted) {
        setState(() {
          _resolvedAddress = 'Lat: ${pos.latitude.toStringAsFixed(5)}, Lng: ${pos.longitude.toStringAsFixed(5)}';
        });
      }
    } finally {
      if (mounted) setState(() => _isGeocoding = false);
    }
  }

  Future<void> _searchPlace(String query) async {
    if (query.trim().length < 3) {
      setState(() => _searchResults = []);
      return;
    }

    setState(() => _isSearching = true);
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query.trim())}&limit=5&countrycodes=in',
      );
      final response = await http.get(uri, headers: {'User-Agent': 'CivicFixApp/2.0'});
      if (response.statusCode == 200 && mounted) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _searchResults = data.map((e) => e as Map<String, dynamic>).toList();
        });
      }
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _onSearchChanged(String query) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      _searchPlace(query);
    });
  }

  void _selectSearchResult(Map<String, dynamic> result) {
    final lat = double.tryParse(result['lat']?.toString() ?? '') ?? 0;
    final lon = double.tryParse(result['lon']?.toString() ?? '') ?? 0;
    final pos = LatLng(lat, lon);

    setState(() {
      _selectedPosition = pos;
      _resolvedAddress = result['display_name']?.toString() ?? '';
      _searchResults = [];
      _searchController.clear();
    });
    _mapController.move(pos, 16.0);
    FocusScope.of(context).unfocus();
  }

  Future<void> _fetchLiveLocation() async {
    setState(() => _isLocating = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        );
        final currentLatLng = LatLng(pos.latitude, pos.longitude);
        if (mounted) {
          setState(() => _selectedPosition = currentLatLng);
          _mapController.move(currentLatLng, 16.0);
          _reverseGeocode(currentLatLng);
        }
      }
    } catch (e) {
      debugPrint("Location error: $e");
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pin on OpenStreetMap', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: theme.colorScheme.primary,
              textStyle: const TextStyle(fontWeight: FontWeight.bold),
            ),
            icon: const Icon(Icons.check_circle, size: 20),
            label: const Text('Confirm'),
            onPressed: () {
              Navigator.pop(context, _selectedPosition);
            },
          )
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedPosition,
              initialZoom: 15.0,
              onTap: (tapPosition, point) {
                setState(() {
                  _selectedPosition = point;
                  _searchResults = [];
                });
                _reverseGeocode(point);
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.civicpulse.app',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _selectedPosition,
                    width: 50,
                    height: 50,
                    child: const Icon(Icons.location_on, color: Colors.red, size: 50),
                  ),
                ],
              ),
            ],
          ),

          // Search Bar + Results Overlay
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Column(
              children: [
                // Search Input
                Card(
                  elevation: 4,
                  color: isDark
                      ? theme.colorScheme.surface.withValues(alpha: 0.95)
                      : Colors.white.withValues(alpha: 0.97),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      hintText: 'Search area or landmark (खोजें)...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchResults = []);
                              },
                            )
                          : (_isSearching
                              ? const Padding(
                                  padding: EdgeInsets.all(12.0),
                                  child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                                )
                              : null),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                ),

                // Search Results Dropdown
                if (_searchResults.isNotEmpty)
                  Card(
                    elevation: 6,
                    color: isDark ? theme.colorScheme.surface : Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 220),
                      child: ListView.separated(
                        shrinkWrap: true,
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        itemCount: _searchResults.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final result = _searchResults[index];
                          return ListTile(
                            dense: true,
                            leading: const Icon(Icons.place, color: Colors.red, size: 20),
                            title: Text(
                              result['display_name']?.toString() ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 13),
                            ),
                            onTap: () => _selectSearchResult(result),
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Address Resolution Card
          if (_searchResults.isEmpty)
            Positioned(
              top: 80,
              left: 12,
              right: 12,
              child: Card(
                elevation: 4,
                color: isDark
                    ? theme.colorScheme.surface.withValues(alpha: 0.92)
                    : Colors.white.withValues(alpha: 0.95),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
                  child: Row(
                    children: [
                      const Icon(Icons.place, color: Colors.red, size: 28),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Tap map to adjust pin location',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                                if (_isGeocoding) ...[
                                  const SizedBox(width: 6),
                                  const SizedBox(
                                    width: 10,
                                    height: 10,
                                    child: CircularProgressIndicator(strokeWidth: 1.5),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _resolvedAddress,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // GPS Recenter FAB
          Positioned(
            bottom: 24,
            right: 16,
            child: FloatingActionButton(
              heroTag: 'gps_recenter',
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
              onPressed: _isLocating ? null : _fetchLiveLocation,
              child: _isLocating
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: theme.colorScheme.onPrimary, strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }
}
