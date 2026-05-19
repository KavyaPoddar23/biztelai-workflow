import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import API from '../config';

// Color based on confidence score
function confidenceColor(score) {
  if (score === undefined || score === null) return 'bg-gray-100';
  if (score >= 0.85) return 'bg-green-50 border-green-300';
  if (score >= 0.6) return 'bg-yellow-50 border-yellow-300';
  return 'bg-red-50 border-red-300';
}

function confidenceBadge(score) {
  if (score === undefined || score === null) return null;
  if (score >= 0.85) return <span className="text-xs text-green-600">✅ {Math.round(score * 100)}%</span>;
  if (score >= 0.6) return <span className="text-xs text-yellow-600">⚠️ {Math.round(score * 100)}%</span>;
  return <span className="text-xs text-red-600">❌ {Math.round(score * 100)}%</span>;
}

function ReviewPage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();

  const [upload, setUpload] = useState(null);
  const [records, setRecords] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState({});
  const [savedRows, setSavedRows] = useState({});
  const [error, setError] = useState(null);

  const fields = [
    { key: 'date', label: 'Date' },
    { key: 'shift', label: 'Shift' },
    { key: 'emp_no', label: 'Emp No' },
    { key: 'opn_code', label: 'Opn Code' },
    { key: 'machine_no', label: 'Machine No' },
    { key: 'work_order_no', label: 'Work Order No' },
    { key: 'qty_produced', label: 'Qty Produced' },
    { key: 'time_taken', label: 'Time Taken (hrs)' },
  ];

useEffect(() => {
    fetchUpload(); // eslint-disable-line
    fetchRecords(); // eslint-disable-line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId]);

  const fetchUpload = async () => {
    try {
      const res = await axios.get(`${API}/uploads/${uploadId}`);
      setUpload(res.data);
      if (res.data.status === 'extracted') setExtracted(true);
    } catch (err) {
      console.error('Could not load upload details');
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API}/records?upload_id=${uploadId}`);
      if (res.data.length > 0) {
        setRecords(res.data);
        setExtracted(true);
      }
    } catch (err) {
      console.error('No records yet');
    }
  };

  const handleExtract = async () => {
    setExtracting(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/extract/${uploadId}`);
      setRecords(res.data.rows.map((row, i) => ({
        ...row,
        id: i,
        confidence_scores: row.confidence || {},
        validation_errors: row.validation_errors || []
      })));
      setExtracted(true);
      fetchRecords(); // Get saved records with real IDs
    } catch (err) {
      setError(err.response?.data?.detail || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleFieldChange = (recordId, field, value) => {
    setRecords(prev =>
      prev.map(r => r.id === recordId ? { ...r, [field]: value } : r)
    );
  };

  const handleSaveRecord = async (record) => {
    setSaving(prev => ({ ...prev, [record.id]: true }));
    try {
      await axios.put(`${API}/records/${record.id}`, {
        date: record.date,
        shift: record.shift,
        emp_no: record.emp_no,
        opn_code: record.opn_code,
        machine_no: record.machine_no,
        work_order_no: record.work_order_no,
        qty_produced: record.qty_produced,
        time_taken: record.time_taken,
      });
      setSavedRows(prev => ({ ...prev, [record.id]: true }));
      fetchRecords();
    } catch (err) {
      alert('Failed to save record');
    } finally {
      setSaving(prev => ({ ...prev, [record.id]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Upload
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          Review Extracted Data
        </h2>
      </div>

      {/* Upload info + image */}
      {upload && (
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-6 items-start">
          <img
            src={upload.file_url}
            alt="Document"
            className="w-48 rounded-lg border shadow-sm"
          />
          <div>
            <p className="font-semibold text-gray-700">{upload.original_name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Uploaded: {new Date(upload.uploaded_at).toLocaleString()}
            </p>
            <span className={`mt-2 inline-block text-xs px-3 py-1 rounded-full font-medium ${
              upload.status === 'extracted'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {upload.status}
            </span>
          </div>
        </div>
      )}

      {/* Extract Button */}
      {!extracted && (
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="mb-6 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {extracting ? '🤖 Extracting with AI... (may take 10-20 seconds)' : '🤖 Extract Data with AI'}
        </button>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* Confidence Legend */}
      {extracted && records.length > 0 && (
        <div className="flex gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-200 inline-block"></span>
            High confidence (≥85%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-200 inline-block"></span>
            Medium (60–84%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-200 inline-block"></span>
            Low (&lt;60%) — review carefully
          </span>
        </div>
      )}

      {/* Records Table */}
      {records.length > 0 && (
        <div className="space-y-6">
          {records.map((record, idx) => (
            <div
              key={record.id || idx}
              className={`bg-white rounded-xl shadow p-5 border-l-4 ${
                record.validation_errors?.length > 0
                  ? 'border-red-400'
                  : record.is_reviewed
                  ? 'border-green-400'
                  : 'border-blue-400'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-700">Row {idx + 1}</h4>
                <div className="flex gap-2 items-center">
                  {record.is_reviewed && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✅ Reviewed
                    </span>
                  )}
                  {record.validation_errors?.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      ⚠️ {record.validation_errors.length} issue(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {record.validation_errors?.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 mb-1">
                    Validation Issues:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {record.validation_errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-600">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fields.map(({ key, label }) => {
                  const conf = record.confidence_scores?.[key];
                  return (
                    <div
                      key={key}
                      className={`p-2 rounded-lg border ${confidenceColor(conf)}`}
                    >
                      <label className="text-xs text-gray-500 font-medium block mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={record[key] || ''}
                        onChange={(e) =>
                          handleFieldChange(record.id, key, e.target.value)
                        }
                        className="w-full text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5"
                      />
                      <div className="mt-1">
                        {confidenceBadge(conf)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <button
                onClick={() => handleSaveRecord(record)}
                disabled={saving[record.id]}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving[record.id]
                  ? 'Saving...'
                  : savedRows[record.id]
                  ? '✅ Saved!'
                  : '💾 Save Record'}
              </button>
            </div>
          ))}
        </div>
      )}

      {extracted && records.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No data rows found in this document.
        </div>
      )}
    </div>
  );
}

export default ReviewPage;