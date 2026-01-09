import React, { useState, useEffect } from 'react';

interface ContainerNameDialogProps {
  isOpen: boolean;
  containerType: 'scene' | 'act';
  onConfirm: (name: string, description?: string) => void;
  onCancel: () => void;
}

/**
 * ContainerNameDialog: Modal for naming a new Scene or Act container
 */
export const ContainerNameDialog: React.FC<ContainerNameDialogProps> = ({
  isOpen,
  containerType,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim(), description.trim() || undefined);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-6 w-[400px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-white mb-4">
            Create {containerType === 'scene' ? 'Scene' : 'Act'}
          </h2>

          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="text-sm text-gray-400 font-medium">
                {containerType === 'scene' ? 'Scene' : 'Act'} Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${containerType} name...`}
                className="w-full mt-1 px-3 py-2 bg-[#0c0c0c] border border-[#333] rounded text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm text-gray-400 font-medium">
                Description (Optional)
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-[#0c0c0c] border border-[#333] rounded text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </label>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
