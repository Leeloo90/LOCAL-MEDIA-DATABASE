import React from 'react';

interface CanvasMenuBarProps {
  linkModeEnabled: boolean;
  onToggleLinkMode: () => void;
  bucketVisible: boolean;
  onToggleBucket: () => void;
  onCreateScene: () => void;
  onCreateAct: () => void;
  hasSelection: boolean;
  zoomLevel: 'project' | 'act' | 'scene';
}

/**
 * CanvasMenuBar: Top menu bar for canvas with toggles and actions
 */
export const CanvasMenuBar: React.FC<CanvasMenuBarProps> = ({
  linkModeEnabled,
  onToggleLinkMode,
  bucketVisible,
  onToggleBucket,
  onCreateScene,
  onCreateAct,
  hasSelection,
  zoomLevel,
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-[#121212]/95 backdrop-blur-md border border-[#2a2a2a] rounded-lg shadow-2xl px-4 py-2 flex items-center gap-4">
      {/* Toggles Section */}
      <div className="flex items-center gap-2 pr-4 border-r border-[#2a2a2a]">
        {/* Link Mode Toggle */}
        <button
          onClick={onToggleLinkMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
            linkModeEnabled
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-300'
          }`}
          title={linkModeEnabled ? 'Link mode: Moving nodes moves connected nodes' : 'Link mode: Move nodes independently'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {linkModeEnabled ? (
              <>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </>
            ) : (
              <>
                <path d="M18.84 12.25 20 11l-8.5-8.5a2 2 0 0 0-3 3l8.5 8.5" />
                <path d="M5.16 11.75 4 13l8.5 8.5a2 2 0 0 0 3-3l-8.5-8.5" />
              </>
            )}
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">
            {linkModeEnabled ? 'Linked' : 'Unlinked'}
          </span>
        </button>

        {/* Bucket Toggle */}
        <button
          onClick={onToggleBucket}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
            bucketVisible
              ? 'bg-amber-600 text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-300'
          }`}
          title={bucketVisible ? 'Hide bucket sidebar' : 'Show bucket sidebar'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">
            Bucket
          </span>
        </button>
      </div>

      {/* Create Container Buttons */}
      <div className="flex items-center gap-2">
        {/* Create Scene Button - Always visible */}
        <button
          onClick={onCreateScene}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Create a new Scene container"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="12" y1="9" x2="12" y2="15" />
            <line x1="15" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">New Scene</span>
        </button>

        {/* Create Act Button - Only visible at project level */}
        {zoomLevel === 'project' && (
          <button
            onClick={onCreateAct}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            title="Create a new Act container"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="12" y1="7" x2="12" y2="17" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">New Act</span>
          </button>
        )}
      </div>

      {/* Selection Info */}
      {hasSelection && (
        <div className="pl-4 border-l border-[#2a2a2a] text-xs text-gray-400">
          <span className="font-medium">Right-click selection to group</span>
        </div>
      )}
    </div>
  );
};
