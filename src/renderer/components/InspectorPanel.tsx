import React, { useState } from 'react';
import { MediaAsset, TranscriptSegment, MediaType } from '../types';
import { SpeakerRenameModal } from './SpeakerRenameModal';

interface InspectorPanelProps {
  asset: MediaAsset | null;
  segments: TranscriptSegment[];
  onSegmentsUpdate: () => void;
  onSegmentHighlight: (segment: TranscriptSegment) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ 
  asset, 
  segments, 
  onSegmentsUpdate, 
  onSegmentHighlight 
}) => {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Extract unique speaker names for the rename utility
  const uniqueSpeakers = Array.from(new Set(segments.map(s => s.speaker_label)));

  const handleRenameSpeaker = async (assetId: number, oldName: string, newName: string) => {
    if (window.electronAPI) {
      await window.electronAPI.db.renameSpeaker(assetId, oldName, newName);
      onSegmentsUpdate();
    }
  };

  /**
   * DRAG START: Editorial Selection Payload
   * Allows dragging a segment directly onto the Story Canvas to create a TimelineNode.
   */
  const onSegmentDragStart = (event: React.DragEvent, segment: TranscriptSegment) => {
    const trimPayload = {
      type: 'TRANSCRIPT_TRIM',
      asset_id: segment.asset_id,
      start_tc: segment.time_in,
      end_tc: segment.time_out,
      content: segment.content,
      speaker_label: segment.speaker_label,
      word_map: segment.word_map 
    };
    
    // Using the 'application/storygraph' key which StoryCanvas.tsx listens for
    event.dataTransfer.setData('application/storygraph', JSON.stringify(trimPayload));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!asset) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 bg-[#121212] border-l border-[#2a2a2a]">
        <div className="text-center px-10">
          <svg className="mx-auto mb-4 opacity-10" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Inspector Idle</p>
          <p className="text-[11px] mt-2 leading-relaxed max-w-[180px] mx-auto opacity-40 uppercase tracking-tight font-medium">
            Select an asset from the project library to view technical specs and transcripts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#121212] border-l border-[#2a2a2a] overflow-hidden">
      {/* Header: Asset Identification */}
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] shrink-0 z-10">
        <div className="flex items-center justify-between mb-2">
           <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Metadata Inspector</h2>
           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
              asset.type === MediaType.DIALOGUE 
                ? 'bg-green-900/20 text-green-400 border-green-800/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                : 'bg-gray-800/40 text-gray-500 border-gray-700/50'
            }`}>
              {asset.type}
            </span>
        </div>
        <h3 className="text-sm font-bold text-gray-100 truncate italic select-all" title={asset.file_name}>
          {asset.file_name}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Section: Technical Forensic Metadata */}
        <section className="p-4 border-b border-[#2a2a2a]">
          <h4 className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4 opacity-50">Technical Readout</h4>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div>
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">Start Timecode</p>
              <p className="text-[12px] font-mono text-indigo-300 mt-0.5 tracking-tighter">{asset.start_tc}</p>
            </div>
            <div>
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">Frame Rate</p>
              <p className="text-[12px] font-mono text-gray-300 mt-0.5 tracking-tighter">{asset.fps}</p>
            </div>
            <div>
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">Resolution</p>
              <p className="text-[12px] font-mono text-gray-300 mt-0.5 tracking-tighter">{asset.resolution}</p>
            </div>
            <div>
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">Total Frames</p>
              <p className="text-[12px] font-mono text-gray-300 mt-0.5 tracking-tighter">{asset.duration_frames.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
             <p className="text-[8px] text-gray-600 font-black uppercase mb-1 tracking-tighter">System File Path</p>
             <p className="text-[9px] font-mono text-gray-500 leading-tight break-all bg-[#0c0c0c] p-2 rounded border border-[#1a1a1a] select-all">
               {asset.file_path}
             </p>
          </div>
        </section>

        {/* Section: Transcript Analysis */}
        <section className="p-4 bg-[#121212]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[9px] text-gray-500 font-bold uppercase tracking-widest opacity-50">Transcripts</h4>
            {segments.length > 0 && (
              <button
                onClick={() => setIsRenameModalOpen(true)}
                className="text-[9px] font-black text-indigo-400 hover:text-white transition-all uppercase tracking-tighter bg-indigo-950/20 px-2 py-1 rounded border border-indigo-900/30 hover:border-indigo-500"
              >
                Rename Speakers
              </button>
            )}
          </div>

          {segments.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center bg-[#0c0c0c]/50 rounded-lg border border-dashed border-[#2a2a2a]">
              <p className="text-[10px] text-gray-500 px-6 font-medium leading-relaxed uppercase tracking-tight">
                No transcript link. <br/>Match an <span className="text-indigo-400 font-mono italic">.srtx</span> to enable precision assembly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {segments.map((segment) => (
                <div key={segment.segment_id} className="group animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">
                      {segment.speaker_label}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onSegmentHighlight(segment)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-[8px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-500 rounded shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
                      >
                        Precision Highlight
                      </button>
                      <span className="text-[9px] font-mono text-gray-600 group-hover:text-gray-400 transition-colors tracking-tighter">
                        {segment.time_in}
                      </span>
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => onSegmentDragStart(e, segment)}
                    className="p-3 bg-[#1a1a1a] rounded-md border border-[#2a2a2a] group-hover:border-indigo-500/50 group-hover:bg-[#1f1f1f] transition-all shadow-sm cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                    {/* Visual indicator of draggable segment */}
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <p className="text-[12px] text-gray-300 leading-relaxed selection:bg-indigo-500/30">
                      {segment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Speaker Rename Utility */}
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