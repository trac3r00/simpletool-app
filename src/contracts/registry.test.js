import { describe, it, expect, beforeEach } from 'vitest';
import { registerContract, getContract, getContractsForInputType, getAllContracts, clearContracts } from './registry.js';

const makeContract = (overrides = {}) => ({
  id: 'test-tool',
  name: 'Test Tool',
  inputTypes: ['text'],
  outputTypes: ['text'],
  transform: (input) => input || '',
  ...overrides,
});

describe('Contract Registry', () => {
  beforeEach(() => {
    clearContracts();
  });

  it('registers and retrieves a contract', () => {
    const c = makeContract();
    registerContract(c);
    expect(getContract('test-tool')).toBe(c);
  });

  it('returns null for unknown id', () => {
    expect(getContract('nonexistent')).toBeNull();
  });

  it('throws on missing id', () => {
    expect(() => registerContract({ ...makeContract(), id: '' })).toThrow();
  });

  it('throws on missing transform', () => {
    expect(() => registerContract({ ...makeContract(), transform: null })).toThrow();
  });

  it('throws on empty inputTypes', () => {
    expect(() => registerContract({ ...makeContract(), inputTypes: [] })).toThrow();
  });

  it('throws on empty outputTypes', () => {
    expect(() => registerContract({ ...makeContract(), outputTypes: [] })).toThrow();
  });

  it('filters contracts by input type', () => {
    registerContract(makeContract({ id: 'a', inputTypes: ['text'] }));
    registerContract(makeContract({ id: 'b', inputTypes: ['json'] }));
    registerContract(makeContract({ id: 'c', inputTypes: ['text', 'json'] }));

    const textContracts = getContractsForInputType('text');
    expect(textContracts.map(c => c.id)).toEqual(['a', 'c']);
  });

  it('returns empty array for unmatched type', () => {
    registerContract(makeContract());
    expect(getContractsForInputType('csv')).toEqual([]);
  });

  it('returns all contracts', () => {
    registerContract(makeContract({ id: 'x' }));
    registerContract(makeContract({ id: 'y' }));
    expect(getAllContracts()).toHaveLength(2);
  });

  it('clears all contracts', () => {
    registerContract(makeContract());
    clearContracts();
    expect(getAllContracts()).toHaveLength(0);
  });
});
