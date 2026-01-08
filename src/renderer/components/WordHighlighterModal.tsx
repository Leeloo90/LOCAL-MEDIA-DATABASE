import React, { useState } from 'react';
import { TranscriptSegment } from '../types';

interface WordHighlighterModalProps {
  segment: TranscriptSegment;
  onConfirm: (trim: { text: string; start_tc: string; end_tc: string }) => void;
  onClose: () => void;
}

export const WordHighlighterModal: React.FC<WordHighlighterModalProps> = ({ segment, onConfirm, onClose }) => {
  // Parse the word_map which contains [{word: string, in: string, out: string}]
  const wordData = JSON.parse(segment.word_map || '[]');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleConfirm = () => {
    if (selectedIndices.length === 0) return;
    
    const firstWord = wordData[selectedIndices[0]];
    const lastWord = wordData[selectedIndices[selectedIndices.length - 1]];
    const selectedText = selectedIndices.map(i => wordData[i].word).join(' ');

    onConfirm({
      text: selectedText,
      start_tc: firstWord.in, // Exact word-start timecode
      end_tc: lastWord.out    // Exact word-end timecode
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl w-full max-w-3xl p-8 shadow-2xl">
        <h3 className="text-gray-400 text-[10px] font-bold uppercase mb-6">Precision Trim Editor</h3>
        <div className="flex flex-wrap gap-2 mb-8 p-6 bg-[#0c0c0c] rounded-lg border border-[#2a2a2a]">
          {wordData.map((w, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort((a,b)=>a-b))}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                selectedIndices.includes(i) ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-white">Cancel</button>
          <button onClick={handleConfirm} className="bg-indigo-600 px-6 py-2 rounded text-xs font-bold">Add Trim to Canvas</button>
        </div>
      </div>
    </div>
  );
};
