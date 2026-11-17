import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { importApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CsvDataCenter() {
  const { isAdmin } = useAuth();
  const [selectedType, setSelectedType] = useState('suppliers');
  const [file, setFile] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewResult(null);
      setMessage('');
      setError('');
    }
  };

  const handlePreviewUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      const res = await importApi.previewCsv(formData);
      if (res.success) {
        setPreviewResult(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to preview CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!file) return;

    setCommitLoading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      const res = await importApi.commitCsv(formData);
      if (res.success) {
        setMessage(res.message);
        setPreviewResult(null);
        setFile(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to import CSV into MySQL.');
    } finally {
      setCommitLoading(false);
    }
  };

  const downloadTemplate = (type) => {
    const url = importApi.getTemplateUrl(type);
    window.open(url, '_blank');
  };

  const workflowSteps = [
    { num: '01', title: 'Prepare in Excel', desc: 'Author or format procurement records in MS Excel using structured columns.' },
    { num: '02', title: 'Clean & Validate', desc: 'Ensure data types, SKUs, dates, and non-empty mandatory fields.' },
    { num: '03', title: 'Export to CSV', desc: 'Save worksheets as standard UTF-8 Comma Separated Values (.csv).' },
    { num: '04', title: 'Import into MySQL', desc: 'Upload CSV to sync with live MySQL relational tables and views.' },
    { num: '05', title: 'Analyze in Web App', desc: 'Monitor updated reliability scores, KPIs, and charts in real-time.' },
    { num: '06', title: 'Export back to Excel', desc: 'Generate filtered reports and export back into Excel for ad-hoc queries.' }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            MS Excel Integration & CSV Data Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-way data exchange between Microsoft Excel and MySQL database with pre-commit validation.
          </p>
        </div>
      </div>

      {/* 6-Step Workflow Progression Guide */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gold-400">
          Official MS Excel & MySQL Integration Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflowSteps.map((step) => (
            <div key={step.num} className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 relative">
              <span className="font-mono text-xs font-black text-gold-400">{step.num}</span>
              <h4 className="font-bold text-xs text-white">{step.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Upload & Templates Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: CSV Upload & Validation Engine */}
        <div className="lg:col-span-8 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Import CSV into MySQL</h3>
              <p className="text-xs text-slate-400">Upload a spreadsheet export to synchronize records</p>
            </div>
            {isAdmin ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Admin Authorized
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                Analyst (Preview Mode Only)
              </span>
            )}
          </div>

          {message && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePreviewUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Entity / Table *</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPreviewResult(null);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
                >
                  <option value="suppliers">Suppliers Table (Suppliers)</option>
                  <option value="products">Products Table (Products)</option>
                  <option value="purchase_orders">Purchase Orders (Purchase_Orders)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !file}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4 text-gold-400" />
                )}
                <span>1. Validate & Preview CSV</span>
              </button>

              {previewResult && isAdmin && (
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={commitLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  {commitLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  <span>2. Commit Validated Rows to MySQL</span>
                </button>
              )}
            </div>
          </form>

          {/* Validation & Preview Output */}
          {previewResult && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  Preview ({previewResult.preview.length} of {previewResult.totalRows} records)
                </span>
                {previewResult.hasErrors ? (
                  <span className="text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                    {previewResult.totalErrorCount} format warnings detected
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    All rows passed schema validation!
                  </span>
                )}
              </div>

              {previewResult.validationErrors.length > 0 && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                  <p className="font-bold">Validation Warnings:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {previewResult.validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto max-h-56 overflow-y-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      {Object.keys(previewResult.preview[0] || {}).map((k) => (
                        <th key={k} className="py-2 px-3">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                    {previewResult.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sample CSV Templates */}
        <div className="lg:col-span-4 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <FileSpreadsheet className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Excel CSV Templates</h3>
              <p className="text-[11px] text-slate-400">Standard schemas ready for Excel authoring</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Suppliers Template</span>
                <span className="text-[10px] text-slate-400 font-mono">.csv</span>
              </div>
              <p className="text-[11px] text-slate-400">Columns: supplier_code, supplier_name, category, contact, email, phone, city, tax_id, lead_time_days...</p>
              <button
                onClick={() => downloadTemplate('suppliers')}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-gold-400 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Products Template</span>
                <span className="text-[10px] text-slate-400 font-mono">.csv</span>
              </div>
              <p className="text-[11px] text-slate-400">Columns: sku, product_name, category, metal_type, purity, gemstone, base_unit_cost, standard_lead_days...</p>
              <button
                onClick={() => downloadTemplate('products')}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-gold-400 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Purchase Orders Template</span>
                <span className="text-[10px] text-slate-400 font-mono">.csv</span>
              </div>
              <p className="text-[11px] text-slate-400">Columns: po_number, supplier_code, order_date, expected_delivery_date, status, total_amount...</p>
              <button
                onClick={() => downloadTemplate('purchase_orders')}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-gold-400 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
