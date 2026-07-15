import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, RefreshCw } from 'lucide-react';
import apiClient from '../api/apiClient';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/audit-logs');
      setLogs(res.data.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Compliance Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-1">Trace administrative activities, approvals, rejections, and compliance details.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 self-start"
          title="Refresh logs"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm max-w-xl mx-auto space-y-3">
          <History className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Audit Logs Registered</h3>
          <p className="text-slate-400 mt-1">No administrator actions have been recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Company</th>
                  <th className="px-6 py-4">Compliance Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50">
                    {/* Timestamp */}
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Admin */}
                    <td className="px-6 py-4 text-slate-800 font-semibold">{log.adminId}</td>

                    {/* Action badge */}
                    <td className="px-6 py-4">
                      {log.action === 'APPROVE_COMPANY' ? (
                        <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                          Approve Company
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                          Reject Company
                        </span>
                      )}
                    </td>

                    {/* Target Company */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{log.targetCompanyId?.name || 'N/A'}</p>
                        <p className="text-[9px] text-slate-400 font-mono">GST: {log.targetCompanyId?.gstNumber || 'N/A'}</p>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 text-slate-600 max-w-sm leading-relaxed">
                      {log.reason ? `"${log.reason}"` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
