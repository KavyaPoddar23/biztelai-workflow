import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';

const API = 'http://localhost:8000';

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/analytics`);
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">❌ {error}</div>
      </div>
    );
  }

  const { overview, shift_summary, machine_summary, employee_summary, recent_uploads, daily_trend } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">📊 Operations Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Real-time insights from extracted machine shop records
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Uploads"
          value={overview.total_uploads}
          subtitle="Documents processed"
          color="border-blue-500"
          icon="📁"
        />
        <StatCard
          title="Total Records"
          value={overview.total_records}
          subtitle="Rows extracted"
          color="border-green-500"
          icon="📋"
        />
        <StatCard
          title="Reviewed"
          value={overview.reviewed_records}
          subtitle="Manually verified"
          color="border-purple-500"
          icon="✅"
        />
        <StatCard
          title="Validation Failures"
          value={overview.validation_failures}
          subtitle="Records with issues"
          color="border-red-500"
          icon="⚠️"
        />
        <StatCard
          title="Needs Review"
          value={overview.needs_review}
          subtitle="Pending attention"
          color="border-yellow-500"
          icon="🔍"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Shift wise quantity */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">
            🔄 Shift-wise Production
          </h3>
          {shift_summary.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={shift_summary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shift" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_qty" name="Total Qty" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="record_count" name="Records" fill="#93c5fd" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Machine wise quantity */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">
            ⚙️ Machine-wise Production
          </h3>
          {machine_summary.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={machine_summary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="machine_no" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_qty" name="Total Qty" fill="#8b5cf6" radius={[4,4,0,0]} />
                <Bar dataKey="avg_time" name="Avg Time (hrs)" fill="#c4b5fd" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Daily production trend */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">
            📈 Daily Production Trend
          </h3>
          {daily_trend.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_qty"
                  name="Total Qty"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Employee summary */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">
            👷 Top Employees by Production
          </h3>
          {employee_summary.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={employee_summary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="emp_no" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="total_qty" name="Total Qty" fill="#f59e0b" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Machine avg time table */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">
            ⏱️ Machine Efficiency Summary
          </h3>
          {machine_summary.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-left">
                    <th className="pb-2 font-medium">Machine</th>
                    <th className="pb-2 font-medium">Records</th>
                    <th className="pb-2 font-medium">Total Qty</th>
                    <th className="pb-2 font-medium">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {machine_summary.map((m, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 font-medium text-purple-700">{m.machine_no}</td>
                      <td className="py-2 text-gray-600">{m.record_count}</td>
                      <td className="py-2 text-gray-600">{m.total_qty}</td>
                      <td className="py-2 text-gray-600">{m.avg_time} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent uploads */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">
            🕐 Recent Uploads
          </h3>
          {recent_uploads.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No uploads yet</p>
          ) : (
            <div className="space-y-3">
              {recent_uploads.map((u) => (
                <div key={u.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                      {u.original_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(u.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.status === 'extracted'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchAnalytics}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          🔄 Refresh Dashboard
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;