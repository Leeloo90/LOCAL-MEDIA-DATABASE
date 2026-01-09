import React, { useState } from 'react';

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  canvasId: number;
  canvasName: string;
  onClose: () => void;
  onRename: (canvasId: number, newName: string) => void;
  onDelete: (canvasId: number) => void;
}

/**
 * CanvasContextMenu: Right-click context menu for canvas items
 * Provides options to rename or delete a canvas
 */
export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  isOpen,
  position,
  canvasId,
  canvasName,
  onClose,
  onRename,
  onDelete,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(canvasName);

  if (!isOpen) return null;

  const handleRenameClick = () => {
    setIsRenaming(true);
    setNewName(canvasName);
  };

  const handleRenameConfirm = () => {
    if (newName.trim() && newName !== canvasName) {
      onRename(canvasId, newName.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewName(canvasName);
  };

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete "${canvasName}"?`)) {
      onDelete(canvasId);
      onClose();
    }
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
        className="fixed z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl py-1 min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {isRenaming ? (
          /* Rename Input */
          <div className="px-3 py-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') handleRenameCancel();
              }}
              className="w-full px-2 py-1 bg-[#0c0c0c] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-indigo-500"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleRenameConfirm}
                className="flex-1 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={handleRenameCancel}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] text-gray-300 text-xs rounded hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Rename Option */}
            <button
              onClick={handleRenameClick}
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
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </div>
              <span className="font-medium">Rename Canvas</span>
            </button>

            {/* Delete Option */}
            <button
              onClick={handleDeleteClick}
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
                  className="text-red-400"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <span className="font-medium">Delete Canvas</span>
            </button>

            <div className="h-px bg-[#333] my-1" />

            <div className="px-4 py-2">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider font-black">
                Canvas ID
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                {canvasId}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
