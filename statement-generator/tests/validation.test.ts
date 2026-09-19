import { describe, expect, it } from 'vitest';
import { createSampleStatement } from '../src/lib/sampleData';
import { countIssues, issueFor, validateStatement } from '../src/lib/validation';

describe('validateStatement', () => {
  it('accepts the shipped sample data without errors', () => {
    const issues = validateStatement(createSampleStatement('small'));
    expect(countIssues(issues).errors).toBe(0);
  });

  it('flags missing required fields and invalid dates as errors', () => {
    const data = { ...createSampleStatement('small'), accountHolder: '  ', periodEnd: '2026-02-30' };
    const issues = validateStatement(data);
    expect(issueFor(issues, 'accountHolder')?.severity).toBe('error');
    expect(issueFor(issues, 'periodEnd')?.severity).toBe('error');
  });

  it('warns about unusual identifiers instead of blocking', () => {
    const data = { ...createSampleStatement('small'), sortCode: '123456', accountNumber: '12', bic: 'X', iban: 'NOPE' };
    const issues = validateStatement(data);
    for (const field of ['sortCode', 'accountNumber', 'bic', 'iban']) {
      expect(issueFor(issues, field)?.severity).toBe('warning');
    }
    expect(countIssues(issues).errors).toBe(0);
  });

  it('validates transactions individually', () => {
    const data = createSampleStatement('small');
    const first = data.transactions[0];
    if (!first) throw new Error('sample has no rows');
    data.transactions = [
      { ...first, id: 'a', description: '', paidIn: -1 },
      { ...first, id: 'b', date: '2027-01-01', paidIn: null, withdrawn: null },
      { ...first, id: 'c', paidIn: 1, withdrawn: 1 },
    ];
    const issues = validateStatement(data);
    expect(issueFor(issues, 'description', 'a')?.severity).toBe('error');
    expect(issueFor(issues, 'paidIn', 'a')?.severity).toBe('error');
    expect(issueFor(issues, 'date', 'b')?.severity).toBe('warning');
    expect(issueFor(issues, 'paidIn', 'b')?.severity).toBe('warning');
    expect(issueFor(issues, 'withdrawn', 'c')?.severity).toBe('warning');
    expect(issueFor(issues, 'description', 'c')).toBeUndefined();
  });

  it('rejects period end before period start', () => {
    const data = { ...createSampleStatement('small'), periodStart: '2026-08-31', periodEnd: '2026-08-01' };
    expect(issueFor(validateStatement(data), 'periodEnd')?.severity).toBe('error');
  });
});
