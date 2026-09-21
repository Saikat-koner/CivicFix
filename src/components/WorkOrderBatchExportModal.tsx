import React, { useState } from 'react';
import { CivicIssue } from '../types';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  Filter,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface WorkOrderBatchExportModalProps {
  issues: CivicIssue[];
  onClose: () => void;
}

export const WorkOrderBatchExportModal: React.FC<WorkOrderBatchExportModalProps> = ({
  issues,
  onClose,
}) => {
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const filtered = issues.filter((i) => {
    if (filterDepartment !== 'all' && i.category !== filterDepartment) return false;
    return true;
  });

  const handleDownloadCSV = () => {
    const headers = [
      'Ticket Code',
      'Title',
      'Category',
      'District',
      'Address',
      'Latitude',
      'Longitude',
      'Status',
      'Severity',
      'Reported Date',
      'Assigned Crew',
      'Upvotes',
      'Verified Fixes'
    ];

    const rows = filtered.map((issue) => [
      issue.code,
      `"${issue.title.replace(/"/g, '""')}"`,
      issue.category,
      `"${issue.district.replace(/"/g, '""')}"`,
      `"${issue.address.replace(/"/g, '""')}"`,
      issue.location.lat,
      issue.location.lng,
      issue.status,
      issue.severity,
      issue.reportedDate,
      `"${(issue.assignedCrew || 'Unassigned').replace(/"/g, '""')}"`,
      issue.upvotes,
      issue.verificationVotes?.isFixed || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BBMP_Municipal_Work_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="batch-export-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="batch-export-modal-card"
        className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#c2c6d7] relative my-6 animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0b1320] text-white p-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0050c8] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                Office of the Municipal Commissioner
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                Batch Work Order & Audit Manifest Export
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 bg-[#0050c8] hover:bg-[#1d68f2] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Manifest</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (hidden on print) */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#737686]" />
            <span className="text-xs font-bold text-[#121c28]">Department:</span>
            {['all', 'Roads', 'Utilities', 'Sanitation', 'Parks', 'Traffic'].map((dep) => (
              <button
                key={dep}
                onClick={() => setFilterDepartment(dep)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterDepartment === dep
                    ? 'bg-[#0050c8] text-white'
                    : 'bg-white border border-gray-200 text-[#424655] hover:bg-gray-100'
                }`}
              >
                {dep}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#737686] font-bold">
            Showing {filtered.length} of {issues.length} records
          </span>
        </div>

        {/* Printable Official Manifest Document */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Manifest Title Block */}
          <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#003180]" />
                <h1 className="text-xl font-black text-[#121c28] uppercase tracking-tight">
                  Metropolitan Municipal Corporation
                </h1>
              </div>
              <p className="text-xs text-[#737686] mt-0.5">
                Official Infrastructure Maintenance Audit Manifest & Contractor Reconciliation Sheet
              </p>
            </div>

            <div className="text-right text-xs text-[#737686] font-mono">
              <p>Generated: 2026-10-17 14:30 IST</p>
              <p>Doc Ref: BBMP-OPS-MNT-2026-W112</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 text-[#121c28] font-bold">
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Category & Title</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Crew</th>
                  <th className="py-2.5 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0050c8]">
                      {issue.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#121c28] block">{issue.title}</span>
                      <span className="text-[10px] text-[#737686]">{issue.category} • Reported {issue.reportedDate}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#424655] max-w-xs truncate">
                      {issue.address}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          issue.status === 'fixed'
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : issue.status === 'investigating'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#121c28] font-medium text-[11px]">
                      {issue.assignedCrew || (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#121c28]">
                      {issue.verificationVotes?.isFixed || 0} checks
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Municipal Audit Signatures */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs text-[#737686]">
            <div>
              <p className="font-bold text-[#121c28]">Prepared By:</p>
              <p className="mt-4 border-b border-gray-400 w-48" />
              <p className="mt-1">Chief Operations Superintendent</p>
              <p className="text-[10px]">Division of Public Works</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-[#121c28]">Countersigned & Audited:</p>
              <p className="mt-4 border-b border-gray-400 w-48 ml-auto" />
              <p className="mt-1">Chief Accounts Officer</p>
              <p className="text-[10px]">Municipal Finance & Vigilance Cell</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
