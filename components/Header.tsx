import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ResumeAI</h1>
            <p className="text-xs text-slate-500 font-medium">Recruiter Intelligence Tool</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Powered by Gemini 2.5</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
