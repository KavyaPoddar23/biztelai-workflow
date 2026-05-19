import React, { useState, useEffect } from 'react';
import axios from 'axios';

import API from '../config';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // Load upload history when page opens
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/uploads`);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadResult(null);
    setError(null);

    // Show image preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
      fetchHistory(); // Refresh history
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Upload Document
      </h2>
      <p className="text-gray-500 mb-6">
        Upload a handwritten machine shop log (JPG, PNG, or PDF)
      </p>

      {/* Upload Box */}
      <div
        className="border-2 border-dashed border-blue-400 rounded-xl p-8 text-center bg-white cursor-pointer hover:border-blue-600 transition"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 mx-auto rounded-lg shadow"
          />
        ) : (
          <div>
            <p className="text-4xl mb-3">📄</p>
            <p className="text-gray-500 text-sm">
              Drag & drop or <span className="text-blue-600 font-medium">click to browse</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">JPG, PNG, PDF supported</p>
          </div>
        )}
      </div>

      {/* Selected file name */}
      {selectedFile && (
        <p className="mt-2 text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedFile.name}</span>
        </p>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {uploading ? '⏳ Uploading...' : '⬆️ Upload Document'}
      </button>

      {/* Success message */}
      {uploadResult && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-sm">
          ✅ Upload successful! File ID: <strong>{uploadResult.id}</strong>
        </div>
      )}

      {/* Upload History */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-gray-700 mb-4">
          📁 Upload History
        </h3>

        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No uploads yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200"
              >
                {/* Thumbnail */}
                <img
                  src={item.file_url}
                  alt={item.original_name}
                  className="w-16 h-16 object-cover rounded-md border"
                  onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">
                    {item.original_name}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(item.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {item.status}
                  </span>
                  <a
                    href={`/review/${item.id}`}
                    className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition"
                  >
                    🤖 Extract & Review
                </a>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;