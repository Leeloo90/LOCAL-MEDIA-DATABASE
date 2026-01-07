
import { TranscriptSegment } from '../types';

/**
 * Regex-based parser for DaVinci Resolve transcript format.
 * Format expected:
 * Speaker Name
 * [HH:MM:SS:FF - HH:MM:SS:FF]
 * The actual spoken text content...
 */
export const parseTranscript = (rawContent: string, assetId: number): Partial<TranscriptSegment>[] => {
  // Pattern to match Speaker, Timecode Range, and Text Block
  // Example matches:
  // "Speaker 1"
  // "[00:00:10:00 - 00:00:15:20]"
  // "Hello this is a test."
  const blockRegex = /([^\n]+)\n\[(\d{2}:\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2}:\d{2})\]\n([\s\S]+?)(?=\n[^\n]+\n\[|$)/g;

  const rawSegments: any[] = [];
  let match;

  while ((match = blockRegex.exec(rawContent)) !== null) {
    rawSegments.push({
      speaker: match[1].trim(),
      time_in: match[2],
      time_out: match[3],
      content: match[4].trim(),
    });
  }

  // Key Technical Detail: Speaker-Bound Segment Construction
  // Concatenate contiguous blocks from the same speaker.
  const speakerBoundSegments: Partial<TranscriptSegment>[] = [];

  if (rawSegments.length === 0) return [];

  let currentSegment = { ...rawSegments[0], asset_id: assetId };

  for (let i = 1; i < rawSegments.length; i++) {
    const nextBlock = rawSegments[i];

    if (nextBlock.speaker === currentSegment.speaker) {
      // Same speaker: extend the current segment
      currentSegment.time_out = nextBlock.time_out;
      currentSegment.content += ' ' + nextBlock.content;
    } else {
      // Different speaker: push current and start new
      speakerBoundSegments.push(currentSegment);
      currentSegment = { ...nextBlock, asset_id: assetId };
    }
  }
  
  // Push the final segment
  speakerBoundSegments.push(currentSegment);

  return speakerBoundSegments;
};

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
