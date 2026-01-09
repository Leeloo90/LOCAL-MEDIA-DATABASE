import React from 'react';

interface SelectionContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  selectionCount: number;
  onClose: () => void;
  onCreateScene: () => void;
  onCreateAct: () => void;
  zoomLevel: 'project' | 'act' | 'scene';
}

/**
 * SelectionContextMenu: Right-click context menu for selected nodes
 * Provides options to group selected nodes into containers
 */
export const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  isOpen,
  position,
  selectionCount,
  onClose,
  onCreateScene,
  onCreateAct,
  zoomLevel,
}) => {
  if (!isOpen) return null;

  const handleCreateScene = () => {
    onCreateScene();
    onClose();
  };

  const handleCreateAct = () => {
    onCreateAct();
    onClose();
  };

  return (
    <>
      {/* Backdrop to detect outside clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl py-1 min-w-[220px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-[#333]">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-black">
            {selectionCount} Node{selectionCount !== 1 ? 's' : ''} Selected
          </div>
        </div>

        {/* Create Scene Option */}
        <button
          onClick={handleCreateScene}
          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-purple-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </div>
          <span className="font-medium">Group as Scene</span>
        </button>

        {/* Create Act Option - Only at project level */}
        {zoomLevel === 'project' && (
          <button
            onClick={handleCreateAct}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-400"
              >
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
              </svg>
            </div>
            <span className="font-medium">Group as Act</span>
          </button>
        )}
      </div>
    </>
  );
};
