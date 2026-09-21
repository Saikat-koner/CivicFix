import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Activity,
  CheckCircle2,
  RefreshCw,
  Code2,
  Table,
  Layers,
  FileCode,
  ShieldCheck,
  Cpu,
  X,
  Play,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Save,
  Download,
  Terminal,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { apiClient } from '../services/api';

interface DatabaseDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataModified?: () => void;
  onOpenApiModal?: () => void;
}

interface TableStat {
  name: string;
  rowCount: number;
  primaryKey: string;
  description: string;
}

interface DiagnosticData {
  database: {
    engine: string;
    region: string;
    databaseName: string;
    host: string;
    connectionStatus: string;
    tables: Record<string, TableStat>;
    sampleData: any[];
  };
  endpoints: Record<string, string>;
  timestamp: string;
}

export const DatabaseDiagnosticsModal: React.FC<DatabaseDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onDataModified,
  onOpenApiModal,
}) => {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'sql' | 'overview' | 'routes'>('editor');

  // --- Live Table Editor State ---
  const [selectedTable, setSelectedTable] = useState<'issues' | 'comments' | 'users' | 'issue_upvotes'>('issues');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [tableFields, setTableFields] = useState<string[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableOffset, setTableOffset] = useState(0);
  const limit = 15;

  // Edit Row Modal State
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Add Row Modal State
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [addLoading, setAddLoading] = useState(false);

  // --- SQL Console State ---
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM issues ORDER BY id DESC LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<any | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlHint, setSqlHint] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/database');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Failed to fetch database diagnostics');
      }
    } catch (err: any) {
      console.error('Error loading database diagnostics:', err);
      setError(err?.message || 'Could not connect to /api/database');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (table = selectedTable, offset = tableOffset) => {
    setTableLoading(true);
    try {
      const result = await apiClient.getTableRows(table, limit, offset);
      if (result) {
        setTableRows(result.rows || []);
        if (result.fields && result.fields.length > 0) {
          setTableFields(result.fields.map((f: any) => f.name));
        } else if (result.rows && result.rows.length > 0) {
          setTableFields(Object.keys(result.rows[0]));
        }
        setTableTotal(result.total || 0);
      }
    } catch (err: any) {
      console.error(`Error loading table ${table}:`, err);
      setError(`Failed to read records from table "${table}": ${err.message}`);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
      loadTableData(selectedTable, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'editor') {
      setTableOffset(0);
      loadTableData(selectedTable, 0);
    }
  }, [selectedTable, activeTab]);

  // In-app confirmation states (replaces window.confirm/alert which are blocked in iframes)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReseedConfirm, setShowReseedConfirm] = useState(false);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // --- CRUD Handlers ---
  const handleOpenEdit = (row: any) => {
    setEditingRow(row);
    setEditFormData({ ...row });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    setSaveLoading(true);
    setError(null);
    try {
      const cleanData: Record<string, any> = { ...editFormData };
      delete cleanData.id;
      delete cleanData.created_at;
      delete cleanData.createdAt;
      delete cleanData.updated_at;
      delete cleanData.updatedAt;

      await apiClient.updateTableRow(selectedTable, editingRow.id, cleanData);
      showNotification(`Record #${editingRow.id} updated in PostgreSQL.`);
      setEditingRow(null);
      loadTableData(selectedTable, tableOffset);
      fetchDiagnostics();
      if (onDataModified) onDataModified();
    } catch (err: any) {
      setError(`Failed to save record: ${err.message || 'Database error'}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRequestDelete = (id: number | string) => {
    setDeleteConfirmId(id);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await apiClient.deleteTableRow(selectedTable, deleteConfirmId);
      showNotification(`Record #${deleteConfirmId} deleted from PostgreSQL.`);
      setDeleteConfirmId(null);
      loadTableData(selectedTable, tableOffset);
      fetchDiagnostics();
      if (onDataModified) onDataModified();
    } catch (err: any) {
      setError(`Failed to delete record: ${err.message || 'Database error'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsAddingRow(true);
    setError(null);
    if (selectedTable === 'issues') {
      const code = `CFX-${Math.floor(1000 + Math.random() * 9000)}`;
      setNewRowData({
        tracking_id: code,
        title: 'Municipal defect report',
        description: 'Citizen report logged through administrative portal.',
        category: 'Roads',
        severity: 'Medium',
        urgency: 'Priority',
        department: 'BBMP Operations Cell',
        district: 'Central Ward 4',
        address: 'MG Road, Ward 4',
        status: 'open',
        priority_score: 65,
        upvotes: 1,
      });
    } else if (selectedTable === 'comments') {
      setNewRowData({
        issue_id: 'CFX-8921',
        author_name: 'Municipal Field Supervisor',
        content: 'Official site inspection conducted.',
        status_change: 'investigating',
      });
    } else if (selectedTable === 'users') {
      setNewRowData({
        uid: `user-${Date.now()}`,
        email: 'officer@bbmp.gov.in',
        display_name: 'Chief Civic Supervisor',
        role: 'admin',
      });
    } else {
      setNewRowData({});
    }
  };

  const handleSaveAdd = async () => {
    setAddLoading(true);
    setError(null);
    try {
      const cleanData: Record<string, any> = { ...newRowData };
      delete cleanData.id;
      delete cleanData.created_at;
      delete cleanData.createdAt;
      delete cleanData.updated_at;
      delete cleanData.updatedAt;

      await apiClient.insertTableRow(selectedTable, cleanData);
      showNotification(`New record created in table "${selectedTable}".`);
      setIsAddingRow(false);
      loadTableData(selectedTable, 0);
      setTableOffset(0);
      fetchDiagnostics();
      if (onDataModified) onDataModified();
    } catch (err: any) {
      setError(`Failed to insert record: ${err.message || 'Database error'}`);
    } finally {
      setAddLoading(false);
    }
  };

  // --- SQL Execution ---
  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlError(null);
    setSqlHint(null);
    setSqlResult(null);
    try {
      const res = await apiClient.executeSqlQuery(sqlQuery);
      if (res.success) {
        setSqlResult(res.data);
        showNotification(res.message || 'SQL query executed successfully.');
        fetchDiagnostics();
        if (onDataModified) onDataModified();
      } else {
        setSqlError(res.error || 'Query failed');
        setSqlHint(res.hint || null);
      }
    } catch (err: any) {
      setSqlError(err.message || 'Database error executing query.');
    } finally {
      setSqlLoading(false);
    }
  };

  // --- Reseed Handler ---
  const handleExecuteReseed = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.reseedDatabase();
      showNotification('Database successfully re-seeded with clean verified civic records!');
      setShowReseedConfirm(false);
      fetchDiagnostics();
      loadTableData(selectedTable, 0);
      if (onDataModified) onDataModified();
    } catch (err: any) {
      setError(`Reseed failed: ${err.message || 'Database error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="database-diagnostics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Cloud SQL PostgreSQL Admin Studio
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live & Modifiable
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Google Cloud SQL (PostgreSQL 16) • Read, Edit, Insert & Execute Direct Queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenApiModal && (
              <button
                id="open-free-apis-from-db-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApiModal();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-400/30"
                title="View directory of where to get free API keys"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline">Free APIs</span>
              </button>
            )}
            <button
              id="reseed-db-btn"
              type="button"
              onClick={() => setShowReseedConfirm(true)}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-400/20"
              title="Reset & Reseed Default Issues"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reseed Sample Data</span>
            </button>
            <button
              id="refresh-db-diagnostics-btn"
              type="button"
              onClick={() => {
                fetchDiagnostics();
                loadTableData(selectedTable, tableOffset);
              }}
              disabled={loading || tableLoading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || tableLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-db-diagnostics-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs font-semibold text-red-800 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2 gap-2 text-xs font-semibold shrink-0 overflow-x-auto">
          <button
            id="tab-db-editor"
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table Data Editor</span>
          </button>
          <button
            id="tab-db-sql"
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive SQL Console</span>
          </button>
          <button
            id="tab-db-overview"
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Database Engine Health</span>
          </button>
          <button
            id="tab-db-routes"
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'routes'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API Routes & Drizzle Schema</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">Notice: </span>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-amber-800 hover:text-amber-950 text-xs underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: TABLE DATA EDITOR */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              {/* Table Selector & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 mr-1">Select Table:</span>
                  {(['issues', 'comments', 'users', 'issue_upvotes'] as const).map((tbl) => {
                    const rowCount = data?.database?.tables?.[tbl]?.rowCount;
                    return (
                      <button
                        key={tbl}
                        onClick={() => setSelectedTable(tbl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedTable === tbl
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{tbl}</span>
                        {rowCount !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              selectedTable === tbl ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {rowCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={handleOpenAdd}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row to {selectedTable}</span>
                  </button>
                  <button
                    onClick={() => loadTableData(selectedTable, tableOffset)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 cursor-pointer"
                    title="Reload table"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[440px]">
                  {tableLoading ? (
                    <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span>Loading live records from Cloud SQL PostgreSQL...</span>
                    </div>
                  ) : tableRows.length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                      <Table className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-600">No records found in table "{selectedTable}".</p>
                      <button
                        onClick={handleOpenAdd}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                      >
                        + Insert First Record
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-gray-100/80 sticky top-0 z-10 text-gray-700 font-bold border-b border-gray-200">
                        <tr>
                          <th className="p-2.5 pl-3 w-20 text-center font-mono">Actions</th>
                          {tableFields.map((f) => (
                            <th key={f} className="p-2.5 font-semibold text-gray-800 whitespace-nowrap">
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableRows.map((row) => (
                          <tr key={row.id || JSON.stringify(row)} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-2 pl-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(row)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                  title="Edit row in PostgreSQL"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRequestDelete(row.id)}
                                  className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors cursor-pointer"
                                  title="Delete row from PostgreSQL"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            {tableFields.map((field) => {
                              const val = row[field];
                              let displayVal = val;
                              if (typeof val === 'object' && val !== null) {
                                displayVal = JSON.stringify(val);
                              } else if (typeof val === 'boolean') {
                                displayVal = val ? 'true' : 'false';
                              } else if (val === null || val === undefined) {
                                displayVal = <span className="text-gray-300 italic">null</span>;
                              }

                              return (
                                <td
                                  key={field}
                                  className="p-2.5 max-w-[220px] truncate text-gray-700 font-mono text-[11px]"
                                  title={typeof val === 'string' ? val : undefined}
                                >
                                  {field === 'status' && typeof val === 'string' ? (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                        val === 'open'
                                          ? 'bg-red-100 text-red-700'
                                          : val === 'investigating'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-emerald-100 text-emerald-700'
                                      }`}
                                    >
                                      {val}
                                    </span>
                                  ) : field === 'severity' && typeof val === 'string' ? (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        val === 'High' || val === 'Critical'
                                          ? 'bg-red-50 text-red-600 font-black'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {val}
                                    </span>
                                  ) : (
                                    displayVal
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Showing {tableRows.length > 0 ? tableOffset + 1 : 0} to{' '}
                    {Math.min(tableTotal, tableOffset + tableRows.length)} of {tableTotal} records
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const newOff = Math.max(0, tableOffset - limit);
                        setTableOffset(newOff);
                        loadTableData(selectedTable, newOff);
                      }}
                      disabled={tableOffset === 0 || tableLoading}
                      className="px-2.5 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        const newOff = tableOffset + limit;
                        setTableOffset(newOff);
                        loadTableData(selectedTable, newOff);
                      }}
                      disabled={tableOffset + limit >= tableTotal || tableLoading}
                      className="px-2.5 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE SQL CONSOLE */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">Direct SQL Query Console</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">PostgreSQL 16 Dialect</span>
                </div>

                {/* Query templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-gray-500">Quick Queries & Commands:</span>
                  {[
                    { label: 'All Issues', q: 'SELECT id, tracking_id, title, status, severity, upvotes FROM issues ORDER BY id DESC LIMIT 10;' },
                    { label: 'List Tables (/tables)', q: '/tables' },
                    { label: 'Table Schema (/schema)', q: '/schema' },
                    { label: 'Registered Users (/users)', q: '/users' },
                    { label: 'Fix All Critical', q: "UPDATE issues SET status = 'fixed' WHERE severity = 'Critical' RETURNING id, tracking_id, status;" },
                    { label: 'Issues Count by Status', q: 'SELECT status, count(*) as count FROM issues GROUP BY status;' },
                    { label: 'Recent Comments (/comments)', q: '/comments' },
                  ].map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setSqlQuery(t.q)}
                      className="px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-[11px] font-mono border border-gray-200 transition-colors cursor-pointer"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* SQL Textarea */}
                <div className="relative">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={4}
                    className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 selection:bg-blue-700"
                    placeholder="ENTER SQL STATEMENT (SELECT, UPDATE, INSERT, DELETE) or /tables, /schema..."
                  />
                  <div className="absolute right-2.5 bottom-2.5">
                    <button
                      onClick={handleExecuteSql}
                      disabled={sqlLoading || !sqlQuery.trim()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{sqlLoading ? 'Executing...' : 'Run Query'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-sans">
                  <span className="font-bold text-gray-600">Tip:</span>
                  <span>
                    SQL comments use <code className="text-blue-600 font-mono font-bold">--</code> (e.g., <code className="text-gray-700 font-mono">-- my query</code>). Slashes and slash commands (<code className="text-blue-600 font-mono">/tables</code>, <code className="text-blue-600 font-mono">/schema</code>, <code className="text-blue-600 font-mono">/issues</code>) are automatically parsed.
                  </span>
                </div>
              </div>

              {/* SQL Result Window */}
              {sqlError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>PostgreSQL Execution Notice:</span>
                  </div>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap">{sqlError}</pre>
                  {sqlHint && (
                    <div className="mt-2 pt-2 border-t border-red-200/80 text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg font-sans">
                      <span className="font-bold">Recommendation:</span> {sqlHint}
                    </div>
                  )}
                </div>
              )}

              {sqlResult && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden space-y-2">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">Query Results</span>
                      <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {sqlResult.command}
                      </span>
                      <span>{sqlResult.rowCount ?? sqlResult.rows?.length ?? 0} rows affected/returned</span>
                    </div>
                    <span className="font-mono text-gray-500 text-[11px]">{sqlResult.durationMs}ms</span>
                  </div>

                  {sqlResult.rows && sqlResult.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                          <tr>
                            {(sqlResult.fields || Object.keys(sqlResult.rows[0])).map((f: string) => (
                              <th key={f} className="p-2 text-gray-700 font-bold whitespace-nowrap">
                                {f}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sqlResult.rows.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-blue-50/30">
                              {(sqlResult.fields || Object.keys(row)).map((f: string) => (
                                <td key={f} className="p-2 max-w-[200px] truncate text-[11px] text-gray-800">
                                  {typeof row[f] === 'object' && row[f] !== null
                                    ? JSON.stringify(row[f])
                                    : String(row[f] ?? 'null')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500">
                      Query executed successfully with 0 returned rows.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENGINE HEALTH & DIAGNOSTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                    Cloud SQL Engine
                  </span>
                  <span className="text-sm font-black text-gray-900 mt-0.5 block">PostgreSQL 16</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Fully Operational
                  </span>
                </div>

                <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                    Cloud Region
                  </span>
                  <span className="text-sm font-black text-gray-900 mt-0.5 block">asia-southeast1</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Google Cloud Platform</span>
                </div>

                <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                    Database Name
                  </span>
                  <span className="text-sm font-black font-mono text-gray-900 mt-0.5 block">
                    {data?.database?.databaseName || 'applet_db'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">UTF-8 Collation</span>
                </div>

                <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                    Connection Pool
                  </span>
                  <span className="text-sm font-black text-gray-900 mt-0.5 block">10 Max (Pooled)</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3" /> Latency: &lt;15ms
                  </span>
                </div>
              </div>

              {/* Table stats list */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    PostgreSQL Tables & Schema Summary
                  </span>
                  <span className="text-xs text-gray-500 font-medium">4 Core Relational Tables</span>
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  {data?.database?.tables ? (
                    (Object.values(data.database.tables) as TableStat[]).map((table: TableStat) => (
                      <div key={table.name} className="p-3.5 flex items-start justify-between hover:bg-gray-50/50">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 text-sm">{table.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              PK: {table.primaryKey}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[11px]">{table.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-gray-900 font-mono">{table.rowCount}</span>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Rows</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400">Loading table schema...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: API ROUTES & SCHEMA */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-800">RESTful Express & Cloud SQL Endpoints</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  {[
                    { method: 'GET', path: '/api/issues', desc: 'List & filter civic issues directly from Cloud SQL PostgreSQL' },
                    { method: 'POST', path: '/api/issues', desc: 'Create civic report persisted in Cloud SQL PostgreSQL' },
                    { method: 'PUT', path: '/api/issues/:id', desc: 'Admin modification of issue details in PostgreSQL' },
                    { method: 'DELETE', path: '/api/issues/:id', desc: 'Admin deletion of issue record from PostgreSQL' },
                    { method: 'PATCH', path: '/api/issues/:id/status', desc: 'Update resolution status & log official comment' },
                    { method: 'GET', path: '/api/database/tables/:table', desc: 'Browse table records with pagination for Admin Studio' },
                    { method: 'POST', path: '/api/database/tables/:table', desc: 'Insert new row directly into PostgreSQL table' },
                    { method: 'PUT', path: '/api/database/tables/:table/:id', desc: 'Update row by primary key in PostgreSQL table' },
                    { method: 'DELETE', path: '/api/database/tables/:table/:id', desc: 'Delete row by primary key in PostgreSQL table' },
                    { method: 'POST', path: '/api/database/execute', desc: 'Execute admin SQL queries against PostgreSQL' },
                    { method: 'POST', path: '/api/database/reset', desc: 'Reseed clean verified civic records into PostgreSQL' },
                  ].map((ep) => (
                    <div
                      key={ep.path + ep.method}
                      className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            ep.method === 'GET'
                              ? 'bg-blue-100 text-blue-700'
                              : ep.method === 'POST'
                              ? 'bg-emerald-100 text-emerald-700'
                              : ep.method === 'PUT'
                              ? 'bg-amber-100 text-amber-700'
                              : ep.method === 'DELETE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-bold text-gray-900">{ep.path}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-sans">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Admin privileges active: Changes commit directly to Cloud SQL PostgreSQL</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: EDIT ROW MODAL */}
      {editingRow && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">
                  Edit Record #{editingRow.id} in "{selectedTable}"
                </h3>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              {tableFields
                .filter((f) => f !== 'id' && f !== 'created_at' && f !== 'updated_at')
                .map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="font-bold text-gray-700 block capitalize">
                      {field.replace(/_/g, ' ')}
                    </label>
                    {field === 'status' ? (
                      <select
                        value={editFormData[field] || 'open'}
                        onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium"
                      >
                        <option value="open">open</option>
                        <option value="investigating">investigating</option>
                        <option value="fixed">fixed</option>
                      </select>
                    ) : field === 'severity' ? (
                      <select
                        value={editFormData[field] || 'Medium'}
                        onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    ) : field === 'category' ? (
                      <select
                        value={editFormData[field] || 'Roads'}
                        onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium"
                      >
                        <option value="Roads">Roads</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Parks">Parks</option>
                        <option value="Safety">Safety</option>
                      </select>
                    ) : typeof editFormData[field] === 'number' ? (
                      <input
                        type="number"
                        value={editFormData[field] ?? 0}
                        onChange={(e) => setEditFormData({ ...editFormData, [field]: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                      >
                      </input>
                    ) : typeof editFormData[field] === 'string' && editFormData[field]?.length > 60 ? (
                      <textarea
                        rows={3}
                        value={editFormData[field] ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editFormData[field] ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saveLoading}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'Saving...' : 'Save to Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: ADD NEW ROW MODAL */}
      {isAddingRow && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Add New Row into "{selectedTable}"</h3>
              </div>
              <button
                onClick={() => setIsAddingRow(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              {Object.keys(newRowData).map((field) => (
                <div key={field} className="space-y-1">
                  <label className="font-bold text-gray-700 block capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  {field === 'status' ? (
                    <select
                      value={newRowData[field]}
                      onChange={(e) => setNewRowData({ ...newRowData, [field]: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium"
                    >
                      <option value="open">open</option>
                      <option value="investigating">investigating</option>
                      <option value="fixed">fixed</option>
                    </select>
                  ) : field === 'severity' ? (
                    <select
                      value={newRowData[field]}
                      onChange={(e) => setNewRowData({ ...newRowData, [field]: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  ) : field === 'category' ? (
                    <select
                      value={newRowData[field]}
                      onChange={(e) => setNewRowData({ ...newRowData, [field]: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium"
                    >
                      <option value="Roads">Roads</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Sanitation">Sanitation</option>
                      <option value="Parks">Parks</option>
                      <option value="Safety">Safety</option>
                    </select>
                  ) : typeof newRowData[field] === 'number' ? (
                    <input
                      type="number"
                      value={newRowData[field]}
                      onChange={(e) => setNewRowData({ ...newRowData, [field]: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                    />
                  ) : (
                    <input
                      type="text"
                      value={newRowData[field]}
                      onChange={(e) => setNewRowData({ ...newRowData, [field]: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingRow(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdd}
                disabled={addLoading}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addLoading ? 'Inserting...' : 'Insert into PostgreSQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: IN-APP CONFIRM DELETE ROW */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-red-200 overflow-hidden">
            <div className="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Confirm Record Deletion</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="text-red-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-700 leading-relaxed font-medium">
                Are you sure you want to delete record <strong>#{deleteConfirmId}</strong> from table <strong>"{selectedTable}"</strong> in Cloud SQL PostgreSQL?
              </p>
              <p className="text-red-600 font-semibold text-[11px] bg-red-50 p-2.5 rounded-lg border border-red-100">
                ⚠️ This will execute an immediate SQL DELETE in Cloud SQL PostgreSQL and cascade to related records.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Delete from PostgreSQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: IN-APP CONFIRM RESEED */}
      {showReseedConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
            <div className="px-5 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Reseed PostgreSQL Database</h3>
              </div>
              <button
                onClick={() => setShowReseedConfirm(false)}
                className="text-amber-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-700 leading-relaxed font-medium">
                Reset and re-seed the PostgreSQL database with clean verified civic reports?
              </p>
              <p className="text-amber-800 font-medium text-[11px] bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                This will reset sample tickets, GPS coords, and timelines in Cloud SQL while preserving authentication accounts.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReseedConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReseed}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Reseeding...' : 'Confirm & Reseed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
