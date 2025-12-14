import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import CreateJob from './components/CreateJob';
import JobCard from './components/JobCard';
import JobMatchModal from './components/JobMatchModal';
import ApplicationModal from './components/ApplicationModal';
import { AnalysisResult, ProcessingState, JobListing, CandidateProfile, JobMatch, MatchBreakdown, InterviewQuestion } from './types';
import { analyzeCandidateProfile, rankJobsForCandidate, generateMatchBreakdown, generateApplicationQuestions } from './services/geminiService';
import { AlertCircle, Briefcase, UserCircle, Plus, Sparkles, LayoutGrid, Loader2 } from 'lucide-react';

// Dummy Initial Jobs
const INITIAL_JOBS: JobListing[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'TechFlow',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are looking for a React expert to lead our frontend team. You will be building complex data visualization dashboards.',
    requirements: ['React', 'TypeScript', 'D3.js', '5+ years exp'],
    postedAt: new Date(Date.now() - 86400000 * 2)
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'InnovateCorp',
    location: 'New York, NY',
    type: 'Full-time',
    description: 'Lead the roadmap for our core consumer product. You must have experience in B2C markets and data-driven decision making.',
    requirements: ['Product Strategy', 'SQL', 'User Research', 'Agile'],
    postedAt: new Date(Date.now() - 86400000 * 5)
  },
  {
    id: '3',
    title: 'Junior Backend Developer',
    company: 'StartupX',
    location: 'San Francisco, CA',
    type: 'Contract',
    description: 'Help us scale our Node.js API. Great opportunity for someone looking to learn from senior engineers.',
    requirements: ['Node.js', 'PostgreSQL', 'AWS', '1-2 years exp'],
    postedAt: new Date(Date.now() - 86400000 * 1)
  },
  {
    id: '4',
    title: 'Customer Success Specialist',
    company: 'CloudScale',
    location: 'Remote',
    type: 'Full-time',
    description: 'Join our award-winning support team. You will handle tickets, live chat, and ensure our customers succeed with our platform.',
    requirements: ['Excellent Communication', 'Zendesk', 'Empathy', '2+ years support exp'],
    postedAt: new Date(Date.now() - 86400000 * 3)
  },
  {
    id: '5',
    title: 'Administrative Assistant',
    company: 'BrightStar Health',
    location: 'Chicago, IL',
    type: 'Part-time',
    description: 'Organized individual needed to manage scheduling, filing, and general office duties for a busy medical practice.',
    requirements: ['Organization', 'Microsoft Office', 'Scheduling', 'Reliable'],
    postedAt: new Date(Date.now() - 86400000 * 4)
  }
];

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'candidate' | 'recruiter'>('candidate');
  const [showCreateJob, setShowCreateJob] = useState(false);

  // Data State
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  
  // Analysis State for Modal
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [matchBreakdown, setMatchBreakdown] = useState<MatchBreakdown | null>(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);

  // Application Modal State
  const [applicationJob, setApplicationJob] = useState<JobListing | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // UI State - Input Form
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extraInfo, setExtraInfo] = useState({ linkedIn: '', github: '', portfolio: '', experience: '' });
  
  // Processing States
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });

  // Handle new job creation
  const handleJobCreated = (job: JobListing) => {
    setJobs([job, ...jobs]);
    setShowCreateJob(false);
  };

  // Main Analysis Handler
  const handleAnalyzeCandidate = async () => {
    if (!resumeFile && !extraInfo.github && !extraInfo.portfolio && !extraInfo.linkedIn) {
      setProcessingState({ status: 'error', message: 'Please upload a resume OR provide a profile URL.' });
      return;
    }

    setProcessingState({ status: 'analyzing' });
    
    try {
      // Step 1: Analyze Profile (from File OR URLs)
      const data = await analyzeCandidateProfile(resumeFile, {
        github: extraInfo.github,
        linkedin: extraInfo.linkedIn,
        portfolio: extraInfo.portfolio
      });
      
      const profile: CandidateProfile = {
        resumeData: data,
        linkedInUrl: extraInfo.linkedIn,
        githubUrl: extraInfo.github,
        portfolioUrl: extraInfo.portfolio,
        yearsExperience: parseInt(extraInfo.experience) || 0
      };
      
      setCandidateProfile(profile);
      
      // Step 2: Trigger Deep Dive matching for all jobs
      setProcessingState({ status: 'matching' });
      // This now returns full deep analysis for every job
      const matches = await rankJobsForCandidate(profile, jobs);
      setJobMatches(matches);
      
      setProcessingState({ status: 'success' });
    } catch (error: any) {
      console.error(error);
      setProcessingState({ 
        status: 'error', 
        message: error.message || "An unexpected error occurred during analysis." 
      });
    }
  };

  const handleReset = () => {
    setProcessingState({ status: 'idle' });
    setCandidateProfile(null);
    setJobMatches([]);
    setResumeFile(null);
    setExtraInfo({ linkedIn: '', github: '', portfolio: '', experience: '' });
  };

  const handleViewJobDetails = async (job: JobListing) => {
    setSelectedJob(job);
    setMatchBreakdown(null); 
    
    if (!candidateProfile) {
      alert("Please upload a resume first to see match analysis.");
      return;
    }

    // Check if we already have the detailed breakdown (which we should now)
    const existingMatch = jobMatches.find(m => m.jobId === job.id);
    
    if (existingMatch && existingMatch.breakdown) {
      setMatchBreakdown(existingMatch.breakdown);
      return; // Instant load, no API call
    }

    // Fallback in case of error or missing data
    setAnalyzingMatch(true);
    try {
      const breakdown = await generateMatchBreakdown(candidateProfile, job);
      setMatchBreakdown(breakdown);
    } catch (error) {
      console.error("Failed to analyze match", error);
    } finally {
      setAnalyzingMatch(false);
    }
  };

  const handleStartApplication = async (job: JobListing) => {
    if (!candidateProfile) return;
    
    // Close detail modal, open application modal
    setSelectedJob(null);
    setApplicationJob(job);
    setLoadingQuestions(true);
    
    try {
       const questions = await generateApplicationQuestions(candidateProfile, job);
       setGeneratedQuestions(questions);
    } catch (error) {
       console.error("Failed to generate questions", error);
    } finally {
       setLoadingQuestions(false);
    }
  };

  // Sort jobs: If we have matches, put high scores first. Otherwise by date.
  const sortedJobs = React.useMemo(() => {
    if (jobMatches.length === 0) return jobs;
    
    return [...jobs].sort((a, b) => {
      const matchA = jobMatches.find(m => m.jobId === a.id)?.matchScore || 0;
      const matchB = jobMatches.find(m => m.jobId === b.id)?.matchScore || 0;
      return matchB - matchA;
    });
  }, [jobs, jobMatches]);

  const isAnalyzeDisabled = !resumeFile && !extraInfo.github && !extraInfo.portfolio && !extraInfo.linkedIn;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 -mb-px">
            <button 
              onClick={() => setView('candidate')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${view === 'candidate' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <UserCircle className="w-5 h-5" />
              For Candidates
            </button>
            <button 
              onClick={() => setView('recruiter')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${view === 'recruiter' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <Briefcase className="w-5 h-5" />
              For Recruiters
            </button>
          </div>
        </div>
      </div>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* RECRUITER VIEW */}
        {view === 'recruiter' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Manage Job Listings</h2>
                <p className="text-slate-500">Post jobs and find the perfect talent.</p>
              </div>
              <button 
                onClick={() => setShowCreateJob(!showCreateJob)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                {showCreateJob ? 'Cancel' : (
                  <>
                    <Plus className="w-4 h-4" />
                    Post New Job
                  </>
                )}
              </button>
            </div>

            {showCreateJob && (
              <CreateJob 
                onJobCreated={handleJobCreated} 
                onCancel={() => setShowCreateJob(false)} 
              />
            )}

            <div className="grid grid-cols-1 gap-4">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* CANDIDATE VIEW */}
        {view === 'candidate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            
            {/* LEFT SIDEBAR: PROFILE & UPLOAD */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  Your Profile
                </h2>
                
                {!candidateProfile ? (
                  <>
                    <p className="text-sm text-slate-500 mb-4">
                      Add your sources to unlock AI-powered analysis. You can upload a resume, provide links, or both.
                    </p>
                    
                    {/* Resume Upload */}
                    <div className="mb-6">
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Source 1: Resume File</label>
                       <FileUpload 
                         selectedFile={resumeFile}
                         onFileChange={setResumeFile}
                       />
                    </div>

                    {/* Extra Fields Form */}
                    <div className="space-y-3 mb-6">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Source 2: Online Profiles</label>
                      <input 
                        type="text" 
                        placeholder="GitHub URL" 
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        value={extraInfo.github}
                        onChange={(e) => setExtraInfo({...extraInfo, github: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Portfolio URL" 
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        value={extraInfo.portfolio}
                        onChange={(e) => setExtraInfo({...extraInfo, portfolio: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="LinkedIn URL" 
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        value={extraInfo.linkedIn}
                        onChange={(e) => setExtraInfo({...extraInfo, linkedIn: e.target.value})}
                      />
                       <input 
                        type="number" 
                        placeholder="Years of Experience (Optional)" 
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        value={extraInfo.experience}
                        onChange={(e) => setExtraInfo({...extraInfo, experience: e.target.value})}
                      />
                    </div>

                    {/* Main Action Button */}
                    <button
                      onClick={handleAnalyzeCandidate}
                      disabled={isAnalyzeDisabled || processingState.status === 'analyzing' || processingState.status === 'matching'}
                      className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
                        ${isAnalyzeDisabled || processingState.status !== 'idle' && processingState.status !== 'error'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                        }
                      `}
                    >
                      {processingState.status === 'analyzing' || processingState.status === 'matching' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {processingState.status === 'analyzing' 
                             ? 'Analyzing Profile...' 
                             : 'Running Deep Match...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Analyze Candidate
                        </>
                      )}
                    </button>

                    {processingState.status === 'error' && (
                       <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                         <AlertCircle className="w-4 h-4 mt-0.5" />
                         {processingState.message}
                       </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                        {candidateProfile.resumeData.overallScore}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{candidateProfile.resumeData.candidateName}</p>
                        <p className="text-xs text-slate-500">{candidateProfile.resumeData.roleDetected}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Top Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {candidateProfile.resumeData.keySkills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <button 
                        onClick={() => {}} // Placeholder for detailed view toggle
                        className="flex-1 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100"
                      >
                        View Analysis
                      </button>
                      <button 
                        onClick={handleReset}
                        className="px-3 py-2 bg-slate-50 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show Analysis Details Below Profile if exists */}
              {candidateProfile && (
                 <div className="hidden lg:block">
                    <AnalysisView 
                      result={candidateProfile.resumeData} 
                      onReset={() => {}} 
                    /> 
                 </div>
              )}
            </div>

            {/* RIGHT MAIN: JOB BOARD */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                   <LayoutGrid className="w-6 h-6 text-slate-700" />
                   Available Opportunities
                 </h2>
                 {jobMatches.length > 0 && (
                   <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                     <Sparkles className="w-4 h-4" />
                     {jobMatches.length} AI Matches Found
                   </span>
                 )}
              </div>

              <div className="space-y-4">
                {sortedJobs.map(job => {
                   const match = jobMatches.find(m => m.jobId === job.id);
                   return (
                     <JobCard 
                       key={job.id} 
                       job={job} 
                       match={match} 
                       onApply={() => handleViewJobDetails(job)} 
                     />
                   );
                })}
                
                {jobs.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">No jobs posted yet.</p>
                  </div>
                )}
              </div>
              
              {/* Mobile Only: Analysis View at bottom */}
              {candidateProfile && (
                 <div className="lg:hidden mt-8">
                    <AnalysisView 
                      result={candidateProfile.resumeData} 
                      onReset={() => {}} 
                    /> 
                 </div>
              )}
            </div>

          </div>
        )}
        
        {/* Detail Modal */}
        {selectedJob && (
          <JobMatchModal 
            isOpen={!!selectedJob}
            onClose={() => setSelectedJob(null)}
            job={selectedJob}
            breakdown={matchBreakdown}
            isLoading={analyzingMatch}
            onApply={() => handleStartApplication(selectedJob)}
          />
        )}
        
        {/* Application Questionnaire Modal */}
        {applicationJob && (
          <ApplicationModal 
            isOpen={!!applicationJob}
            onClose={() => setApplicationJob(null)}
            job={applicationJob}
            questions={generatedQuestions}
            isLoadingQuestions={loadingQuestions}
          />
        )}

      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            ResumeAI &copy; {new Date().getFullYear()}. Built with Gemini 2.5 Flash.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;