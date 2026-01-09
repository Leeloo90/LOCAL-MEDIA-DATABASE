import React, { useState, useEffect } from 'react';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, options: { description?: string; fps?: number; resolution?: string; client?: string }) => void;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fps, setFps] = useState('23.976');
  const [resolution, setResolution] = useState('3840x2160');
  const [client, setClient] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setFps('23.976');
      setResolution('3840x2160');
      setClient('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate(name.trim(), {
      description: description.trim() || undefined,
      fps: parseFloat(fps),
      resolution,
      client: client.trim() || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2a2a2a] bg-[#1a1a1a]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create New Project</h2>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">Production Configuration</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form id="project-form" onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
              Project Name <span className="text-indigo-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Campaign 2024"
              className="w-full px-4 py-2.5 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes regarding the production workflow..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-700"
            />
          </div>

          {/* Technical Settings */}
          <div className="grid grid-cols-2 gap-4">
            {/* Frame Rate */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                Timebase (FPS)
              </label>
              <div className="relative">
                <select
                  value={fps}
                  onChange={(e) => setFps(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm appearance-none focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="23.976">23.976 fps</option>
                  <option value="24">24.00 fps</option>
                  <option value="25">25.00 fps (PAL)</option>
                  <option value="29.97">29.97 fps (NTSC)</option>
                  <option value="30">30.00 fps</option>
                  <option value="48">48.00 fps</option>
                  <option value="50">50.00 fps</option>
                  <option value="59.94">59.94 fps</option>
                  <option value="60">60.00 fps</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                Target Resolution
              </label>
              <div className="relative">
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm appearance-none focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="3840x2160">4K UHD (3840×2160)</option>
                  <option value="4096x2160">4K DCI (4096×2160)</option>
                  <option value="1920x1080">1080p HD (1920×1080)</option>
                  <option value="1280x720">720p HD (1280×720)</option>
                  <option value="2048x1080">2K DCI (2048×1080)</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
              Client / Account
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g., Internal, Netflix, Apple"
              className="w-full px-4 py-2.5 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-700"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#2a2a2a] bg-[#1a1a1a]/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={!name.trim()}
            className="px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            Initialize Project
          </button>
        </div>
      </div>
    </div>
  );
};