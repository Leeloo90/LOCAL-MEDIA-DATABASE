import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface SceneContainerData {
  scene_id: number;
  name: string;
  spine_count: number;
  satellite_count: number;
  estimated_runtime: number; // in seconds
  transcript_preview?: string;
}

/**
 * SceneContainer: Mid-level container within acts
 *
 * Design Philosophy:
 * - Medium bounding box that contains spine/satellite nodes
 * - Summary card showing metadata
 * - Double-click to drill into scene (isolation mode)
 * - Purple theme to distinguish from acts
 */
export const SceneContainer: React.FC<NodeProps<SceneContainerData>> = ({ data, selected }) => {
  const formatRuntime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`scene-container relative bg-gradient-to-br from-purple-950/30 to-purple-900/20 border-2 rounded-lg transition-all ${
        selected
          ? 'border-purple-400 shadow-2xl shadow-purple-900/50 ring-2 ring-purple-400/30'
          : 'border-purple-800/40 hover:border-purple-600/60'
      }`}
      style={{
        minWidth: '600px',
        minHeight: '400px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-purple-300"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-5 py-3 bg-gradient-to-r from-purple-950/80 to-purple-900/80 backdrop-blur-sm border-b border-purple-800/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-purple-600/30 border border-purple-500/50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-purple-400"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider">
                {data.name}
              </h3>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mt-0.5">
                Scene Container
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black">Runtime</div>
            <div className="text-base font-mono text-purple-400 font-bold">
              {formatRuntime(data.estimated_runtime)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Card */}
      <div className="absolute top-20 left-5 bg-black/60 backdrop-blur-md border border-purple-800/50 rounded-lg p-3 max-w-xs">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <div className="text-xl font-black text-indigo-400">{data.spine_count}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mt-1">
              Spine Nodes
            </div>
          </div>
          <div className="text-center border-l border-purple-900/50">
            <div className="text-xl font-black text-purple-400">{data.satellite_count}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mt-1">
              Satellites
            </div>
          </div>
        </div>

        {/* Transcript Preview */}
        {data.transcript_preview && (
          <div className="pt-2 border-t border-purple-900/50">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mb-1.5">
              Transcript Preview
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
              {data.transcript_preview}
            </p>
          </div>
        )}

        {/* Double-click hint */}
        <div className="mt-2 pt-2 border-t border-purple-900/50 flex items-center gap-2 text-purple-500/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m8 12 2 2 4-4" />
          </svg>
          <span className="text-[8px] font-bold uppercase tracking-wider">
            Double-click to enter
          </span>
        </div>
      </div>

      {/* Container Content Area (where nodes would appear) */}
      <div className="absolute inset-0 top-16 p-5 pointer-events-none">
        {/* This space will contain spine/satellite nodes when in isolation mode */}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-purple-300"
      />
    </div>
  );
};
