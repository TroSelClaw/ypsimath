import { describe, expect, it } from 'vitest';

import { parseQualityResponse } from './quality-checker';

describe('parseQualityResponse', () => {
  it('parses passed result', () => {
    const text = `Her er vurdering:\n{\n  "passed": true,\n  "confidence": 0.91,\n  "issues": [],\n  "summary": "Ser bra ut"\n}`;
    const result = parseQualityResponse(text);

    expect(result.passed).toBe(true);
    expect(result.confidence).toBe(0.91);
    expect(result.issues).toEqual([]);
    expect(result.flagReason).toBeNull();
  });

  it('parses flagged result with summary', () => {
    const text = `{"passed":false,"confidence":0.72,"issues":["Feil fortegn"],"summary":"Matematisk feil i steg 2"}`;
    const result = parseQualityResponse(text);

    expect(result.passed).toBe(false);
    expect(result.flagReason).toContain('steg 2');
    expect(result.issues).toHaveLength(1);
  });

  it('throws when json is missing', () => {
    expect(() => parseQualityResponse('ingen json her')).toThrow('Could not extract JSON');
  });
});
