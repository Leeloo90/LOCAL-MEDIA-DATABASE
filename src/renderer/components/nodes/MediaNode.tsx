import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MediaType } from '../../types';

interface MediaNodeData {
  label: string;
  status: MediaType;
  duration?: string;
  hasTranscript?: boolean;
}

export const MediaNode: React.FC<NodeProps<MediaNodeData>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-xl rounded-md bg-[#1a1a1a] border-2 min-w-[200px] transition-all ${
      selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-[#333] hover:border-indigo-400'
    }`}>
      {/* Target Handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-indigo-500 border-2 border-[#1a1a1a]"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
            data.status === MediaType.DIALOGUE
              ? 'bg-green-900/40 text-green-400 border border-green-800'
              : 'bg-gray-800 text-gray-400 border border-gray-700'
          }`}>
            {data.status}
          </span>
          {data.hasTranscript && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-indigo-400"
            >
              <path d="M17 6.1H3"/>
              <path d="M21 12.1H3"/>
              <path d="M15.1 18H3"/>
            </svg>
          )}
        </div>

        <div className="text-[11px] font-bold text-gray-200 truncate" title={data.label}>
          {data.label}
        </div>

        {data.duration && (
          <div className="text-[9px] font-mono text-gray-500">
            {data.duration}
          </div>
        )}
      </div>

      {/* Source Handle (Output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-indigo-500 border-2 border-[#1a1a1a]"
      />
    </div>
  );
};
