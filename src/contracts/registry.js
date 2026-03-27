/**
 * Contract Registry — central registry for tool pipe contracts.
 *
 * A contract defines how a tool transforms data in Pipe Mode:
 *   { id, name, inputTypes, outputTypes, options, transform }
 *
 * Types: 'text', 'json', 'csv', 'number', 'url'
 */

const contracts = new Map();

export function registerContract(contract) {
  if (!contract.id || typeof contract.transform !== 'function') {
    throw new Error(`Invalid contract: missing id or transform for ${contract.id || 'unknown'}`);
  }
  if (!Array.isArray(contract.inputTypes) || contract.inputTypes.length === 0) {
    throw new Error(`Contract ${contract.id}: inputTypes must be a non-empty array`);
  }
  if (!Array.isArray(contract.outputTypes) || contract.outputTypes.length === 0) {
    throw new Error(`Contract ${contract.id}: outputTypes must be a non-empty array`);
  }
  contracts.set(contract.id, contract);
}

export function getContract(id) {
  return contracts.get(id) ?? null;
}

export function getContractsForInputType(type) {
  const result = [];
  for (const contract of contracts.values()) {
    if (contract.inputTypes.includes(type)) {
      result.push(contract);
    }
  }
  return result;
}

export function getAllContracts() {
  return Array.from(contracts.values());
}

export function clearContracts() {
  contracts.clear();
}
