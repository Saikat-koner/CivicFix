import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// Web-Safe Geocoded Address Model
class GeocodedAddress {
  final double latitude;
  final double longitude;
  final String formattedAddress;
  final String? road;
  final String? suburb;
  final String? city;
  final String? state;
  final String? postalCode;

  const GeocodedAddress({
    required this.latitude,
    required this.longitude,
    required this.formattedAddress,
    this.road,
    this.suburb,
    this.city,
    this.state,
    this.postalCode,
  });

  factory GeocodedAddress.fromNominatimJson(Map<String, dynamic> json, double lat, double lon) {
    final displayName = json['display_name'] as String? ?? 'Lat: ${lat.toStringAsFixed(5)}, Lng: ${lon.toStringAsFixed(5)}';
    final addressMap = json['address'] as Map<String, dynamic>?;

    final road = addressMap?['road'] as String?;
    final suburb = addressMap?['suburb'] as String? ?? addressMap?['neighbourhood'] as String?;
    final city = addressMap?['city'] as String? ?? addressMap?['town'] as String? ?? addressMap?['village'] as String?;
    final state = addressMap?['state'] as String?;
    final postalCode = addressMap?['postcode'] as String?;

    final parts = <String>[];
    if (road != null && road.isNotEmpty) parts.add(road);
    if (suburb != null && suburb.isNotEmpty) parts.add(suburb);
    if (city != null && city.isNotEmpty) parts.add(city);
    if (state != null && state.isNotEmpty) parts.add(state);
    if (postalCode != null && postalCode.isNotEmpty) parts.add(postalCode);

    final cleanAddress = parts.isNotEmpty ? parts.join(', ') : displayName;

    return GeocodedAddress(
      latitude: lat,
      longitude: lon,
      formattedAddress: cleanAddress,
      road: road,
      suburb: suburb,
      city: city,
      state: state,
      postalCode: postalCode,
    );
  }
}

/// 100% Web-Safe Resilient OpenStreetMap Nominatim Geocoding Service
/// Features 500ms debounce timer to prevent HTTP 429 rate limits, and safe coordinate fallback.
class NominatimGeocodingService {
  static const String _reverseUrl = 'https://nominatim.openstreetmap.org/reverse';
  static const String _searchUrl = 'https://nominatim.openstreetmap.org/search';

  static Timer? _debounceTimer;

  static const Map<String, String> _headers = {
    'User-Agent': 'CivicFix-GovPortal/2.0 (civic-grievance-resolution@civicfix.gov.in)',
    'Accept': 'application/json',
  };

  /// Debounced reverse geocoding (500ms delay) to prevent HTTP 429 rate limits during pin dragging
  static void debouncedReverseGeocode({
    required double latitude,
    required double longitude,
    required void Function(GeocodedAddress) onResult,
    Duration delay = const Duration(milliseconds: 500),
  }) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(delay, () async {
      final res = await reverseGeocode(latitude: latitude, longitude: longitude);
      onResult(res);
    });
  }

  /// Instant reverse geocode of coordinates into human-readable municipal address
  /// Falls back gracefully to: "Lat: {lat.toStringAsFixed(5)}, Lng: {lng.toStringAsFixed(5)}"
  static Future<GeocodedAddress> reverseGeocode({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final uri = Uri.parse(
        '$_reverseUrl?format=json&lat=$latitude&lon=$longitude&zoom=18&addressdetails=1',
      );

      final response = await http.get(uri, headers: _headers).timeout(
        const Duration(seconds: 5),
      );

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body) as Map<String, dynamic>;
        return GeocodedAddress.fromNominatimJson(decoded, latitude, longitude);
      }
    } catch (_) {
      // Graceful statutory coordinate fallback
    }

    return GeocodedAddress(
      latitude: latitude,
      longitude: longitude,
      formattedAddress: 'Lat: ${latitude.toStringAsFixed(5)}, Lng: ${longitude.toStringAsFixed(5)}',
    );
  }

  /// Forward search locations / addresses
  static Future<List<GeocodedAddress>> searchLocations(String query) => searchAddress(query);

  static Future<List<GeocodedAddress>> searchAddress(String query) async {
    if (query.trim().isEmpty) return [];

    try {
      final uri = Uri.parse(
        '$_searchUrl?format=json&q=${Uri.encodeComponent(query)}&limit=5&addressdetails=1',
      );

      final response = await http.get(uri, headers: _headers).timeout(
        const Duration(seconds: 5),
      );

      if (response.statusCode == 200) {
        final list = json.decode(response.body) as List<dynamic>;
        return list.map((item) {
          final lat = double.tryParse(item['lat']?.toString() ?? '') ?? 0.0;
          final lon = double.tryParse(item['lon']?.toString() ?? '') ?? 0.0;
          return GeocodedAddress.fromNominatimJson(item as Map<String, dynamic>, lat, lon);
        }).toList();
      }
    } catch (_) {
      // Return empty list on network or parse error
    }

    return [];
  }
}
