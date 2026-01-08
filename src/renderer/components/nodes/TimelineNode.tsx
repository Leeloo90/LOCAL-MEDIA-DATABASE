import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface TimelineNodeData {
  speaker_label: string;
  content: string;
  start_tc: string;
  end_tc: string;
  asset_id: number;
}

export const TimelineNode: React.FC<NodeProps<TimelineNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-xl rounded-md bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 transition-all ${
        selected ? 'border-indigo-400 shadow-indigo-500/50' : 'border-indigo-700/50'
      }`}
      style={{ minWidth: '220px', maxWidth: '320px' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-indigo-500 border-2 border-indigo-300"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
          {data.speaker_label}
        </span>
        <span className="px-2 py-0.5 bg-purple-800/50 text-purple-300 rounded text-[8px] font-bold uppercase">
          Trimmed
        </span>
      </div>

      {/* Timecode Range */}
      <div className="mb-2 pb-2 border-b border-indigo-800/50">
        <p className="text-[9px] text-gray-400 font-mono">
          {data.start_tc} → {data.end_tc}
        </p>
      </div>

      {/* Content Preview */}
      <div className="text-xs text-gray-200 leading-relaxed line-clamp-3">
        {data.content}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-indigo-300"
      />
    </div>
  );
};
