import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

// Defining the data structure expected by this node
export type TimelineNodeData = {
  speaker_label: string;
  content: string;
  start_tc: string;
  end_tc: string;
  asset_id: number;
};

// Wrapping custom data in XYFlow Node type for strict typing
export type TimelineNodeProps = Node<TimelineNodeData, 'timelineNode'>;

export const TimelineNode: React.FC<NodeProps<TimelineNodeProps>> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-xl rounded-md bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 transition-all ${
        selected ? 'border-indigo-400 shadow-indigo-500/50' : 'border-indigo-700/50'
      }`}
      style={{ minWidth: '220px', maxWidth: '320px' }}
    >
      {/* Target Handle (Input Connection) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-indigo-500 border-2 border-indigo-300"
        style={{ left: '-7px' }}
      />

      {/* Header: Speaker and Trim Status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider truncate mr-2">
          {data.speaker_label}
        </span>
        <span className="shrink-0 px-2 py-0.5 bg-purple-800/50 text-purple-300 rounded text-[8px] font-bold uppercase border border-purple-700/50">
          Trimmed
        </span>
      </div>

      {/* Timecode Range: Precision Word-Level Window */}
      <div className="mb-2 pb-2 border-b border-indigo-800/50">
        <p className="text-[9px] text-gray-300 font-mono tracking-tighter">
          {data.start_tc} <span className="text-indigo-500 mx-1">→</span> {data.end_tc}
        </p>
      </div>

      {/* Content Preview: Selected Transcript Text */}
      <div className="text-xs text-gray-200 leading-relaxed line-clamp-4 italic">
        "{data.content}"
      </div>

      {/* Source Handle (Output Connection) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-indigo-300"
        style={{ right: '-7px' }}
      />
    </div>
  );
};