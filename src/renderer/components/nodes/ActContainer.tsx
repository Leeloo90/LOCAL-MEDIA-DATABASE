import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface ActContainerData {
  act_id: number;
  name: string;
  scene_count: number;
  spine_count: number;
  satellite_count: number;
  estimated_runtime: number; // in seconds
  transcript_preview?: string;
}

/**
 * ActContainer: Top-level container for organizing story structure
 *
 * Design Philosophy:
 * - Large bounding box that contains scenes
 * - Summary card showing metadata
 * - Double-click to drill into act (isolation mode)
 * - Visual distinction from regular nodes
 */
export const ActContainer: React.FC<NodeProps<ActContainerData>> = ({ data, selected }) => {
  const formatRuntime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`act-container relative bg-gradient-to-br from-indigo-950/30 to-indigo-900/20 border-2 rounded-xl transition-all ${
        selected
          ? 'border-indigo-400 shadow-2xl shadow-indigo-900/50 ring-2 ring-indigo-400/30'
          : 'border-indigo-800/40 hover:border-indigo-600/60'
      }`}
      style={{
        minWidth: '800px',
        minHeight: '600px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-500 !w-4 !h-4 !border-2 !border-indigo-300"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-r from-indigo-950/80 to-indigo-900/80 backdrop-blur-sm border-b border-indigo-800/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-indigo-400"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-indigo-300 uppercase tracking-wider">
                {data.name}
              </h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">
                Act Container
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-black">Runtime</div>
              <div className="text-lg font-mono text-indigo-400 font-bold">
                {formatRuntime(data.estimated_runtime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Card */}
      <div className="absolute top-24 left-6 bg-black/60 backdrop-blur-md border border-indigo-800/50 rounded-lg p-4 max-w-sm">
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-black text-indigo-400">{data.scene_count}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mt-1">
              Scenes
            </div>
          </div>
          <div className="text-center border-x border-indigo-900/50">
            <div className="text-2xl font-black text-indigo-400">{data.spine_count}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mt-1">
              Spine Nodes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-purple-400">{data.satellite_count}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mt-1">
              Satellites
            </div>
          </div>
        </div>

        {/* Transcript Preview */}
        {data.transcript_preview && (
          <div className="pt-3 border-t border-indigo-900/50">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mb-2">
              Transcript Preview
            </div>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
              {data.transcript_preview}
            </p>
          </div>
        )}

        {/* Double-click hint */}
        <div className="mt-3 pt-3 border-t border-indigo-900/50 flex items-center gap-2 text-indigo-500/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m8 12 2 2 4-4" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">
            Double-click to enter
          </span>
        </div>
      </div>

      {/* Container Content Area (where scenes would appear) */}
      <div className="absolute inset-0 top-20 p-6 pointer-events-none">
        {/* This space will contain scene containers when in isolation mode */}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-500 !w-4 !h-4 !border-2 !border-indigo-300"
      />
    </div>
  );
};
