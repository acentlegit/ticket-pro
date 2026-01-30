import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const BulkUploadTickets = () => {
    const navigate = useNavigate();
    const { companyId } = useParams();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const onDrop = (acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setError('Invalid file type or size. Please upload CSV or Excel file (max 10MB)');
            return;
        }

        setFile(acceptedFiles[0]);
        setError(null);
        setResults(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false
    });

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/tickets/bulk-upload/template', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ticket-upload-template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download template error:', error);
            setError('Failed to download template');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            const companyId = localStorage.getItem('companyId');
            const response = await api.post(
                `/${companyId}/tickets/bulk-upload`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 300000, // 5 minutes for bulk upload
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                }
            );

            setResults(response.data.summary);
            setFile(null);
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const downloadErrorReport = () => {
        if (!results || !results.errors.length) return;

        const csvContent = [
            ['Row', 'Field', 'Error', 'Data'],
            ...results.errors.map(err => [
                err.row,
                err.errors.map(e => e.field).join('; '),
                err.errors.map(e => e.message).join('; '),
                JSON.stringify(err.data)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'bulk-upload-errors.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(`/companies/${companyId}/tickets`)}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Tickets
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Bulk Upload Tickets
                    </h1>
                </div>

                {/* Instructions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        📥 Upload Instructions
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                        <li>Download the CSV template below</li>
                        <li>Fill in your ticket details (Subject, Description, and Priority are required)</li>
                        <li>Upload the completed file</li>
                        <li>Review the results and fix any errors if needed</li>
                    </ol>

                    <div className="mt-4">
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV Template
                        </button>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                        {isDragActive ? (
                            <p className="text-lg text-blue-600 dark:text-blue-400">
                                Drop the file here...
                            </p>
                        ) : (
                            <>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                                    Drag & drop your file here, or click to browse
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Supported formats: CSV, Excel (.csv, .xlsx, .xls)
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Maximum file size: 10MB | Maximum rows: 1000
                                </p>
                            </>
                        )}
                    </div>

                    {file && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {uploading && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {progress === 100 ? 'Processing data...' : 'Uploading...'}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {progress}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                                <p className="text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {uploading ? (progress === 100 ? 'Processing...' : 'Uploading...') : 'Upload Tickets'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                {results && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📊 Upload Results
                        </h2>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total Rows</span>
                                    <AlertCircle className="h-5 w-5 text-gray-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {results.totalRows}
                                </p>
                            </div>

                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 dark:text-green-400">Success</span>
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
                                    {results.successCount}
                                </p>
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-red-600 dark:text-red-400">Failed</span>
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">
                                    {results.failureCount}
                                </p>
                            </div>
                        </div>

                        {results.processingTime && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Processing time: {results.processingTime}
                            </p>
                        )}

                        {results.errors && results.errors.length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                        Errors ({results.errors.length})
                                    </h3>
                                    <button
                                        onClick={downloadErrorReport}
                                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                        Download Error Report
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                    Row
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                    Field
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                    Error
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {results.errors.slice(0, 10).map((error, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                        {error.row}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                        {error.errors.map(e => e.field).join(', ')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {error.errors.map(e => e.message).join('; ')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {results.errors.length > 10 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                                            Showing 10 of {results.errors.length} errors. Download full report for details.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => navigate(`/companies/${companyId}/tickets`)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                View All Tickets
                            </button>
                            <button
                                onClick={() => {
                                    setResults(null);
                                    setFile(null);
                                }}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Upload Another File
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkUploadTickets;
