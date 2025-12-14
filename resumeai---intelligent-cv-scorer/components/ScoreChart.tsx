import React from 'react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  PolarAngleAxis,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarRadiusAxis,
  Tooltip
} from 'recharts';
import { CategoryScore } from '../types';

interface ScoreChartProps {
  score: number;
  categories: CategoryScore[];
}

const ScoreChart: React.FC<ScoreChartProps> = ({ score, categories }) => {
  // Data for the radial score
  const scoreData = [
    { name: 'Score', value: score, fill: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }
  ];

  // Data for Radar Chart - Normalize categories for the chart
  const radarData = categories.map(c => ({
    subject: c.category,
    A: c.score,
    fullMark: 100
  }));

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-600";
    if (s >= 60) return "text-amber-600";
    return "text-red-600";
  }

  const getScoreLabel = (s: number) => {
    if (s >= 90) return "Exceptional";
    if (s >= 80) return "Strong Match";
    if (s >= 70) return "Good";
    if (s >= 50) return "Average";
    return "Needs Improvement";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Overall Score Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-700 w-full text-center mb-2">Overall Match Score</h3>
        <div className="relative w-full h-[220px] sm:h-[250px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                innerRadius="70%" 
                outerRadius="100%" 
                barSize={20} 
                data={scoreData} 
                startAngle={90} 
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
              <span className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter ${getScoreColor(score)}`}>
                {score}
              </span>
              <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider mt-1 text-center max-w-[120px] ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </span>
            </div>
        </div>
      </div>

      {/* Category Radar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-slate-700 w-full text-center mb-4">Category Breakdown</h3>
        <div className="w-full h-[220px] sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Score"
                dataKey="A"
                stroke="#2563eb"
                strokeWidth={3}
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ScoreChart;