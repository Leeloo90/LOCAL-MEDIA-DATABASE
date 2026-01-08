
import React, { useState } from 'react';
import { MediaAsset, TranscriptSegment, MediaType } from '../types';
import { SpeakerRenameModal } from './SpeakerRenameModal';

interface InspectorPanelProps {
  asset: MediaAsset | null;
  segments: TranscriptSegment[];
  onSegmentsUpdate: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ asset, segments, onSegmentsUpdate }) => {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Extract unique speaker names from segments
  const uniqueSpeakers = Array.from(new Set(segments.map(s => s.speaker_label)));

  const handleRenameSpeaker = async (assetId: number, oldName: string, newName: string) => {
    if (window.electronAPI) {
      await window.electronAPI.db.renameSpeaker(assetId, oldName, newName);
      onSegmentsUpdate();
    }
  };

  const onSegmentDragStart = (event: React.DragEvent, segment: TranscriptSegment) => {
    // TRIM-BASED DRAG: Package timecode window + text content for editorial precision
    const trimPayload = {
      type: 'TRANSCRIPT_TRIM',
      asset_id: segment.asset_id,
      start_tc: segment.time_in,  // Specific In point for XML export
      end_tc: segment.time_out,    // Specific Out point for XML export
      content: segment.content,
      speaker_label: segment.speaker_label,
      word_map: segment.word_map
    };
    event.dataTransfer.setData('application/storygraph', JSON.stringify(trimPayload));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!asset) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 bg-[#121212] border-l border-[#2a2a2a]">
        <div className="text-center px-10">
          <svg className="mx-auto mb-4 opacity-20" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-sm font-medium">No Selection</p>
          <p className="text-xs mt-1">Select a media file from the pool to view metadata and transcripts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#121212] border-l border-[#2a2a2a] overflow-hidden">
      {/* Header Info */}
      <div className="p-4 border-b border-[#2a2a2a] shrink-0">
        <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Inspector</h2>
        <h3 className="text-sm font-semibold text-gray-100 truncate">{asset.file_name}</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Technical Metadata Section */}
        <section className="p-4 border-b border-[#2a2a2a]">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Technical Metadata
          </h4>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <p className="text-[9px] text-gray-500 font-medium">START TC</p>
              <p className="text-[13px] font-mono text-gray-200 mt-0.5">{asset.start_tc}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-medium">FPS</p>
              <p className="text-[13px] font-mono text-gray-200 mt-0.5">{asset.fps}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-medium">RESOLUTION</p>
              <p className="text-[13px] font-mono text-gray-200 mt-0.5">{asset.metadata.resolution}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-medium">DURATION (F)</p>
              <p className="text-[13px] font-mono text-gray-200 mt-0.5">{asset.duration_frames.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
             <p className="text-[9px] text-gray-500 font-medium">FILE PATH</p>
             <p className="text-[10px] font-mono text-gray-400 mt-1 break-all bg-[#0c0c0c] p-2 rounded">{asset.file_path}</p>
          </div>
        </section>

        {/* Transcript Section */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
              Transcript Segments
            </h4>
            <div className="flex items-center gap-2">
              {segments.length > 0 && (
                <button
                  onClick={() => setIsRenameModalOpen(true)}
                  className="px-2 py-1 text-[9px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-900/50 rounded transition-colors"
                  title="Rename speakers"
                >
                  Edit Speakers
                </button>
              )}
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                asset.type === MediaType.DIALOGUE ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                {asset.type}
              </span>
            </div>
          </div>

          {segments.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-600 bg-[#0c0c0c]/50 rounded-lg border border-dashed border-[#2a2a2a]">
              <p className="text-[11px]">No transcript data available.</p>
              <p className="text-[9px] mt-1 italic">Use "Match Transcripts" to link .srtx files.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment) => (
                <div
                  key={segment.segment_id}
                  draggable
                  onDragStart={(e) => onSegmentDragStart(e, segment)}
                  className="group cursor-move"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-400">
                      {segment.speaker_label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-300">
                      {segment.time_in} - {segment.time_out}
                    </span>
                  </div>
                  <div className="p-3 bg-[#1a1a1a] rounded-md border border-[#2a2a2a] group-hover:border-[#3a3a3a] transition-colors shadow-sm">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {segment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Speaker Rename Modal */}
      {asset && (
        <SpeakerRenameModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          assetId={asset.asset_id}
          speakers={uniqueSpeakers}
          onRename={handleRenameSpeaker}
        />
      )}
    </div>
  );
};
