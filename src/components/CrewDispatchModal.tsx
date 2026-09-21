import React, { useState } from 'react';
import { CivicIssue, ContractorCrew } from '../types';
import {
  X,
  Wrench,
  Truck,
  Phone,
  Calendar,
  DollarSign,
  ShieldAlert,
  Clock,
  CheckCircle2,
  HardHat,
  Send,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CrewDispatchModalProps {
  issue: CivicIssue;
  onClose: () => void;
  onConfirmDispatch: (issueId: string, dispatchData: {
    crewName: string;
    headEngineer: string;
    budgetCode: string;
    estimatedCost: string;
    targetDate: string;
    equipment: string;
    notes: string;
  }) => void;
}

export const AVAILABLE_CREWS: ContractorCrew[] = [
  {
    id: 'crew-1',
    name: 'BBMP Rapid Asphalt Maintenance Crew #4',
    department: 'Road Infrastructure Cell',
    headEngineer: 'Er. Suresh Murthy (Chief Asphalt Supt.)',
    contactPhone: '+91 94480 32104',
    status: 'available',
    currentLoad: 2,
    capacity: 5,
    specialties: ['Bitumen Resurfacing', 'Pot-Hole Cold Mix', 'Trench Restoration'],
    vehiclePlate: 'KA-04-GA-9182 (Heavy Bitumen Paver)',
  },
  {
    id: 'crew-2',
    name: 'Metropolitan Water Supply & Sewage Emergency Unit',
    department: 'BWSSB Underground Utility Cell',
    headEngineer: 'Er. N. Rao (Executive Engineer)',
    contactPhone: '+91 94480 55421',
    status: 'available',
    currentLoad: 3,
    capacity: 6,
    specialties: ['High-Pressure Jetting', 'Manhole Reconstruction', 'Pipeline Leak Repair'],
    vehiclePlate: 'KA-01-EA-4491 (Hydro-Jet Suction Tanker)',
  },
  {
    id: 'crew-3',
    name: 'Apex Electrical & Smart Grid Solutions Ltd.',
    department: 'BESCOM Streetlight Cell',
    headEngineer: 'S. Raman (Senior Grid Engineer)',
    contactPhone: '+91 98801 77209',
    status: 'available',
    currentLoad: 1,
    capacity: 4,
    specialties: ['LED Luminaire Replacement', 'Feeder Pillar Faults', 'Underground Cable Tracing'],
    vehiclePlate: 'KA-03-FA-7102 (Hydraulic Boom Crane)',
  },
  {
    id: 'crew-4',
    name: 'Civic Cleanliness Mechanized Fleet #2',
    department: 'BBMP Solid Waste Management',
    headEngineer: 'K. Venkatesh (Sanitation Supervisor)',
    contactPhone: '+91 97412 88401',
    status: 'available',
    currentLoad: 4,
    capacity: 8,
    specialties: ['Blackspot Clearance', 'Debris Compactor', 'Bio-Methanation Desludging'],
    vehiclePlate: 'KA-05-MA-2045 (Heavy Compactor Truck)',
  },
];

export const CrewDispatchModal: React.FC<CrewDispatchModalProps> = ({
  issue,
  onClose,
  onConfirmDispatch,
}) => {
  const [selectedCrewId, setSelectedCrewId] = useState<string>(AVAILABLE_CREWS[0].id);
  const [budgetCode, setBudgetCode] = useState<string>('WARD-112-CAPEX-2026');
  const [estimatedCost, setEstimatedCost] = useState<string>('$1,250');
  const [targetDate, setTargetDate] = useState<string>('Tomorrow, 05:00 PM');
  const [equipment, setEquipment] = useState<string>('Bitumen Roller + 4 Pavement Specialists');
  const [notes, setNotes] = useState<string>('Expedite work during off-peak morning hours. Maintain pedestrian safety barriers.');

  const selectedCrew = AVAILABLE_CREWS.find((c) => c.id === selectedCrewId) || AVAILABLE_CREWS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDispatch(issue.id, {
      crewName: selectedCrew.name,
      headEngineer: selectedCrew.headEngineer,
      budgetCode,
      estimatedCost,
      targetDate,
      equipment,
      notes,
    });
    confetti({ particleCount: 50, spread: 60 });
    onClose();
  };

  return (
    <div
      id="crew-dispatch-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="crew-dispatch-modal-card"
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#c2c6d7] relative my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1320] via-[#121c28] to-[#1e293b] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5 text-[#0b1320]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                  Municipal Operations Command Center
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Dispatch Field Maintenance Unit
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Ticket Context Pill */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-bold">
                {issue.code}
              </span>
              <span className="font-bold text-white/90 truncate max-w-sm">
                {issue.title}
              </span>
            </div>
            <span className="text-[11px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold border border-red-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              SLA Statutory Priority: High
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Select Field Crew */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#121c28] uppercase tracking-wider block flex items-center justify-between">
              <span>1. Choose Maintenance Contractor / Municipal Unit</span>
              <span className="text-[11px] text-[#737686] font-normal">
                {AVAILABLE_CREWS.length} Available Units
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {AVAILABLE_CREWS.map((crew) => {
                const isSelected = crew.id === selectedCrewId;
                return (
                  <div
                    key={crew.id}
                    onClick={() => {
                      setSelectedCrewId(crew.id);
                      if (crew.id === 'crew-1') {
                        setEquipment('Bitumen Roller + 4 Pavement Specialists');
                        setEstimatedCost('$1,250');
                      } else if (crew.id === 'crew-2') {
                        setEquipment('Hydro-Jet Suction Tanker + 3 Utility Engineers');
                        setEstimatedCost('$1,800');
                      } else if (crew.id === 'crew-3') {
                        setEquipment('Hydraulic Aerial Boom Crane + 2 Electricians');
                        setEstimatedCost('$650');
                      } else {
                        setEquipment('Heavy Compactor Truck + 6 Sanitation Workers');
                        setEstimatedCost('$900');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0050c8] bg-[#eef4ff] shadow-xs'
                        : 'border-[#c2c6d7] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#0050c8] text-white'
                            : 'bg-gray-100 text-[#737686]'
                        }`}
                      >
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-[#121c28]">
                            {crew.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-white text-[#0050c8] font-bold border border-[#dae2ff] rounded">
                            {crew.department}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#424655] mt-0.5">
                          {crew.headEngineer} • {crew.contactPhone}
                        </p>
                        <p className="text-[10px] text-[#737686] font-mono mt-0.5">
                          Vehicle: {crew.vehiclePlate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-[#10B981] bg-[#dcfce7] px-2 py-0.5 rounded">
                        Available
                      </span>
                      <span className="text-[10px] text-[#737686] mt-1">
                        Active load: {crew.currentLoad}/{crew.capacity} jobs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Deployment Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#121c28] block mb-1">
                Equipment & Crew Deployment
              </label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#c2c6d7] focus:outline-none focus:ring-2 focus:ring-[#0050c8]"
                placeholder="Machinery and crew size"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#121c28] block mb-1">
                Target Resolution Window
              </label>
              <input
                type="text"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#c2c6d7] focus:outline-none focus:ring-2 focus:ring-[#0050c8]"
                placeholder="e.g. Within 24 hours"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#121c28] block mb-1">
                Municipal Budget Account Code
              </label>
              <input
                type="text"
                value={budgetCode}
                onChange={(e) => setBudgetCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#c2c6d7] font-mono focus:outline-none focus:ring-2 focus:ring-[#0050c8]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#121c28] block mb-1">
                Estimated Work Order Cost
              </label>
              <input
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#c2c6d7] font-mono focus:outline-none focus:ring-2 focus:ring-[#0050c8]"
              />
            </div>
          </div>

          {/* Step 3: Field Briefing Instructions */}
          <div>
            <label className="text-xs font-bold text-[#121c28] block mb-1">
              Field Briefing & Safety Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#c2c6d7] focus:outline-none focus:ring-2 focus:ring-[#0050c8]"
              placeholder="Special instructions for field crew..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#424655] hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Authorize & Dispatch Work Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
