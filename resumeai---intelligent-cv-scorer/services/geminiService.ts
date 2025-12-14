import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, JobListing, JobMatch, CandidateProfile, MatchBreakdown, InterviewQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Score 0-100" },
    candidateName: { type: Type.STRING },
    roleDetected: { type: Type.STRING },
    isTechRole: { type: Type.BOOLEAN, description: "True if role is software, data, or engineering related" },
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    categoryBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
        },
        required: ["category", "score", "reasoning"],
      },
    },
  },
  required: ["overallScore", "candidateName", "roleDetected", "isTechRole", "summary", "strengths", "weaknesses", "keySkills", "categoryBreakdown"],
};

interface ProfileLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export const analyzeCandidateProfile = async (file: File | null, links: ProfileLinks): Promise<AnalysisResult> => {
  try {
    // CASE 1: File provided. Use precise Schema generation with PDF context.
    if (file) {
      const base64Data = await fileToBase64(file);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            {
              text: `You are an expert technical recruiter. Review the resume.
              ${links.github ? `Also consider their GitHub: ${links.github}` : ''}
              ${links.portfolio ? `Also consider their Portfolio: ${links.portfolio}` : ''}
              ${links.linkedin ? `Also consider their LinkedIn: ${links.linkedin}` : ''}
              
              Identify target role, score it (0-100), and extract key skills/strengths/weaknesses.
              Determine if this is a technical role (software, data, engineering) -> isTechRole.
              Strict JSON output. Categories for breakdown: 'Impact', 'Skills', 'Experience', 'Clarity'.`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text) as AnalysisResult;
    } 
    
    // CASE 2: No file. Use Google Search grounding to analyze URLs.
    else {
      const prompt = `You are an expert technical recruiter. 
      Analyze the candidate based on the following online profiles:
      ${links.github ? `- GitHub: ${links.github}` : ''}
      ${links.portfolio ? `- Portfolio: ${links.portfolio}` : ''}
      ${links.linkedin ? `- LinkedIn: ${links.linkedin}` : ''}
      
      Use Google Search to gather information about these profiles and the candidate's public work.
      
      Generate a structured candidate analysis in JSON format with the following fields:
      - overallScore (number 0-100)
      - candidateName (string, infer from profiles)
      - roleDetected (string)
      - isTechRole (boolean)
      - summary (string)
      - strengths (string array)
      - weaknesses (string array)
      - keySkills (string array)
      - categoryBreakdown (array of objects with category, score, reasoning). Categories: 'Impact', 'Skills', 'Experience', 'Clarity'.

      Return ONLY valid JSON. Do not use Markdown code blocks.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }] },
        config: {
          tools: [{ googleSearch: {} }],
          // responseSchema is NOT supported with googleSearch in this SDK version/model combo safely,
          // so we parse manually.
        }
      });

      let text = response.text;
      if (!text) throw new Error("No response from AI");
      
      // cleanup markdown if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text) as AnalysisResult;
    }
  } catch (error) {
    console.error("Error analyzing candidate:", error);
    throw error;
  }
};

const breakdownSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    jobId: { type: Type.STRING },
    score: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    aspects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          aspect: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['match', 'missing', 'partial'] },
          source: { type: Type.STRING, enum: ['Resume', 'GitHub', 'LinkedIn', 'Portfolio', 'Unknown', 'None'] },
          context: { type: Type.STRING }
        },
        required: ['aspect', 'status', 'source', 'context']
      }
    }
  },
  required: ['jobId', 'score', 'summary', 'aspects']
};

export const generateMatchBreakdown = async (profile: CandidateProfile, job: JobListing): Promise<MatchBreakdown> => {
  try {
    const profileContext = {
      resumeSkills: profile.resumeData.keySkills,
      resumeSummary: profile.resumeData.summary,
      resumeRole: profile.resumeData.roleDetected,
      hasLinkedIn: !!profile.linkedInUrl,
      hasPortfolio: !!profile.portfolioUrl,
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{
          text: `You are a career coach and technical recruiter. 
          Analyze the match between this candidate and this job listing in detail.
          
          Candidate Data: ${JSON.stringify(profileContext)}
          
          Job Listing: ${JSON.stringify(job)}
          
          Task:
          1. Calculate a precise match score.
          2. Identify key aspects (skills, requirements, experience).
          3. For each aspect, determine if it is a 'match', 'missing', or 'partial'.
          4. CRITICAL: Identify the SOURCE of the evidence for matches. 
             - If found in parsed resume data, source is 'Resume'.
             - If likely inferred from LinkedIn/Portfolio presence mentioned in inputs, source is 'LinkedIn' or 'Portfolio'.
             - If missing, source is 'None'.
          
          Return strict JSON.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: breakdownSchema,
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response for match breakdown");
    return JSON.parse(text) as MatchBreakdown;

  } catch (error) {
    console.error("Error generating match breakdown:", error);
    throw error;
  }
};

/**
 * REPLACEMENT: Instead of shallow ranking, this now performs DEEP analysis for ALL jobs.
 * This ensures "View Analysis" is instant.
 */
export const rankJobsForCandidate = async (profile: CandidateProfile, jobs: JobListing[]): Promise<JobMatch[]> => {
  if (jobs.length === 0) return [];

  // Parallel execution of deep analysis for all jobs
  const matchPromises = jobs.map(async (job) => {
    try {
      const breakdown = await generateMatchBreakdown(profile, job);
      return {
        jobId: job.id,
        matchScore: breakdown.score,
        reasoning: breakdown.summary,
        analysisType: 'detailed',
        breakdown: breakdown
      } as JobMatch;
    } catch (e) {
      console.error(`Failed to analyze match for job ${job.id}`, e);
      // Return a failed match object to not break the Promise.all
      return {
        jobId: job.id,
        matchScore: 0,
        reasoning: "Analysis temporarily unavailable",
        analysisType: 'detailed'
      } as JobMatch;
    }
  });

  return Promise.all(matchPromises);
};

// NEW: Question Generation
export const generateApplicationQuestions = async (profile: CandidateProfile, job: JobListing): Promise<InterviewQuestion[]> => {
  try {
    const context = {
      skills: profile.resumeData.keySkills,
    };

    const prompt = `
      You are a Senior Tech Lead conducting a screening interview.
      Generate 3 specific interview questions for this candidate applying to this job.

      Job Title: ${job.title}
      Requirements: ${job.requirements.join(', ')}

      Candidate Context:
      - Skills: ${context.skills.join(', ')}

      Rules:
      1. Questions must be challenging and technical.
      2. Tailor questions based on the intersection of the candidate's skills and the job requirements.
         Example: "You listed [Skill A] on your resume. How would you use it to solve [Job Requirement B]?"
      3. Do not ask generic HR questions like "What is your weakness?".

      Return JSON array of objects: { id, question, context, type (technical/architectural/behavioral) }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              context: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['technical', 'architectural', 'behavioral'] }
            },
            required: ['id', 'question', 'context', 'type']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No questions generated");
    return JSON.parse(text) as InterviewQuestion[];

  } catch (error) {
    console.error("Error generating questions:", error);
    // Fallback questions if AI fails
    return [
      { id: '1', question: "Describe a challenging technical problem you solved recently.", context: "General Technical", type: "technical" },
      { id: '2', question: `How would you apply your experience with ${job.requirements[0] || 'technology'} to this role?`, context: "Role Alignment", type: "behavioral" }
    ];
  }
};