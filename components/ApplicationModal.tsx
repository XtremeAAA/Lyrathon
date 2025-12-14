import React, { useState } from 'react';
import { JobListing, InterviewQuestion } from '../types';
import { X, Send, BrainCircuit, Github, Code2, Loader2 } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing;
  questions: InterviewQuestion[];
  isLoadingQuestions: boolean;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ 
  isOpen, 
  onClose, 
  job, 
  questions, 
  isLoadingQuestions 
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Sent!</h3>
          <p className="text-slate-600 mb-6">
            Your answers have been submitted directly to the hiring team. Good luck!
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Technical Screening</h3>
            <p className="text-sm text-slate-500">Application for {job.title} at {job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isLoadingQuestions ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-slate-900">Generating Technical Questions...</p>
                <p className="text-sm text-slate-500 mt-1">Analyzing your GitHub repos against job requirements.</p>
              </div>
            </div>
          ) : (
            <form id="app-form" onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
                <BrainCircuit className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  These questions are AI-generated based on the specific technologies in your GitHub repositories 
                  and how they relate to the requirements of this role.
                </p>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-lg leading-snug mb-2">{q.question}</h4>
                      
                      {/* Context Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                          {q.type === 'technical' && <Code2 className="w-3 h-3" />}
                          {q.context}
                        </span>
                        {q.question.includes('GitHub') || q.question.includes('repo') ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                            <Github className="w-3 h-3" />
                            Repo Reference
                          </span>
                        ) : null}
                      </div>

                      <textarea
                        required
                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 min-h-[120px] resize-y text-sm leading-relaxed"
                        placeholder="Type your answer here..."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="app-form"
            disabled={isLoadingQuestions || isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Submit Application
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;