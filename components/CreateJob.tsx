import React, { useState } from 'react';
import { JobListing } from '../types';
import { PlusCircle, Save } from 'lucide-react';

interface CreateJobProps {
  onJobCreated: (job: JobListing) => void;
  onCancel: () => void;
}

const CreateJob: React.FC<CreateJobProps> = ({ onJobCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirementsString: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: JobListing = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      company: formData.company,
      location: formData.location,
      type: formData.type,
      description: formData.description,
      requirements: formData.requirementsString.split(',').map(s => s.trim()).filter(Boolean),
      postedAt: new Date()
    };
    onJobCreated(newJob);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <PlusCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Post a New Job</h2>
          <p className="text-sm text-slate-500">Create a listing for candidates to match with.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Senior Product Designer"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Acme Inc."
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Remote, New York, NY"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Freelance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            required
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Describe the role responsibilities and team culture..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Key Requirements (Comma separated)</label>
          <input
            required
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. React, TypeScript, 5+ years experience, Leadership"
            value={formData.requirementsString}
            onChange={e => setFormData({...formData, requirementsString: e.target.value})}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            Post Job
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;
