import React from 'react';
import { JobListing, JobMatch } from '../types';
import { Building2, MapPin, CheckCircle, Clock, Sparkles, ScanSearch } from 'lucide-react';

interface JobCardProps {
  job: JobListing;
  match?: JobMatch;
  onApply?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, match, onApply }) => {
  const isDetailed = match?.analysisType === 'detailed';

  return (
    <div className={`bg-white rounded-xl p-6 border transition-all duration-200 ${match && match.matchScore > 75 ? 'border-emerald-200 shadow-md ring-1 ring-emerald-100' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-slate-900 break-words leading-tight">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-slate-500 text-sm mt-1">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{job.company}</span>
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{job.location}</span>
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600 whitespace-nowrap">{job.type}</span>
              </div>
            </div>
            
            {match && (
              <div className={`flex flex-col items-end flex-shrink-0 pl-2`}>
                <div className={`text-2xl font-bold ${match.matchScore >= 80 ? 'text-emerald-600' : match.matchScore >= 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {match.matchScore}%
                </div>
                <div className="flex items-center gap-1">
                   {isDetailed && <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                   <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide whitespace-nowrap ${isDetailed ? 'text-blue-600' : 'text-slate-400'}`}>
                     {isDetailed ? 'Verified' : 'Match'}
                   </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-slate-600 text-sm line-clamp-2 break-words">{job.description}</p>
          </div>

          {match && (
             <div className={`mt-3 p-3 rounded-lg border ${isDetailed ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
               <p className="text-xs text-slate-700 italic break-words">
                 <span className={`font-semibold not-italic mr-1 inline-flex items-center gap-1 ${isDetailed ? 'text-blue-700' : 'text-slate-500'}`}>
                   {isDetailed ? <Sparkles className="w-3 h-3 flex-shrink-0" /> : <ScanSearch className="w-3 h-3 flex-shrink-0" />}
                   <span className="whitespace-nowrap">{isDetailed ? 'Deep Analysis:' : 'Preliminary Scan:'}</span>
                 </span> 
                 {match.reasoning}
               </p>
             </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {job.requirements.slice(0, 3).map((req, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium max-w-full">
                <CheckCircle className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{req}</span>
              </span>
            ))}
            {job.requirements.length > 3 && (
               <span className="inline-flex items-center px-2 py-1 text-xs text-slate-400 whitespace-nowrap">
                 +{job.requirements.length - 3} more
               </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
        </div>
        <button 
          onClick={onApply}
          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto text-center"
        >
          View Analysis & Apply
        </button>
      </div>
    </div>
  );
};

export default JobCard;