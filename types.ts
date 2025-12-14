export interface CategoryScore {
  category: string;
  score: number; // 0-100
  reasoning: string;
}

export interface AnalysisResult {
  overallScore: number; // 0-100
  candidateName: string;
  roleDetected: string;
  isTechRole: boolean; // True if software/engineering related
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keySkills: string[];
  categoryBreakdown: CategoryScore[];
}

export interface ProcessingState {
  status: 'idle' | 'analyzing' | 'matching' | 'success' | 'error';
  message?: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string; // Full-time, Contract, etc.
  description: string;
  requirements: string[];
  postedAt: Date;
}

export interface CandidateProfile {
  resumeData: AnalysisResult;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsExperience?: number;
}

export interface MatchAspect {
  aspect: string;
  status: 'match' | 'missing' | 'partial';
  source: 'Resume' | 'GitHub' | 'LinkedIn' | 'Portfolio' | 'Unknown' | 'None';
  context: string;
}

export interface MatchBreakdown {
  jobId: string;
  score: number;
  summary: string;
  aspects: MatchAspect[];
}

export interface JobMatch {
  jobId: string;
  matchScore: number; // 0-100
  reasoning: string;
  analysisType?: 'preliminary' | 'detailed'; // Track the depth of the analysis
  breakdown?: MatchBreakdown; // Full detailed breakdown available upfront
}

export interface InterviewQuestion {
  id: string;
  question: string;
  context: string; // Explains why this question was asked (e.g. "Based on your use of React in project X")
  type: 'technical' | 'architectural' | 'behavioral';
}