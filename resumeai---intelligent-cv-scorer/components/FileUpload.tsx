import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ selectedFile, onFileChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }
    onFileChange(file);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer group
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleChange}
          />
          <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Upload Resume (PDF)</h3>
          <p className="text-slate-500 mt-1 text-xs">Drag & drop or click to browse</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
              <FileIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="font-semibold text-slate-900 text-sm truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            onClick={clearFile}
            className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
