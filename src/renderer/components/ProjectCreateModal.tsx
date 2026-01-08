import React, { useState } from 'react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate(name.trim(), {
      description: description.trim() || undefined,
      fps: parseFloat(fps),
      resolution,
      client: client.trim() || undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setFps('23.976');
    setResolution('3840x2160');
    setClient('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Create New Project</h2>
          <p className="text-xs text-gray-500 mt-1">Set up a new production workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Feature Film 2024, Client Campaign"
              className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project details..."
              rows={3}
              className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Technical Settings */}
          <div className="grid grid-cols-2 gap-4">
            {/* Frame Rate */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Frame Rate
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="23.976">23.976 fps (Film)</option>
                <option value="24">24 fps</option>
                <option value="25">25 fps (PAL)</option>
                <option value="29.97">29.97 fps (NTSC)</option>
                <option value="30">30 fps</option>
                <option value="50">50 fps</option>
                <option value="59.94">59.94 fps</option>
                <option value="60">60 fps</option>
              </select>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="3840x2160">4K UHD (3840×2160)</option>
                <option value="4096x2160">4K DCI (4096×2160)</option>
                <option value="1920x1080">Full HD (1920×1080)</option>
                <option value="1280x720">HD (1280×720)</option>
                <option value="2560x1440">2K QHD (2560×1440)</option>
              </select>
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Client
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Optional client name"
              className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
