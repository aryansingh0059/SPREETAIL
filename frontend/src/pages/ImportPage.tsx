import React, { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Upload, ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { TopNav } from '../components/TopNav';

export const ImportPage = () => {
  const { id } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<any[] | null>(null);

  const navigate = useNavigate();

  const handleFileUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupId', id || 'demo-group-id');

    try {
      const res = await api.post('/imports/upload', formData);

      // Fetch the full execution report
      const reportRes = await api.get(`/imports/${res.data.importJobId}/report`);
      setReport(reportRes.data);

    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      <TopNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <button
          onClick={() => navigate(`/groups/${id}`)}
          className="text-[10px] font-bold text-[#4f46e5] uppercase tracking-wider mb-6 flex items-center hover:text-[#4338ca]"
        >
          <ChevronLeft className="w-3 h-3 mr-1" /> Back to Group Details
        </button>

        <div className="border-b border-gray-200 pb-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-1">CSV Data Importer</h1>
          <p className="text-sm text-gray-400">Upload, paste, or trigger auto-import of expense ledger datasets.</p>
        </div>

        {/* 2 Column Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Left Column: Uploaders */}
          <div className="w-full md:w-1/3 space-y-6">

            <div className="border border-gray-200 p-6 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center mb-3">
                <FileText className="w-4 h-4 mr-2 text-[#4f46e5]" /> Workspace File Import
              </h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">Directly parse the Expenses Export.csv file located in the project's root folder.</p>
              <button className="w-full bg-[#1f2937] text-white font-bold text-xs py-3 uppercase tracking-wider hover:bg-black transition-colors">
                Run Auto-Import
              </button>
            </div>

            <div className="border border-gray-200 p-6">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center mb-6">
                <Upload className="w-4 h-4 mr-2 text-[#4f46e5]" /> Manual Upload
              </h3>

              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2">Upload CSV File</label>
              <div className="flex items-center space-x-3 mb-6">
                <label className="border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 uppercase tracking-wider">
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  Choose File
                </label>
                <span className="text-xs text-gray-500 italic truncate w-32">{file ? file.name : 'Expenses Export.csv'}</span>
              </div>

              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2">Or Paste Raw CSV Content</label>
              <textarea
                className="w-full border border-gray-200 p-3 text-xs text-gray-500 mb-6 focus:outline-none focus:border-[#4f46e5] font-mono h-24 whitespace-pre"
                placeholder="date,description,paid_by,amount,currency,split_type,split_with,split_details,notes&#10;01-02-2026,February rent,Aisha,48000,INR,equal,Aisha;Rohan;Priya;Meera,,"
              />

              <button
                onClick={handleFileUpload}
                disabled={!file || isUploading}
                className={`w-full font-bold text-xs py-3 uppercase tracking-wider transition-colors ${file && !isUploading ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' : 'bg-[#4f46e5] text-white hover:bg-[#4338ca]'
                  }`}
              >
                {isUploading ? 'Analyzing...' : 'Import Data'}
              </button>
            </div>

          </div>

          {/* Right Column: Report / Anomaly */}
          <div className="w-full md:w-2/3">
            <div className="flex items-center mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mr-4">
                IMPORT EXECUTION REPORT
              </h3>
              {report && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                  COMPLETED
                </span>
              )}
            </div>

            <div className="border-t border-gray-200 w-full mb-4"></div>

            {!report ? (
              <div className="bg-gray-50 p-12 text-center border border-gray-100 flex items-center justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  No active import run to display. Run an import on the left to see parsing details.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 bg-white">
                {/* Header Row */}
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-900">Total Rows Processed: {report.length}</p>
                </div>

                {/* Table Headers */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                  <div className="col-span-1 text-center">Row</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-4">Logged Issues / Flags</div>
                  <div className="col-span-5">Actions Applied</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {report.map((r, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 text-xs items-center hover:bg-gray-50">
                      <div className="col-span-1 text-center font-bold text-gray-900">{r.rowNumber}</div>

                      <div className="col-span-2 flex items-center font-bold uppercase text-[10px] tracking-wider">
                        {r.status === 'SUCCESS' ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> SUCCESS
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> REVIEW
                          </span>
                        )}
                      </div>

                      <div className="col-span-4 font-bold text-red-600">
                        {r.issues}
                      </div>

                      <div className="col-span-5 text-gray-600">
                        {r.actionsApplied}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};
