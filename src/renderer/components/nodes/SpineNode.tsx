import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface SpineNodeData {
  speaker_label: string;
  content: string;
  start_tc: string;
  end_tc: string;
  asset_id: number;
  duration_seconds?: number;
  sequence_order?: number;
  is_enabled?: boolean;
}

/**
 * SpineNode: The horizontal "truth floor" audio backbone of the story.
 *
 * Design Philosophy:
 * - Horizontal layout (width proportional to duration)
 * - Fixed height for consistent spine alignment
 * - Transcript text visible for satellite anchoring
 * - Forms the left-to-right narrative sequence
 */
export const SpineNode: React.FC<NodeProps<SpineNodeData>> = ({ data, selected }) => {
  const isEnabled = data.is_enabled !== false; // Default to enabled if not specified
  // Calculate width based on duration (fallback to content length if no duration)
  const estimatedDuration = data.duration_seconds || (data.content.split(' ').length * 0.5);
  const nodeWidth = Math.max(200, Math.min(600, estimatedDuration * 40)); // 40px per second, min 200, max 600

  return (
    <div
      className={`spine-node relative bg-gradient-to-r rounded-lg transition-all ${
        isEnabled
          ? `from-indigo-900/60 to-indigo-800/60 border-2 ${
              selected ? 'border-indigo-400 shadow-xl shadow-indigo-900/50' : 'border-indigo-700/50'
            }`
          : 'from-gray-900/40 to-gray-800/40 border-2 border-gray-700/30 opacity-40'
      }`}
      style={{
        width: `${nodeWidth}px`,
        minHeight: '80px',
        maxHeight: '120px'
      }}
    >
      {/* Disabled Overlay */}
      {!isEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg pointer-events-none z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-800/50 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <span className="text-xs font-black text-red-300 uppercase tracking-wider">Disabled</span>
          </div>
        </div>
      )}
      {/* Left Handle - For spine sequence flow */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-indigo-300"
      />

      {/* Top Handle - For satellite node anchoring */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-purple-300"
      />

      {/* Header: Speaker & Timecode */}
      <div className="px-3 py-2 border-b border-indigo-800/50 bg-indigo-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
              {data.speaker_label}
            </span>
          </div>
          <span className="text-[8px] text-gray-500 font-mono">
            {data.start_tc}
          </span>
        </div>
      </div>

      {/* Body: Transcript Content (The "Truth Floor") */}
      <div className="px-3 py-2 overflow-hidden">
        <p className="text-xs text-gray-200 leading-relaxed line-clamp-3 font-medium">
          {data.content}
        </p>
      </div>

      {/* Visual Indicator: This is a SPINE node */}
      <div className="absolute bottom-1 right-2">
        <span className="px-1.5 py-0.5 bg-indigo-600/80 text-indigo-200 rounded text-[7px] font-black uppercase">
          Spine
        </span>
      </div>

      {/* Right Handle - For spine sequence continuation */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-indigo-300"
      />
    </div>
  );
};
