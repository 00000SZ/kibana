/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { IRange } from 'monaco-editor';

import { LineMapper } from '../../common/line_mapper';
import { SourceHit } from '../../model';

type MergedHit = [number, number];

// The processed search result with all data processed for monaco to render.
export class CompositeSearchResult {
  private HIT_MERGE_LINE_INTERVAL = 2; // Inclusive
  private mergedHits: MergedHit[];
  private lineMapper: LineMapper;

  /*
   * The line mapping from the line number of the current code snippet to
   * the original full content of the source code.
   */
  private lineMapping: Map<number, number> = new Map<number, number>();
  // The inverted mapping of lineMapping above.
  private invertedLineMapping: Map<number, number> = new Map<number, number>();

  constructor(private readonly highlights: SourceHit[], content: string) {
    const sortedHits = Array.from(highlights).sort((h1: SourceHit, h2: SourceHit) => {
      return h1.range.startLoc.line - h2.range.startLoc.line;
    });
    this.lineMapper = new LineMapper(content);
    this.mergedHits = this.mergeHits(sortedHits);
    this.buildLineMapping();
  }

  /*
   * Returns a Monaco line number function.
   */
  public getLineNumberFunc(): (line: number) => string {
    return (line: number) => {
      const l = this.lineMapping.get(line);
      if (l) {
        return String(l);
      } else {
        // If the line mapping does not contain the line of the code snippet,
        // then it must be a separator line.
        return '..';
      }
    };
  }

  /*
   * Returns the content for Monaco editor to render the search code snippet.
   */
  public getSearchResultContent(): string {
    const lines: string[] = [];
    if (this.mergedHits.length === 0) {
      return '';
    }

    // If the first merged hit does not start from line 1, then
    // insert an empty line as the separation gutter.
    if (this.mergedHits[0][0] > 1) {
      lines.push('');
    }

    this.mergedHits.forEach((h: MergedHit) => {
      for (let i = h[0]; i <= h[1]; i++) {
        lines.push(this.lineMapper.getLines()[i - 1]);
      }
      lines.push('');
    });

    // If the last merged hit does not ends exactly on the file end, then
    // remove the empty line appended in the step above.
    if (this.mergedHits[this.mergedHits.length - 1][1] === this.lineMapper.getLines().length) {
      lines.slice(0, lines.length - 1);
    }

    return lines.join('\n');
  }

  /*
   * Convert highlights into Monaco decoration ranges (IRange).
   */
  public getHighlightRanges(): IRange[] {
    return this.highlights.map(h => {
      const range: IRange = {
        startLineNumber: this.invertedLineMapping.get(h.range.startLoc.line + 1)!,
        startColumn: h.range.startLoc.column + 1,
        endLineNumber: this.invertedLineMapping.get(h.range.endLoc.line + 1)!,
        endColumn: h.range.endLoc.column + 1,
      };
      return range;
    });
  }

  /*
   * Build the line mapping and the inverted line mapping from the current
   * code snippet to the original source code.
   */
  private buildLineMapping() {
    // The line number cursor in the original source code.
    let index = 1;
    // The offset we need to take into account for all separator lines (`..`).
    let offset = 0;

    if (this.mergedHits.length === 0) {
      return;
    }

    // If the first merged hit does not start from line 1. Then we need to add
    // a separator line in the begining of the code snippet.
    if (this.mergedHits[0][0] > 1) {
      offset += 1;
    }

    this.mergedHits.forEach((h: MergedHit) => {
      for (let i = h[0]; i <= h[1]; i++, index++) {
        this.lineMapping.set(index + offset, i);
        this.invertedLineMapping.set(i, index + offset);
      }
      // Count a separator line after each merged hit.
      offset += 1;
    });
  }

  /*
   * Merge the hits in a search result together if they are within
   * HIT_MERGE_LINE_INTERVAL (default value 2) lines.
   * e.g. for hits in line [3, 5, 12], we going to merge the first 2 hits
   * into a code segment between line [1 - 7] and the last hit to a code
   * segment between line [10 - 14].
   */
  private mergeHits(sortedHits: SourceHit[]): MergedHit[] {
    const res: MergedHit[] = [];
    const firstLine = 1;
    const lastLine = this.lineMapper.getLines().length;

    sortedHits.forEach((hit: SourceHit) => {
      const newBeginLine = Math.max(
        firstLine,
        hit.range.startLoc.line + 1 - this.HIT_MERGE_LINE_INTERVAL
      );
      const newEndLine = Math.min(
        lastLine,
        hit.range.startLoc.line + 1 + this.HIT_MERGE_LINE_INTERVAL
      );

      if (
        res.length !== 0 &&
        (res[res.length - 1][0] <= newBeginLine && res[res.length - 1][1] + 1 >= newBeginLine)
      ) {
        res[res.length - 1][1] = newEndLine;
      } else {
        res.push([newBeginLine, newEndLine]);
      }
    });
    return res;
  }
}
