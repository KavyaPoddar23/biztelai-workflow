import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:8000';

function SearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [shift, setShift] = useState('');
  const [machineNo, setMachineNo] = useState('');
  const [date, setDate] = useState('');
  const [empNo, setEmpNo] = useState('');
  const [needsReview, setNeedsReview] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load all records on first open
useEffect(() => {
    handleSearch(); // eslint-disable-line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (shift) params.append('shift', shift);
      if (machineNo) params.append('machine_no', machineNo);
      if (date) params.append('date', date);
      if (empNo) params.append('emp_no', empNo);
      if (needsReview !== '') params.append('needs_review', needsReview);

      const res = await axios.get(`${API}/search?${params.toString()}`);
      setResults(res.data.results);
      setTotal(res.data.total);
      setSearched(true);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShift('');
    setMachineNo('');
    setDate('');
    setEmpNo('');
    setNeedsReview('');
    handleSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🔍 Search Records</h2>
        <p className="text-gray-500 text-sm mt-1">
          Search and filter all extracted records
        </p>
      </div>

      {/* Search & Filter Box */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">

        {/* Main search bar */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by employee, machine, work order, operation code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            🔍 Search
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
          >
            ✕ Clear
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

          {/* Shift filter */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Shifts</option>
              <option value="I">Shift I</option>
              <option value="II">Shift II</option>
              <option value="III">Shift III</option>
              <option value="1">Shift 1</option>
              <option value="2">Shift 2</option>
              <option value="3">Shift 3</option>
            </select>
          </div>

          {/* Machine filter */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Machine No</label>
            <input
              type="text"
              placeholder="e.g. MC-730"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Date filter */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Date</label>
            <input
              type="text"
              placeholder="e.g. 20/4/26"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Employee filter */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Emp No</label>
            <input
              type="text"
              placeholder="e.g. BT4710"
              value={empNo}
              onChange={(e) => setEmpNo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Needs review filter */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Status</label>
            <select
              value={needsReview}
              onChange={(e) => setNeedsReview(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Records</option>
              <option value="true">Needs Review</option>
              <option value="false">Clean Records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searched && (
        <p className="text-sm text-gray-500 mb-4">
          Found <span className="font-bold text-gray-800">{total}</span> record(s)
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">⏳</p>
          <p>Searching...</p>
        </div>
      )}

      {/* Results Table */}
      {!loading && results.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Shift</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Emp No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Opn Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Machine</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Work Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time (hrs)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((record) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-50 transition ${
                      record.validation_errors?.length > 0 && !record.is_reviewed
                        ? 'bg-red-50'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-700">{record.date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {record.shift || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{record.emp_no || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{record.opn_code || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {record.machine_no || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.work_order_no || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{record.qty_produced || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{record.time_taken || '—'}</td>
                    <td className="px-4 py-3">
                      {record.is_reviewed ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                          ✅ Reviewed
                        </span>
                      ) : record.validation_errors?.length > 0 ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                          ⚠️ {record.validation_errors.length} issue(s)
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                      {record.original_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/review/${record.upload_id}`)}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No records found</p>
          <p className="text-sm mt-1">Try different search terms or clear filters</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;