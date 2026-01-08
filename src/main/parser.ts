
import { TranscriptSegment } from '../types';

/**
 * Parser for DaVinci Resolve SRTX word-level transcript format.
 * Format expected:
 * 1
 * HH:MM:SS,mmm --> HH:MM:SS,mmm
 * Speaker Name
 *  word
 */
export const parseTranscript = (rawContent: string, assetId: number): Partial<TranscriptSegment>[] => {
  // Parse individual word entries from SRTX format
  // Pattern: sequence number, timecode range, speaker, word
  const wordRegex = /^\d+\n(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\n([^\n]+)\n\s*([^\n]+)/gm;

  interface WordEntry {
    word: string;
    in: string;
    out: string;
    speaker: string;
  }

  const words: WordEntry[] = [];
  let match;

  while ((match = wordRegex.exec(rawContent)) !== null) {
    words.push({
      word: match[4].trim(),
      in: srtTimeToFrameTC(match[1], 25.0),
      out: srtTimeToFrameTC(match[2], 25.0),
      speaker: match[3].trim()
    });
  }

  if (words.length === 0) return [];

  // Group words into speaker-bound segments
  const segments: Partial<TranscriptSegment>[] = [];
  let currentSegment: any = null;
  let currentWordMap: WordEntry[] = [];

  for (const wordEntry of words) {
    if (!currentSegment || currentSegment.speaker_label !== wordEntry.speaker) {
      // Save previous segment
      if (currentSegment) {
        currentSegment.content = currentWordMap.map(w => w.word).join(' ');
        currentSegment.word_map = JSON.stringify(currentWordMap.map(w => ({
          word: w.word,
          in: w.in,
          out: w.out
        })));
        segments.push(currentSegment);
      }

      // Start new segment
      currentSegment = {
        asset_id: assetId,
        speaker_label: wordEntry.speaker,
        time_in: wordEntry.in,
        time_out: wordEntry.out
      };
      currentWordMap = [wordEntry];
    } else {
      // Continue current segment
      currentSegment.time_out = wordEntry.out;
      currentWordMap.push(wordEntry);
    }
  }

  // Save final segment
  if (currentSegment) {
    currentSegment.content = currentWordMap.map(w => w.word).join(' ');
    currentSegment.word_map = JSON.stringify(currentWordMap.map(w => ({
      word: w.word,
      in: w.in,
      out: w.out
    })));
    segments.push(currentSegment);
  }

  return segments;
};

/**
 * Convert SRT time format (HH:MM:SS,mmm) to frame-based timecode (HH:MM:SS:FF)
 */
function srtTimeToFrameTC(srtTime: string, fps: number): string {
  // Parse SRT format: HH:MM:SS,mmm
  const [timePart, msPart] = srtTime.split(',');
  const [h, m, s] = timePart.split(':').map(Number);
  const ms = parseInt(msPart);

  // Convert to total seconds with milliseconds
  const totalSeconds = h * 3600 + m * 60 + s + ms / 1000;

  // Convert to frames
  const totalFrames = Math.round(totalSeconds * fps);

  // Convert back to HH:MM:SS:FF format
  const hours = Math.floor(totalFrames / (3600 * fps));
  const minutes = Math.floor((totalFrames % (3600 * fps)) / (60 * fps));
  const seconds = Math.floor((totalFrames % (60 * fps)) / fps);
  const frames = Math.round(totalFrames % fps);

  return [hours, minutes, seconds, frames].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * In a real Electron environment, this would use 'fs' and recursive readdir.
 * Here we provide the script logic as requested.
 */
export const getRecursiveCrawlerScript = () => {
  return `
    const fs = require('fs');
    const path = require('path');

    function crawl(dir, extensions = ['.mp4', '.mov', '.wav', '.mp3']) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(crawl(file, extensions));
        } else {
          if (extensions.includes(path.extname(file).toLowerCase())) {
            results.push(file);
          }
        }
      });
      return results;
    }
  `;
};
