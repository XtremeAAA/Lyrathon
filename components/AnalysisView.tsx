import React from 'react';
import { AnalysisResult } from '../types';
import ScoreChart from './ScoreChart';
import { CheckCircle2, XCircle, Briefcase, User, Lightbulb, ChevronRight, Zap } from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset }) => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Info */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 break-words">
            <User className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <span className="truncate">{result.candidateName || "Candidate"}</span>
          </h2>
          <div className="flex items-start gap-2 text-slate-500 mt-1">
            <Briefcase className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="break-words leading-snug">
              Target Role: <span className="font-medium text-slate-700">{result.roleDetected}</span>
            </span>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 whitespace-nowrap self-start md:self-center"
        >
          Analyze Another Resume
        </button>
      </div>

      {/* Visual Charts */}
      <ScoreChart score={result.overallScore} categories={result.categoryBreakdown} />

      {/* Skills Section - Moved to Full Width */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500 flex-shrink-0" />
          Identified Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.keySkills.map((skill, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 break-words hover:bg-slate-100 transition-colors">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Summary & Deep Dive */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          
          {/* Executive Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
              Executive Summary
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base break-words">
              {result.summary}
            </p>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-6">
              <h3 className="text-md font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                Key Strengths
              </h3>
              <ul className="space-y-3">
                {result.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className="min-w-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-700 break-words">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50/50 rounded-xl border border-red-100 p-6">
              <h3 className="text-md font-semibold text-red-800 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {result.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className="min-w-1.5 w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-700 break-words">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Category Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Detailed Breakdown</h3>
            <div className="divide-y divide-slate-100">
              {result.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="font-medium text-slate-700 break-words">{cat.category}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                      cat.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      cat.score >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {cat.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 break-words">{cat.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: CTA / Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white sticky top-24">
            <h3 className="font-semibold text-lg mb-2">Recommendation</h3>
            <p className="text-blue-100 text-sm mb-6 break-words">
              {result.overallScore >= 80 
                ? "This candidate is a strong match. We recommend proceeding to a screening interview immediately." 
                : result.overallScore >= 60
                ? "This candidate has potential but has some gaps. Consider a technical screen to verify depth."
                : "This candidate does not appear to meet the core requirements for this level."}
            </p>
            <button className="w-full bg-white text-blue-600 py-3 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 shadow-sm">
              {result.overallScore >= 60 ? "Schedule Interview" : "Archive Candidate"}
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;