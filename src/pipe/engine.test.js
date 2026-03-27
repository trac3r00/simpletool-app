import { describe, it, expect } from 'vitest';
import { runPipeline, validateChain, serializeWorkflow, deserializeWorkflow } from './engine.js';

const textToUpper = {
  id: 'upper',
  name: 'Uppercase',
  inputTypes: ['text'],
  outputTypes: ['text'],
  transform: (input) => (input || '').toUpperCase(),
};

const addPrefix = {
  id: 'prefix',
  name: 'Add Prefix',
  inputTypes: ['text'],
  outputTypes: ['text'],
  transform: (input, { prefix = '> ' } = {}) => (input ? prefix + input : ''),
};

const textToJson = {
  id: 'text-to-json',
  name: 'Wrap in JSON',
  inputTypes: ['text'],
  outputTypes: ['json'],
  transform: (input) => JSON.stringify({ value: input || '' }),
};

const jsonOnly = {
  id: 'json-only',
  name: 'JSON Keys',
  inputTypes: ['json'],
  outputTypes: ['text'],
  transform: (input) => {
    try {
      return Object.keys(JSON.parse(input || '{}')).join(', ');
    } catch {
      throw new Error('Invalid JSON');
    }
  },
};

const failing = {
  id: 'fail',
  name: 'Always Fails',
  inputTypes: ['text'],
  outputTypes: ['text'],
  transform: () => { throw new Error('intentional failure'); },
};

describe('runPipeline', () => {
  it('runs a single step', () => {
    const result = runPipeline([{ contract: textToUpper }], 'hello');
    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].output).toBe('HELLO');
    expect(result.finalOutput).toBe('HELLO');
  });

  it('chains two steps', () => {
    const result = runPipeline(
      [{ contract: textToUpper }, { contract: addPrefix, options: { prefix: '>> ' } }],
      'hello'
    );
    expect(result.success).toBe(true);
    expect(result.steps[0].output).toBe('HELLO');
    expect(result.steps[1].output).toBe('>> HELLO');
    expect(result.finalOutput).toBe('>> HELLO');
  });

  it('chains three steps', () => {
    const result = runPipeline(
      [{ contract: textToUpper }, { contract: addPrefix }, { contract: addPrefix }],
      'hi'
    );
    expect(result.finalOutput).toBe('> > HI');
  });

  it('handles empty pipeline', () => {
    const result = runPipeline([], 'hello');
    expect(result.success).toBe(true);
    expect(result.finalOutput).toBe('hello');
    expect(result.steps).toHaveLength(0);
  });

  it('captures step failure and marks downstream as skipped', () => {
    const result = runPipeline(
      [{ contract: textToUpper }, { contract: failing }, { contract: addPrefix }],
      'hello'
    );
    expect(result.success).toBe(false);
    expect(result.steps[0].status).toBe('success');
    expect(result.steps[0].output).toBe('HELLO');
    expect(result.steps[1].status).toBe('error');
    expect(result.steps[1].error).toContain('intentional failure');
    expect(result.steps[2].status).toBe('skipped');
  });

  it('handles null input', () => {
    const result = runPipeline([{ contract: textToUpper }], null);
    expect(result.success).toBe(true);
    expect(result.steps[0].output).toBe('');
  });

  it('passes options to transform', () => {
    const result = runPipeline(
      [{ contract: addPrefix, options: { prefix: '### ' } }],
      'title'
    );
    expect(result.finalOutput).toBe('### title');
  });
});

describe('validateChain', () => {
  it('accepts compatible types', () => {
    const result = validateChain([textToUpper, addPrefix]);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects type mismatch', () => {
    const result = validateChain([textToUpper, jsonOnly]);
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('type mismatch');
  });

  it('accepts when types overlap', () => {
    const result = validateChain([textToJson, jsonOnly]);
    expect(result.valid).toBe(true);
  });

  it('accepts empty chain', () => {
    const result = validateChain([]);
    expect(result.valid).toBe(true);
  });

  it('accepts single step', () => {
    const result = validateChain([textToUpper]);
    expect(result.valid).toBe(true);
  });
});

describe('serializeWorkflow / deserializeWorkflow', () => {
  it('round-trips a workflow', () => {
    const steps = [
      { contractId: 'upper', options: {} },
      { contractId: 'prefix', options: { prefix: '> ' } },
    ];
    const serialized = serializeWorkflow(steps);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = deserializeWorkflow(serialized);
    expect(deserialized).toEqual(steps);
  });

  it('handles empty workflow', () => {
    const serialized = serializeWorkflow([]);
    const deserialized = deserializeWorkflow(serialized);
    expect(deserialized).toEqual([]);
  });

  it('returns empty array for malformed input', () => {
    const result = deserializeWorkflow('garbage-data!!!');
    expect(result).toEqual([]);
  });

  it('returns empty array for null', () => {
    const result = deserializeWorkflow(null);
    expect(result).toEqual([]);
  });
});
