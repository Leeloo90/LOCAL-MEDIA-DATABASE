import React, { useState, useMemo } from 'react';

interface WordAnchorModalProps {
  isOpen: boolean;
  onClose: () => void;
  spineNodeData: {
    speaker_label: string;
    content: string;
    start_tc: string;
    end_tc: string;
    duration_seconds?: number;
  };
  onAnchor: (mode: 'clip' | 'word', wordIndex?: number, wordTimecode?: string) => void;
}

interface WordWithTimecode {
  word: string;
  index: number;
  timecode: string; // Estimated timecode for this word
}

/**
 * WordAnchorModal: Appears when connecting a satellite to a spine node.
 * Allows user to either:
 * 1. Clip-level anchor: Align satellite start with spine start
 * 2. Word-level anchor: Anchor to a specific word's timecode
 */
export const WordAnchorModal: React.FC<WordAnchorModalProps> = ({
  isOpen,
  onClose,
  spineNodeData,
  onAnchor,
}) => {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [anchorMode, setAnchorMode] = useState<'clip' | 'word'>('clip');

  // Calculate word timecodes based on spine duration
  const wordsWithTimecodes = useMemo((): WordWithTimecode[] => {
    const words = spineNodeData.content.split(' ');
    const totalWords = words.length;
    const duration = spineNodeData.duration_seconds || totalWords * 0.5;
    const timePerWord = duration / totalWords;

    // Parse start timecode (HH:MM:SS:FF)
    const startParts = spineNodeData.start_tc.split(':').map(Number);
    const startTotalSeconds =
      startParts[0] * 3600 + startParts[1] * 60 + startParts[2] + startParts[3] / 24; // Assuming 24fps

    return words.map((word, index) => {
      const wordOffsetSeconds = index * timePerWord;
      const wordTotalSeconds = startTotalSeconds + wordOffsetSeconds;

      const h = Math.floor(wordTotalSeconds / 3600);
      const m = Math.floor((wordTotalSeconds % 3600) / 60);
      const s = Math.floor(wordTotalSeconds % 60);
      const f = Math.floor(((wordTotalSeconds % 1) * 24)); // Assuming 24fps

      const timecode = [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':');

      return {
        word,
        index,
        timecode,
      };
    });
  }, [spineNodeData]);

  const handleConfirm = () => {
    if (anchorMode === 'clip') {
      onAnchor('clip');
    } else if (anchorMode === 'word' && selectedWordIndex !== null) {
      const selectedWord = wordsWithTimecodes[selectedWordIndex];
      onAnchor('word', selectedWordIndex, selectedWord.timecode);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-indigo-400 uppercase tracking-wider">
              Anchor Satellite to Spine
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Choose how to anchor this B-Roll to the dialogue
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-[#2a2a2a] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Spine Info */}
        <div className="px-6 py-3 bg-indigo-950/20 border-b border-indigo-900/30">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-indigo-400"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <span className="text-sm font-black text-indigo-300 uppercase tracking-wider">
              {spineNodeData.speaker_label}
            </span>
            <span className="text-xs text-gray-500 font-mono ml-auto">
              {spineNodeData.start_tc} → {spineNodeData.end_tc}
            </span>
          </div>
        </div>

        {/* Anchor Mode Selection */}
        <div className="px-6 py-4 border-b border-[#333]">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 block">
            Anchor Mode
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setAnchorMode('clip');
                setSelectedWordIndex(null);
              }}
              className={`flex-1 px-4 py-3 rounded border-2 transition-all text-left ${
                anchorMode === 'clip'
                  ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                  : 'border-[#333] bg-[#0c0c0c] hover:border-indigo-500/50'
              }`}
            >
              <div className="text-sm font-bold text-white mb-1">Clip-Level Anchor</div>
              <div className="text-xs text-gray-500">
                Align satellite start with spine start timecode
              </div>
            </button>
            <button
              onClick={() => setAnchorMode('word')}
              className={`flex-1 px-4 py-3 rounded border-2 transition-all text-left ${
                anchorMode === 'word'
                  ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                  : 'border-[#333] bg-[#0c0c0c] hover:border-purple-500/50'
              }`}
            >
              <div className="text-sm font-bold text-white mb-1">Word-Level Anchor</div>
              <div className="text-xs text-gray-500">
                Anchor to a specific word's timecode (click below)
              </div>
            </button>
          </div>
        </div>

        {/* Word Selection (only visible in word mode) */}
        {anchorMode === 'word' && (
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 block">
              Click a word to anchor
            </label>
            <div className="flex flex-wrap gap-2">
              {wordsWithTimecodes.map((wordData) => (
                <button
                  key={wordData.index}
                  onClick={() => setSelectedWordIndex(wordData.index)}
                  className={`group relative px-3 py-2 rounded border transition-all ${
                    selectedWordIndex === wordData.index
                      ? 'border-purple-500 bg-purple-500/20 text-white shadow-lg'
                      : 'border-[#333] bg-[#0c0c0c] text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/5'
                  }`}
                >
                  <span className="text-sm font-medium">{wordData.word}</span>
                  <div
                    className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black border border-purple-500/50 rounded text-[9px] font-mono text-purple-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                      selectedWordIndex === wordData.index ? 'opacity-100' : ''
                    }`}
                  >
                    {wordData.timecode}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#333] flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {anchorMode === 'word' && selectedWordIndex !== null && (
              <>
                Selected: <span className="font-mono text-purple-400">{wordsWithTimecodes[selectedWordIndex].word}</span> at{' '}
                <span className="font-mono text-purple-400">{wordsWithTimecodes[selectedWordIndex].timecode}</span>
              </>
            )}
            {anchorMode === 'clip' && (
              <>
                Satellite will start at <span className="font-mono text-indigo-400">{spineNodeData.start_tc}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#0c0c0c] border border-[#333] text-gray-400 hover:border-gray-500 hover:text-white transition-all text-sm font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={anchorMode === 'word' && selectedWordIndex === null}
              className={`px-4 py-2 rounded text-sm font-black uppercase tracking-wider transition-all ${
                anchorMode === 'word' && selectedWordIndex === null
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : anchorMode === 'word'
                  ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/50'
              }`}
            >
              Anchor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
