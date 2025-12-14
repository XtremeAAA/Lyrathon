import React from 'react';
import { MatchBreakdown, JobListing } from '../types';
import { X, CheckCircle, XCircle, AlertCircle, FileText, Github, Linkedin, Briefcase, HelpCircle } from 'lucide-react';

interface JobMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing;
  breakdown: MatchBreakdown | null;
  isLoading: boolean;
  onApply: () => void;
}

const JobMatchModal: React.FC<JobMatchModalProps> = ({ isOpen, onClose, job, breakdown, isLoading, onApply }) => {
  if (!isOpen) return null;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'GitHub': return <Github className="w-3 h-3 text-slate-700" />;
      case 'LinkedIn': return <Linkedin className="w-3 h-3 text-blue-700" />;
      case 'Resume': return <FileText className="w-3 h-3 text-emerald-600" />;
      case 'Portfolio': return <Briefcase className="w-3 h-3 text-purple-600" />;
      default: return <HelpCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'match': return 'bg-emerald-50 border-emerald-100 text-emerald-800';
      case 'missing': return 'bg-red-50 border-red-100 text-red-800';
      case 'partial': return 'bg-amber-50 border-amber-100 text-amber-800';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'missing': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-slate-900 break-words leading-tight">{job.title}</h3>
            <p className="text-slate-500 text-sm mt-1 break-words">{job.company} • {job.location}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Analyzing profile match details...</p>
            </div>
          ) : breakdown ? (
            <div className="space-y-6">
              
              {/* Score & Summary */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-xl font-bold bg-white text-slate-800">
                      {breakdown.score}%
                    </div>
                 </div>
                 <div className="text-center sm:text-left min-w-0 flex-1">
                   <h4 className="font-semibold text-slate-900 mb-1">Match Analysis</h4>
                   <p className="text-sm text-slate-600 leading-relaxed break-words">{breakdown.summary}</p>
                 </div>
              </div>

              {/* Detailed Aspects */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Detailed Breakdown</h4>
                <div className="space-y-3">
                  {breakdown.aspects.map((aspect, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${getStatusColor(aspect.status)} flex items-start gap-3`}>
                      <div className="mt-0.5 flex-shrink-0">
                        {getStatusIcon(aspect.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm break-words leading-snug">{aspect.aspect}</span>
                          
                          {/* Source Badge */}
                          {aspect.source !== 'None' && (
                             <div className="flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full text-xs font-medium border border-black/5 flex-shrink-0">
                               {getSourceIcon(aspect.source)}
                               <span>{aspect.source}</span>
                             </div>
                          )}
                        </div>
                        <p className="text-xs opacity-90 break-words leading-relaxed">{aspect.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Could not load analysis. Please try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
          >
            Close
          </button>
          <button 
            onClick={onApply}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all order-1 sm:order-2"
          >
            Apply for Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobMatchModal;