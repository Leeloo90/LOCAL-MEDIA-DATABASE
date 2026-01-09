import React, { useState, useCallback } from 'react';
import { TranscriptSegment } from '../types';

interface WordHighlighterModalProps {
  segment: TranscriptSegment;
  onConfirm: (trim: { text: string; start_tc: string; end_tc: string }) => void;
  onClose: () => void;
}

interface WordMapEntry {
  word: string;
  in: string;
  out: string;
}

export const WordHighlighterModal: React.FC<WordHighlighterModalProps> = ({ segment, onConfirm, onClose }) => {
  // Parse the word_map: [{word: string, in: string, out: string}]
  const wordData: WordMapEntry[] = JSON.parse(segment.word_map || '[]');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Selection Logic:
   * Professional editors expect continuous ranges. This logic ensures that 
   * clicking a start and end word fills in the middle.
   */
  const handleWordClick = (index: number) => {
    if (selectedIndices.length === 0) {
      setSelectedIndices([index]);
    } else {
      const start = Math.min(selectedIndices[0], index);
      const end = Math.max(selectedIndices[selectedIndices.length - 1], index);
      const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedIndices(range);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging) {
      handleWordClick(index);
    }
  };

  const handleConfirm = () => {
    if (selectedIndices.length === 0) return;
    
    const firstWord = wordData[Math.min(...selectedIndices)];
    const lastWord = wordData[Math.max(...selectedIndices)];
    const selectedText = selectedIndices
      .sort((a, b) => a - b)
      .map(i => wordData[i].word)
      .join(' ');

    onConfirm({
      text: selectedText,
      start_tc: firstWord.in, // Exact word-start timecode from JSON
      end_tc: lastWord.out    // Exact word-end timecode from JSON
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200"
      onMouseUp={() => setIsDragging(false)}
    >
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl w-full max-w-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h3 className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em]">Precision Trim Editor</h3>
            <p className="text-gray-500 text-[11px] mt-1 italic">Click or drag to define the exact word-level timecode window.</p>
          </div>
          <div className="text-right">
            <span className="text-gray-600 text-[9px] font-mono uppercase tracking-widest block">Speaker</span>
            <span className="text-indigo-300 text-xs font-bold">{segment.speaker_label}</span>
          </div>
        </div>

        {/* Word Selection Grid */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0c] rounded-lg border border-[#2a2a2a] p-8"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {wordData.map((w, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                  handleWordClick(i);
                }}
                onMouseEnter={() => handleMouseEnter(i)}
                className={`px-2 py-1 rounded text-sm font-medium transition-all duration-75 select-none ${
                  selectedIndices.includes(i) 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 translate-y-[-1px]' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
                }`}
              >
                {w.word}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="mt-8 pt-6 border-t border-[#2a2a2a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[8px] font-black text-gray-600 uppercase mb-1">In Point</p>
              <p className="text-[11px] font-mono text-indigo-400">
                {selectedIndices.length > 0 ? wordData[Math.min(...selectedIndices)].in : '--:--:--:--'}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Out Point</p>
              <p className="text-[11px] font-mono text-indigo-400">
                {selectedIndices.length > 0 ? wordData[Math.max(...selectedIndices)].out : '--:--:--:--'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedIndices.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
            >
              Commit Trim to Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};