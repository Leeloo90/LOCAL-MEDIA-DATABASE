import React, { useState, useEffect } from 'react';

interface SpeakerRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: number;
  speakers: string[];
  onRename: (assetId: number, oldName: string, newName: string) => Promise<void>;
}

export const SpeakerRenameModal: React.FC<SpeakerRenameModalProps> = ({
  isOpen,
  onClose,
  assetId,
  speakers,
  onRename
}) => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && speakers.length > 0) {
      setSelectedSpeaker(speakers[0]);
      setNewName('');
    }
  }, [isOpen, speakers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpeaker || !newName.trim() || selectedSpeaker === newName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(assetId, selectedSpeaker, newName.trim());
      onClose();
    } catch (error) {
      console.error('Failed to rename speaker:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-gray-100">Rename Speaker</h3>
          <p className="text-xs text-gray-500 mt-1">
            Change speaker label across all segments for this asset
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Speaker Selection */}
          <div>
            <label className="block text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wider">
              Select Speaker to Rename
            </label>
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {speakers.map((speaker) => (
                <option key={speaker} value={speaker}>
                  {speaker}
                </option>
              ))}
            </select>
          </div>

          {/* New Name Input */}
          <div>
            <label className="block text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wider">
              New Speaker Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name..."
              className="w-full bg-[#0c0c0c] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#0c0c0c] border border-[#2a2a2a] rounded text-sm text-gray-300 hover:bg-[#1a1a1a] hover:border-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim() || selectedSpeaker === newName.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 rounded text-sm text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Renaming...' : 'Rename Speaker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
