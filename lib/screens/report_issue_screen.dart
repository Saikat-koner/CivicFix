import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart' as latlong;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/severity_engine.dart';
import 'osm_picker_screen.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  String _selectedCategory = 'pothole';
  Uint8List? _imageBytes;
  Position? _currentPosition;
  String _resolvedAddress = '';
  bool _isLoading = false;
  int _urgencyLevel = 3; // 1 = Low, 5 = Critical
  int _affectedPeople = 10; // estimated affected people count

  final List<Map<String, dynamic>> _allCategories = [
    {'slug': 'pothole', 'name_en': 'Pothole / Road Defect', 'name_hi': 'सड़क का गड्ढा', 'icon': Icons.warning_amber_rounded, 'color': const Color(0xFFE65100)},
    {'slug': 'street_light', 'name_en': 'Streetlight Broken', 'name_hi': 'स्ट्रीट लाइट बंद', 'icon': Icons.lightbulb, 'color': const Color(0xFFF57F17)},
    {'slug': 'garbage_dump', 'name_en': 'Garbage Overflow', 'name_hi': 'कचरा पड़ा है', 'icon': Icons.delete_forever, 'color': const Color(0xFF2E7D32)},
    {'slug': 'water_leakage', 'name_en': 'Water Pipe Leakage', 'name_hi': 'पानी पाइप लीकेज', 'icon': Icons.water_drop, 'color': const Color(0xFF0277BD)},
    {'slug': 'manhole_open', 'name_en': 'Open Manhole', 'name_hi': 'खुला मैनहोल', 'icon': Icons.dangerous, 'color': const Color(0xFFC62828)},
    {'slug': 'drainage_blocked', 'name_en': 'Blocked Drainage / Sewer', 'name_hi': 'नाली जाम', 'icon': Icons.water_damage, 'color': const Color(0xFF455A64)},
    {'slug': 'broken_sidewalk', 'name_en': 'Broken Footpath / Pavement', 'name_hi': 'फुटपाथ टूटा हुआ', 'icon': Icons.directions_walk, 'color': const Color(0xFF6D4C41)},
    {'slug': 'traffic_signal_broken', 'name_en': 'Traffic Light Failure', 'name_hi': 'ट्रैफिक लाइट खराब', 'icon': Icons.traffic, 'color': const Color(0xFFD84315)},
    {'slug': 'stray_animals', 'name_en': 'Stray Animals Hazard', 'name_hi': 'आवारा पशु', 'icon': Icons.pets, 'color': const Color(0xFF8D6E63)},
    {'slug': 'illegal_construction', 'name_en': 'Illegal Encroachment', 'name_hi': 'अवैध कब्जा / निर्माण', 'icon': Icons.fence, 'color': const Color(0xFF5D4037)},
    {'slug': 'tree_fallen', 'name_en': 'Fallen Tree / Branch', 'name_hi': 'गिरा हुआ पेड़ / शाखा', 'icon': Icons.park, 'color': const Color(0xFF388E3C)},
    {'slug': 'public_toilet_broken', 'name_en': 'Damaged Public Toilet', 'name_hi': 'सार्वजनिक शौचालय खराब', 'icon': Icons.wc, 'color': const Color(0xFF00897B)},
    {'slug': 'road_sign_missing', 'name_en': 'Missing Road Sign', 'name_hi': 'रोड साइन बोर्ड गायब', 'icon': Icons.signpost, 'color': const Color(0xFF1565C0)},
    {'slug': 'illegal_parking', 'name_en': 'Illegal Parking Obstruction', 'name_hi': 'अवैध पार्किंग', 'icon': Icons.no_transfer, 'color': const Color(0xFF6A1B9A)},
  ];

  @override
  void initState() {
    super.initState();
    _determineInitialGPS();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _determineInitialGPS() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition();
        if (mounted) {
          setState(() {
            _currentPosition = pos;
            if (_titleController.text.isEmpty) {
              _titleController.text = _getDefaultTitleForCategory(_selectedCategory);
            }
          });
          _reverseGeocode(pos.latitude, pos.longitude);
        }
      }
    } catch (e) {
      debugPrint("GPS Error: $e");
    }
  }

  Future<void> _reverseGeocode(double lat, double lng) async {
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1',
      );
      final response = await http.get(uri, headers: {'User-Agent': 'CivicFixApp/2.0'});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted && data is Map && data.containsKey('display_name')) {
          setState(() => _resolvedAddress = data['display_name'].toString());
          return;
        }
      }
    } catch (e) {
      debugPrint('Reverse geocode error: $e');
    }
    if (mounted) {
      setState(() {
        _resolvedAddress = 'Lat: ${lat.toStringAsFixed(5)}, Lng: ${lng.toStringAsFixed(5)}';
      });
    }
  }

  String _getDefaultTitleForCategory(String category) {
    final match = _allCategories.firstWhere(
      (c) => c['slug'] == category,
      orElse: () => {'name_en': 'Civic Defect', 'name_hi': 'नागरिक समस्या'},
    );
    return '${match['name_en']} (${match['name_hi']})';
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source, imageQuality: 70);

    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      if (mounted) {
        setState(() {
          _imageBytes = bytes;
        });
      }
    }
  }

  void _showAllCategoriesModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Center(
                child: SizedBox(
                  width: 40,
                  height: 4,
                  child: DecoratedBox(decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.all(Radius.circular(2)))),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Select Civic Problem Category (समस्या का प्रकार चुनें)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: _allCategories.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final cat = _allCategories[index];
                    final isSelected = _selectedCategory == cat['slug'];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: (cat['color'] as Color).withValues(alpha: 0.15),
                        child: Icon(cat['icon'] as IconData, color: cat['color'] as Color),
                      ),
                      title: Text(cat['name_en'] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(cat['name_hi'] as String),
                      trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.green) : null,
                      onTap: () {
                        setState(() {
                          _selectedCategory = cat['slug'] as String;
                          _titleController.text = _getDefaultTitleForCategory(_selectedCategory);
                        });
                        Navigator.pop(ctx);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _urgencyLabel(int level) {
    switch (level) {
      case 1:
        return 'Low (कम)';
      case 2:
        return 'Minor (सामान्य)';
      case 3:
        return 'Moderate (मध्यम)';
      case 4:
        return 'High (उच्च)';
      case 5:
        return 'Critical (गंभीर)';
      default:
        return 'Moderate';
    }
  }

  Color _urgencyColor(int level) {
    switch (level) {
      case 1:
        return Colors.teal;
      case 2:
        return Colors.blue;
      case 3:
        return Colors.amber.shade800;
      case 4:
        return Colors.deepOrange;
      case 5:
        return Colors.red.shade700;
      default:
        return Colors.amber.shade800;
    }
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;

    if (_imageBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.red,
          content: Text('⚠️ Please take a photo first! (कृपया पहले फोटो खींचे)'),
        ),
      );
      return;
    }

    if (_currentPosition == null) {
      await _determineInitialGPS();
      _currentPosition ??= Position(
        latitude: 28.6139,
        longitude: 77.2090,
        timestamp: DateTime.now(),
        accuracy: 1.0,
        altitude: 0.0,
        altitudeAccuracy: 0.0,
        heading: 0.0,
        headingAccuracy: 0.0,
        speed: 0.0,
        speedAccuracy: 0.0,
      );
    }

    setState(() => _isLoading = true);

    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser!.id;
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$userId.jpg';

      // Web-safe: upload raw bytes instead of dart:io File
      await supabase.storage.from('issue_images').uploadBinary(fileName, _imageBytes!);
      final imageUrl = supabase.storage.from('issue_images').getPublicUrl(fileName);

      final title = _titleController.text.trim().isEmpty
          ? _getDefaultTitleForCategory(_selectedCategory)
          : _titleController.text.trim();

      final desc = _descController.text.trim().isEmpty
          ? 'Reported via 1-Click CivicFix Camera'
          : _descController.text.trim();

      // Use reverse-geocoded address when available, fallback to coordinates
      final address = _resolvedAddress.isNotEmpty
          ? _resolvedAddress
          : 'Lat: ${_currentPosition!.latitude.toStringAsFixed(4)}, Lng: ${_currentPosition!.longitude.toStringAsFixed(4)}';

      final calculatedScore = SeverityEngine.calculateSeverityScore(
        category: _selectedCategory,
        urgencyLevel: _urgencyLevel,
        affectedPeople: _affectedPeople,
        upvotes: 0,
        createdAt: DateTime.now(),
      );
      final calculatedTier = SeverityEngine.getSeverityTier(calculatedScore);
      final slaHours = SeverityEngine.getSlaTargetHours(calculatedTier);

      Map<String, dynamic>? response;
      try {
        final rpcRes = await supabase.rpc('check_and_create_issue', params: {
          'p_reporter_id': userId,
          'p_category': _selectedCategory,
          'p_title': title,
          'p_description': desc,
          'p_image_url': imageUrl,
          'p_longitude': _currentPosition!.longitude,
          'p_latitude': _currentPosition!.latitude,
          'p_address': address,
          'p_severity_score': calculatedScore,
          'p_severity_tier': calculatedTier,
        });
        response = rpcRes is Map<String, dynamic> ? rpcRes : null;
      } catch (_) {
        // Direct insert fallback if RPC isn't available
        await supabase.from('issues').insert({
          'reporter_id': userId,
          'category': _selectedCategory,
          'title': title,
          'description': desc,
          'image_url': imageUrl,
          'latitude': _currentPosition!.latitude,
          'longitude': _currentPosition!.longitude,
          'address': address,
          'status': 'reported',
          'urgency_level': _urgencyLevel,
          'affected_people': _affectedPeople,
          'severity_score': calculatedScore,
          'severity_level': calculatedTier,
          'severity_tier': calculatedTier,
          'sla_target_hours': slaHours,
          'has_ground_survey': false,
          'ground_hazard_modifier': 0.0,
          'created_at': DateTime.now().toIso8601String(),
        });
      }

      if (!mounted) return;

      final isMerged = response?['status'] == 'merged';
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(isMerged ? Icons.merge_type : Icons.check_circle, color: Colors.green, size: 28),
              const SizedBox(width: 8),
              Text(isMerged ? 'Merged / दर्ज हुआ' : 'Reported / सफल!'),
            ],
          ),
          content: Text(
            isMerged
                ? 'Similar issue was already reported nearby. Your report has upvoted the priority! (+15 XP awarded)'
                : 'Your report has been submitted to the municipal field team! (+15 XP awarded)',
            style: const TextStyle(fontSize: 15),
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Theme.of(context).colorScheme.onPrimary,
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              child: const Text('OK / ठीक है'),
            )
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Hazard (समस्या बताएं)', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Uploading & Notifying Municipal Crew...', style: TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. PICTORIAL CATEGORY SELECTION + EXPAND BUTTON
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '1. Problem Type (समस्या चुनें)',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        TextButton.icon(
                          icon: const Icon(Icons.grid_view, size: 16),
                          label: const Text('All (सभी प्रकार)'),
                          onPressed: _showAllCategoriesModal,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _categoryBox('pothole', 'Pothole\n(गड्ढा)', Icons.warning_amber_rounded, const Color(0xFFE65100)),
                        const SizedBox(width: 8),
                        _categoryBox('street_light', 'Light\n(बत्ती)', Icons.lightbulb, const Color(0xFFF57F17)),
                        const SizedBox(width: 8),
                        _categoryBox('garbage_dump', 'Garbage\n(कचरा)', Icons.delete_forever, const Color(0xFF2E7D32)),
                        const SizedBox(width: 8),
                        _categoryBox('water_leakage', 'Water\n(पानी)', Icons.water_drop, const Color(0xFF0277BD)),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 2. GIANT PHOTO CAPTURE CAMERA CONTAINER
                    const Text(
                      '2. Take Photo (फोटो खींचे)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => _pickImage(ImageSource.camera),
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: isDark ? theme.colorScheme.primaryContainer.withValues(alpha: 0.2) : Colors.blue.shade50,
                          border: Border.all(
                            color: _imageBytes != null ? Colors.green : theme.colorScheme.primary,
                            width: 2.5,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: _imageBytes == null
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(Icons.camera_alt, size: 42, color: theme.colorScheme.onPrimary),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'TAP TO OPEN CAMERA\n(कैमरा चालू करने के लिए छुएं)',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  TextButton.icon(
                                    icon: const Icon(Icons.photo_library, size: 18),
                                    label: const Text('Or pick from gallery (गैलरी से चुनें)'),
                                    onPressed: () => _pickImage(ImageSource.gallery),
                                  )
                                ],
                              )
                            : ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: Stack(
                                  children: [
                                    // Web-safe: Image.memory instead of Image.file
                                    Image.memory(_imageBytes!, height: 200, width: double.infinity, fit: BoxFit.cover),
                                    Positioned(
                                      top: 10,
                                      right: 10,
                                      child: CircleAvatar(
                                        backgroundColor: Colors.black54,
                                        child: IconButton(
                                          icon: const Icon(Icons.refresh, color: Colors.white),
                                          onPressed: () => _pickImage(ImageSource.camera),
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 3. DETAILS / TITLE & NOTES
                    const Text(
                      '3. Details (विवरण)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        labelText: 'Issue Title (समस्या का नाम)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Please provide a title (कृपया समस्या का नाम लिखें)';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Optional Notes / Landmark (विवरण / पहचान)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 4. URGENCY LEVEL SELECTOR
                    const Text(
                      '4. Urgency Level (तात्कालिकता)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: _urgencyColor(_urgencyLevel).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _urgencyColor(_urgencyLevel).withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _urgencyLabel(_urgencyLevel),
                                style: TextStyle(fontWeight: FontWeight.bold, color: _urgencyColor(_urgencyLevel)),
                              ),
                              Text(
                                'Level $_urgencyLevel/5',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                          Slider(
                            value: _urgencyLevel.toDouble(),
                            min: 1,
                            max: 5,
                            divisions: 4,
                            activeColor: _urgencyColor(_urgencyLevel),
                            label: _urgencyLabel(_urgencyLevel),
                            onChanged: (val) => setState(() => _urgencyLevel = val.round()),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 5. AFFECTED PEOPLE ESTIMATE
                    const Text(
                      '5. People Affected (प्रभावित लोग)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isDark ? theme.colorScheme.primaryContainer.withValues(alpha: 0.15) : Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isDark ? theme.colorScheme.primary.withValues(alpha: 0.3) : Colors.blue.shade200),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '~$_affectedPeople people daily',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const Icon(Icons.people, size: 20),
                            ],
                          ),
                          Slider(
                            value: _affectedPeople.toDouble(),
                            min: 1,
                            max: 500,
                            divisions: 50,
                            label: '$_affectedPeople people',
                            onChanged: (val) => setState(() => _affectedPeople = val.round()),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 6. GPS LOCATION DISPLAY & MAP PIN ADJUSTER
                    Card(
                      elevation: 0,
                      color: isDark ? theme.colorScheme.primaryContainer.withValues(alpha: 0.2) : Colors.blue.shade50,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: isDark ? theme.colorScheme.primary.withValues(alpha: 0.3) : Colors.blue.shade200),
                      ),
                      child: ListTile(
                        leading: const Icon(Icons.location_on, color: Colors.red, size: 32),
                        title: Text(
                          _resolvedAddress.isNotEmpty
                              ? _resolvedAddress
                              : (_currentPosition != null
                                  ? 'GPS Locked: ${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}'
                                  : 'Fetching GPS Location...'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: const Text('Tap to view or adjust location pin (स्थान बदलें)'),
                        trailing: Icon(Icons.edit_location, color: theme.colorScheme.primary),
                        onTap: () async {
                          final latlong.LatLng defaultLocation = _currentPosition != null
                              ? latlong.LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
                              : const latlong.LatLng(28.6139, 77.2090);

                          final latlong.LatLng? pickedLocation = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OsmPickerScreen(initialLocation: defaultLocation),
                            ),
                          );

                          if (pickedLocation != null) {
                            setState(() {
                              _currentPosition = Position(
                                latitude: pickedLocation.latitude,
                                longitude: pickedLocation.longitude,
                                timestamp: DateTime.now(),
                                accuracy: 1.0,
                                altitude: 0.0,
                                altitudeAccuracy: 0.0,
                                heading: 0.0,
                                headingAccuracy: 0.0,
                                speed: 0.0,
                                speedAccuracy: 0.0,
                              );
                            });
                            _reverseGeocode(pickedLocation.latitude, pickedLocation.longitude);
                          }
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 7. LIVE SEVERITY & 2-HOUR RAPID SURVEY PREVIEW
                    _buildSeverityPreviewCard(theme, isDark),
                    const SizedBox(height: 24),

                    // 8. SUBMISSION BUTTON
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(56),
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                      ),
                      icon: const Icon(Icons.send_rounded, size: 24),
                      label: const Text(
                        'SUBMIT REPORT (+15 XP) / जमा करें',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      onPressed: _submitReport,
                    )
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSeverityPreviewCard(ThemeData theme, bool isDark) {
    final liveScore = SeverityEngine.calculateSeverityScore(
      category: _selectedCategory,
      urgencyLevel: _urgencyLevel,
      affectedPeople: _affectedPeople,
      upvotes: 0,
      createdAt: DateTime.now(),
    );
    final tier = SeverityEngine.getSeverityTier(liveScore);
    final tierColor = SeverityEngine.getTierColor(tier);
    final tierLabel = SeverityEngine.getTierLabel(tier);
    final slaLabel = SeverityEngine.getSlaLabel(tier);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: tierColor.withValues(alpha: 0.5),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: tierColor.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics_rounded, color: tierColor, size: 22),
              const SizedBox(width: 8),
              const Text(
                'AI & Math Severity Prediction',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: tierColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$tier (${liveScore.toStringAsFixed(1)} / 100)',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tier: $tierLabel',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Statutory Resolution SLA: $slaLabel',
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.amber.shade900.withValues(alpha: 0.2) : Colors.amber.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.amber.shade700.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.bolt, color: Colors.amber.shade800, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '⚡ 2-Hour Rapid On-Site Survey opens upon submission for fast verification & ground hazard audit.',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.amber.shade200 : Colors.amber.shade900,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _categoryBox(String key, String label, IconData icon, Color color) {
    final isSelected = _selectedCategory == key;
    final theme = Theme.of(context);
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedCategory = key;
            _titleController.text = _getDefaultTitleForCategory(key);
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? color : theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : theme.colorScheme.outlineVariant,
              width: isSelected ? 2.5 : 1,
            ),
            boxShadow: isSelected ? [BoxShadow(color: color.withValues(alpha: 0.35), blurRadius: 6)] : [],
          ),
          child: Column(
            children: [
              Icon(icon, size: 28, color: isSelected ? Colors.white : color),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
