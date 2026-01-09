import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface SatelliteNodeData {
  file_name: string;
  start_tc: string;
  end_tc: string;
  asset_id: number;
  duration_seconds?: number;
  anchor_word_index?: number; // Which word in the spine transcript this covers
  visual_tags?: string[];
  is_enabled?: boolean;
}

/**
 * SatelliteNode: Visual B-Roll that orbits the Spine.
 *
 * Design Philosophy:
 * - 16:9 aspect ratio thumbnail
 * - Compact, floating above the spine
 * - Shows visual anchor line to spine (handled by edges)
 * - Represents coverage footage
 */
export const SatelliteNode: React.FC<NodeProps<SatelliteNodeData>> = ({ data, selected }) => {
  const isEnabled = data.is_enabled !== false; // Default to enabled if not specified

  return (
    <div
      className={`satellite-node relative rounded-lg overflow-hidden border-2 transition-all ${
        isEnabled
          ? selected
            ? 'border-purple-400 shadow-xl shadow-purple-900/50 ring-2 ring-purple-400/30'
            : 'border-purple-700/50 hover:border-purple-500/70'
          : 'border-gray-700/30 opacity-40'
      }`}
      style={{
        width: '240px' // Fixed width for consistent 16:9 aspect
      }}
    >
      {/* Disabled Overlay */}
      {!isEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg pointer-events-none z-10">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-red-950/90 border border-red-800/50 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-400"
            >
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
            <span className="text-[10px] font-black text-red-300 uppercase tracking-wider">Disabled</span>
          </div>
        </div>
      )}
      {/* Top Handle - For anchoring to spine nodes */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-purple-300"
      />

      {/* Left Handle - For chaining satellites (input) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-purple-300"
        style={{ top: '50%' }}
      />

      {/* Right Handle - For chaining satellites (output) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-purple-300"
        style={{ top: '50%' }}
      />

      {/* Video Thumbnail Area (16:9 aspect ratio) */}
      <div className="aspect-video bg-black relative flex items-center justify-center">
        {/* Placeholder for video thumbnail */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gray-700"
        >
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
          <rect x="2" y="6" width="14" height="12" rx="2"/>
        </svg>

        {/* Timecode Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 rounded">
          <span className="text-[8px] font-mono text-purple-400">{data.start_tc}</span>
        </div>

        {/* Duration Badge */}
        {data.duration_seconds && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 rounded">
            <span className="text-[8px] font-mono text-gray-400">
              {data.duration_seconds.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="px-2 py-1.5 bg-gradient-to-r from-purple-950/80 to-purple-900/80">
        <p className="text-[9px] font-medium text-gray-200 truncate">
          {data.file_name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[7px] font-black text-purple-400 uppercase tracking-wider">
            B-Roll
          </span>
          {data.visual_tags && data.visual_tags.length > 0 && (
            <div className="flex gap-1">
              {data.visual_tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="px-1 py-0.5 bg-purple-800/40 text-purple-300 rounded text-[7px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-purple-300"
      />
    </div>
  );
};
