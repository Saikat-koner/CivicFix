import React, { useState } from 'react';
import {
  Trash2,
  Truck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  Phone,
  Sparkles,
  RefreshCw,
  X,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Check
} from 'lucide-react';
import { SmartWasteBin, GarbageTruck, WasteCollectionSchedule } from '../types';
import {
  INITIAL_SMART_BINS,
  INITIAL_GARBAGE_TRUCKS,
  WASTE_COLLECTION_SCHEDULE,
  WASTE_SEGREGATION_GUIDE,
  WasteSegregationItem
} from '../data/garbageData';
import { soundFX } from '../utils/audioFeedback';
import confetti from 'canvas-confetti';

interface GarbageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBinOnMap?: (bin: SmartWasteBin) => void;
  onSelectTruckOnMap?: (truck: GarbageTruck) => void;
  onRequestReportOverflow?: (bin: SmartWasteBin) => void;
  onOpenReportWithGarbage?: () => void;
  userWard?: string;
}

export const GarbageManagementModal: React.FC<GarbageManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectBinOnMap,
  onSelectTruckOnMap,
  onRequestReportOverflow,
  onOpenReportWithGarbage,
  userWard = 'Indiranagar (Ward 112)',
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'trucks' | 'bins' | 'segregation' | 'bulk_pickup'>('schedule');
  const [smartBins, setSmartBins] = useState<SmartWasteBin[]>(INITIAL_SMART_BINS);
  const [trucks, setTrucks] = useState<GarbageTruck[]>(INITIAL_GARBAGE_TRUCKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBinType, setSelectedBinType] = useState<string>('all');
  
  // Bulk pickup form state
  const [bulkItemType, setBulkItemType] = useState('furniture');
  const [bulkAddress, setBulkAddress] = useState('27th Main Road, Sector 1, HSR Layout');
  const [bulkDate, setBulkDate] = useState('2026-09-05');
  const [bulkTimeSlot, setBulkTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [bulkNotes, setBulkNotes] = useState('Old sofa and wooden desk disassembly');
  const [bookingSuccessTicket, setBookingSuccessTicket] = useState<string | null>(null);

  // Reported Bins feedback tracking
  const [reportedBins, setReportedBins] = useState<string[]>([]);

  if (!isOpen) return null;

  // Filtered Smart Bins
  const filteredBins = smartBins.filter((b) => {
    const matchesType = selectedBinType === 'all' || b.type === selectedBinType;
    const matchesSearch =
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Filtered Segregation Guide
  const filteredSegregationItems = WASTE_SEGREGATION_GUIDE.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tip.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReportBinOverflow = (bin: SmartWasteBin) => {
    soundFX.playSuccess();
    setReportedBins((prev) => [...prev, bin.id]);
    if (onRequestReportOverflow) {
      onRequestReportOverflow(bin);
    }
  };

  const handleSubmitBulkPickup = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playSuccess();
    const ticketId = `SWM-BULK-${Math.floor(10000 + Math.random() * 90000)}`;
    setBookingSuccessTicket(ticketId);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div
      id="garbage-management-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="garbage-management-modal-container"
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#c2c6d7] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#121c28] text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Solid Waste & Garbage Collection Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-xs">
                  Swachh SWM
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Ward Radar: <strong className="text-white">{userWard}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer relative z-10"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Background Decorative Pattern */}
          <div className="absolute -right-6 -bottom-8 w-40 h-40 rounded-full bg-emerald-500/10 pointer-events-none blur-2xl" />
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-[#f8f9ff] border-b border-[#dae2ff] px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('schedule');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#0050c8] text-white shadow-sm'
                : 'text-[#56596e] hover:bg-white hover:text-[#121c28]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Collection Schedule</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('trucks');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'trucks'
                ? 'bg-[#0050c8] text-white shadow-sm'
                : 'text-[#56596e] hover:bg-white hover:text-[#121c28]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Live SWM Trucks ({trucks.length})</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('bins');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'bins'
                ? 'bg-[#0050c8] text-white shadow-sm'
                : 'text-[#56596e] hover:bg-white hover:text-[#121c28]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Smart Bins Radar</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('segregation');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'segregation'
                ? 'bg-[#0050c8] text-white shadow-sm'
                : 'text-[#56596e] hover:bg-white hover:text-[#121c28]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Waste Segregation Guide</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('bulk_pickup');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'bulk_pickup'
                ? 'bg-[#0050c8] text-white shadow-sm'
                : 'text-[#56596e] hover:bg-white hover:text-[#121c28]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Book Bulk Debris Pickup</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: COLLECTION TIMETABLE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Daily Banner */}
              <div className="bg-[#eef4ff] border border-[#bcd7ff] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-black text-[#0050c8]">
                      Today's Door-to-Door SWM Collection Active
                    </h3>
                  </div>
                  <p className="text-xs text-[#424655]">
                    Household tippers are currently active across {userWard}. Segregation at source is mandatory under municipal by-laws.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('trucks')}
                    className="px-4 py-2 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track My Truck</span>
                  </button>
                  {onOpenReportWithGarbage && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenReportWithGarbage();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Report Blackspot</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Schedule Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WASTE_COLLECTION_SCHEDULE.map((sch, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#c2c6d7] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          sch.wasteType.includes('Wet')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : sch.wasteType.includes('Dry')
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : sch.wasteType.includes('Sanitary')
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {sch.wasteType}
                        </span>
                        <h4 className="text-sm font-black text-[#121c28] mt-1.5">{sch.day}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sch.statusToday === 'In Progress'
                          ? 'bg-emerald-50 text-emerald-600 font-extrabold animate-pulse'
                          : 'bg-gray-100 text-[#56596e]'
                      }`}>
                        {sch.statusToday}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#56596e] bg-[#f8f9ff] p-2.5 rounded-xl border border-[#dae2ff]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#0050c8]" />
                        <span className="font-bold text-[#121c28]">{sch.timings}</span>
                      </div>
                      <span>•</span>
                      <span className="truncate">{sch.vehicleType}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-[#737686] uppercase tracking-wider">
                        Guidelines & Segregation:
                      </p>
                      <ul className="space-y-1">
                        {sch.instructions.map((inst, i) => (
                          <li key={i} className="text-xs text-[#424655] flex items-start gap-1.5 leading-snug">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE GARBAGE TRUCKS */}
          {activeTab === 'trucks' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#121c28]">
                    Municipal Compactor & Tipper Fleet Tracking
                  </h3>
                  <p className="text-xs text-[#56596e]">
                    Live GPS telemetry of SWM vehicles operating in your ward sectors.
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundFX.playClick();
                    setTrucks([...INITIAL_GARBAGE_TRUCKS]);
                  }}
                  className="px-3 py-1.5 bg-[#f8f9ff] hover:bg-[#dae2ff] text-[#0050c8] text-xs font-bold rounded-xl border border-[#dae2ff] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trucks.map((truck) => (
                  <div
                    key={truck.id}
                    className="bg-white border border-[#c2c6d7] rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono font-black text-xs text-[#121c28] block">
                              {truck.registrationNumber}
                            </span>
                            <span className="text-[10px] text-[#56596e] block font-medium">
                              {truck.ward}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                          {truck.status}
                        </span>
                      </div>

                      <div className="bg-[#f8f9ff] p-2.5 rounded-xl border border-[#dae2ff] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#56596e]">Next Stop:</span>
                          <strong className="text-[#121c28] truncate max-w-[140px]">{truck.nextStop}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#56596e]">ETA to Stop:</span>
                          <strong className="text-emerald-600 font-mono">~{truck.estimatedArrivalMinutes} mins</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#56596e]">Speed:</span>
                          <span className="font-mono text-[#121c28]">{truck.speedKmH} km/h</span>
                        </div>
                      </div>

                      {/* Route Completion & Payload */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[#56596e]">
                          <span>Route Progress</span>
                          <span className="text-[#0050c8]">{truck.completionPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0050c8] h-full transition-all rounded-full"
                            style={{ width: `${truck.completionPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Payload Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[#56596e]">
                          <span>Current Load ({truck.capacityTonnes}T)</span>
                          <span className={truck.loadPercent > 85 ? 'text-rose-600' : 'text-[#121c28]'}>
                            {truck.loadPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-full ${
                              truck.loadPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${truck.loadPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Driver & Contact */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-[#737686] block">Driver:</span>
                          <strong className="text-xs text-[#121c28]">{truck.driverName}</strong>
                        </div>
                        <a
                          href={`tel:${truck.driverPhone}`}
                          className="px-2.5 py-1 bg-[#eef4ff] text-[#0050c8] hover:bg-[#bcd7ff] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>

                    {onSelectTruckOnMap && (
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onSelectTruckOnMap(truck);
                          onClose();
                        }}
                        className="w-full py-2 bg-[#121c28] hover:bg-[#1d68f2] text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Locate Truck on Map</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SMART BINS RADAR */}
          {activeTab === 'bins' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-[#121c28]">
                    Municipal Smart Bin Sensor Network
                  </h3>
                  <p className="text-xs text-[#56596e]">
                    Ultrasonic fill-level telemetry from IoT civic bins deployed in Bengaluru.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedBinType}
                    onChange={(e) => setSelectedBinType(e.target.value)}
                    aria-label="Filter Smart Bins by Waste Stream Type"
                    className="px-3 py-1.5 bg-white border border-[#c2c6d7] rounded-xl text-xs font-bold text-[#121c28] focus:outline-none focus:ring-2 focus:ring-[#0050c8]"
                  >
                    <option value="all">All Waste Stream Types</option>
                    <option value="wet">Wet Organic Bins</option>
                    <option value="dry">Dry Recyclables</option>
                    <option value="hazardous">Domestic Hazardous</option>
                    <option value="mixed">Commercial Mixed Bins</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBins.map((bin) => {
                  const isReported = reportedBins.includes(bin.id);
                  const isOverflow = bin.fillPercent >= 85;
                  return (
                    <div
                      key={bin.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isOverflow
                          ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                          : 'border-[#c2c6d7] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-[#121c28]">
                              {bin.code}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              bin.type === 'wet'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bin.type === 'dry'
                                ? 'bg-blue-100 text-blue-800'
                                : bin.type === 'hazardous'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {bin.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#56596e] block truncate max-w-[200px] mt-0.5">
                            {bin.address}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          bin.status === 'overflowing'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : bin.status === 'near_full'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {bin.status}
                        </span>
                      </div>

                      {/* Fill Meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-extrabold">
                          <span className="text-[#56596e]">Fill Level</span>
                          <span className={isOverflow ? 'text-rose-600' : 'text-[#0050c8]'}>
                            {bin.fillPercent}% Full ({bin.capacityLiters}L)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              bin.fillPercent >= 85
                                ? 'bg-rose-500'
                                : bin.fillPercent >= 60
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${bin.fillPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#56596e]">
                        <span>Last Emptied: <strong>{bin.lastEmptied}</strong></span>
                        <span className="text-emerald-700 font-bold">● Sensor Active</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                        {onSelectBinOnMap && (
                          <button
                            onClick={() => {
                              soundFX.playClick();
                              onSelectBinOnMap(bin);
                              onClose();
                            }}
                            className="py-1.5 px-2 bg-[#f8f9ff] hover:bg-[#dae2ff] text-[#0050c8] text-xs font-bold rounded-xl border border-[#dae2ff] text-center cursor-pointer transition-colors"
                          >
                            Show on Map
                          </button>
                        )}

                        <button
                          disabled={isReported}
                          onClick={() => handleReportBinOverflow(bin)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-colors cursor-pointer ${
                            isReported
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          }`}
                        >
                          {isReported ? 'Reported ✓' : 'Report Overflow'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: WASTE SEGREGATION GUIDE */}
          {activeTab === 'segregation' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-[#eef4ff] border border-[#bcd7ff] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0050c8]" />
                  <h3 className="text-sm font-black text-[#0050c8]">
                    Municipal 3-Way Waste Segregation Rulebook
                  </h3>
                </div>
                <p className="text-xs text-[#424655] leading-relaxed">
                  Search common household items below to know exactly which bin to use. Segregating waste at source keeps hazardous materials away from landfills and aids compost generation.
                </p>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any item (e.g. coconut shells, batteries, milk pouch, glass jar)..."
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#bcd7ff] text-xs focus:outline-none focus:ring-2 focus:ring-[#0050c8] text-[#121c28]"
                  />
                </div>
              </div>

              {/* Color Code Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <strong className="text-emerald-900 block font-black">Green Bin</strong>
                    <span className="text-[11px] text-emerald-700">Wet / Kitchen Waste</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <strong className="text-blue-900 block font-black">Blue Bin</strong>
                    <span className="text-[11px] text-blue-700">Dry Recyclables</span>
                  </div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <strong className="text-rose-900 block font-black">Red Bin / Wrap</strong>
                    <span className="text-[11px] text-rose-700">Sanitary & Hazardous</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <strong className="text-amber-900 block font-black">Yellow Bin / Center</strong>
                    <span className="text-[11px] text-amber-700">E-Waste & Bulky</span>
                  </div>
                </div>
              </div>

              {/* Search Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredSegregationItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-[#c2c6d7] rounded-xl shadow-2xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-[#121c28]">{item.name}</h4>
                      <p className="text-[11px] text-[#56596e]">{item.tip}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      item.binColor === 'Green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.binColor === 'Blue'
                        ? 'bg-blue-100 text-blue-800'
                        : item.binColor === 'Red'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.binColor} Bin ({item.category})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BOOK BULK DEBRIS PICKUP */}
          {activeTab === 'bulk_pickup' && (
            <div className="space-y-4 animate-in fade-in">
              {bookingSuccessTicket ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-900">
                    Bulk Debris Pickup Scheduled!
                  </h3>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Your request has been dispatched to BBMP Solid Waste Management Division. A flatbed carrier will arrive at your address on <strong>{bulkDate}</strong> between <strong>{bulkTimeSlot}</strong>.
                  </p>
                  <div className="inline-block px-4 py-2 bg-white rounded-xl border border-emerald-300 text-xs font-mono font-black text-emerald-900 shadow-2xs">
                    Confirmation Ticket: {bookingSuccessTicket}
                  </div>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => setBookingSuccessTicket(null)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Book Another Pickup
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-white border border-[#c2c6d7] text-[#121c28] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitBulkPickup} className="bg-white border border-[#c2c6d7] rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#121c28]">
                      On-Demand Municipal Bulk & Debris Pickup Service
                    </h3>
                    <p className="text-xs text-[#56596e]">
                      Book specialized disposal for old furniture, electronic appliances, garden cuttings, or renovation rubble.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#121c28] mb-1">
                        Category of Bulk Material
                      </label>
                      <select
                        value={bulkItemType}
                        onChange={(e) => setBulkItemType(e.target.value)}
                        className="w-full px-3 py-2 border border-[#c2c6d7] rounded-xl text-xs font-medium text-[#121c28] focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                      >
                        <option value="furniture">Old Furniture & Mattresses</option>
                        <option value="ewaste">Large E-Waste (Fridges, Washing Machines, TVs)</option>
                        <option value="debris">Construction & Renovation Rubble</option>
                        <option value="garden">Tree Pruning & Bulk Garden Debris</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#121c28] mb-1">
                        Preferred Pickup Date
                      </label>
                      <input
                        type="date"
                        value={bulkDate}
                        onChange={(e) => setBulkDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#c2c6d7] rounded-xl text-xs font-medium text-[#121c28] focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#121c28] mb-1">
                        Time Window
                      </label>
                      <select
                        value={bulkTimeSlot}
                        onChange={(e) => setBulkTimeSlot(e.target.value)}
                        className="w-full px-3 py-2 border border-[#c2c6d7] rounded-xl text-xs font-medium text-[#121c28] focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                      >
                        <option value="08:00 AM - 11:00 AM">Morning (08:00 AM – 11:00 AM)</option>
                        <option value="11:00 AM - 02:00 PM">Midday (11:00 AM – 02:00 PM)</option>
                        <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM – 05:00 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#121c28] mb-1">
                        Pickup Location Address
                      </label>
                      <input
                        type="text"
                        value={bulkAddress}
                        onChange={(e) => setBulkAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-[#c2c6d7] rounded-xl text-xs font-medium text-[#121c28] focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121c28] mb-1">
                      Material Description & Quantities
                    </label>
                    <textarea
                      rows={2}
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      placeholder="e.g. 1 old double mattress, 2 broken wooden chairs..."
                      className="w-full px-3 py-2 border border-[#c2c6d7] rounded-xl text-xs font-medium text-[#121c28] focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-[#f8f9ff] border border-[#dae2ff] rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-[#424655]">
                        Earn <strong>+40 Civic Credits</strong> for segregated disposal
                      </span>
                    </div>
                    <span className="font-extrabold text-[#0050c8]">Zero Charge for Municipal Citizens</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0050c8] hover:bg-[#1d68f2] text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirm Bulk Pickup Booking</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f8f9ff] border-t border-[#dae2ff] p-4 sm:px-6 flex items-center justify-between text-xs text-[#56596e]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>BBMP Solid Waste Management Helpline: <strong>1912 / 1533</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#c2c6d7] text-[#121c28] font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
