import type { StatementData, Transaction } from '../types/statement';
import { addDays, compareIsoDates, daysBetween, formatDateCompact, formatDateNumeric } from './dates';
import { newId } from './ids';
import { round2 } from './money';

/**
 * All sample data is fictional. Sort code 00-00-00, IBAN checksum "00" and BIC
 * "DEMOGB2X" are deliberately invalid so the output can never be mistaken for a
 * real account.
 */
export const SAMPLE_ACCOUNT = {
  accountHolder: 'MS J SAMPLE',
  address: 'MS JORDAN SAMPLE\n1 EXAMPLE STREET\nDEMOTOWN\nDE1 2MO',
  productName: 'DEMO CURRENT ACCOUNT',
  accountNumber: '12345678',
  sortCode: '00-00-00',
  bic: 'DEMOGB2X',
  iban: 'GB00DEMO00000012345678',
} as const;

export const SAMPLE_PERIOD = {
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  statementDate: '2026-08-31',
} as const;

type SampleRow = [day: number, description: string, paidIn: number | null, withdrawn: number | null];

const SMALL_SAMPLE_ROWS: SampleRow[] = [
  [1, 'Direct Debit DEMO ENERGY CO', null, 146.87],
  [3, 'Direct Debit DEMO MOBILE LTD', null, 40.67],
  [5, 'Automated Credit DEMO EMPLOYER LTD SALARY', 2150.0, null],
  [5, 'OnLine Transaction DEMO LANDLORD VIA MOBILE - PYMT FP 05/08/26 10 00000000000000000D', null, 950.0],
  [7, 'Card Transaction 0000 06AUG26 DEMO COFFEE HOUSE DEMOTOWN GB', null, 4.2],
  [7, 'Direct Debit DEMO INSURANCE PLC', null, 32.1],
  [10, 'Card Transaction 0000 09AUG26 DEMO SUPERMARKET DEMOTOWN GB', null, 62.35],
  [12, 'Automated Credit DEMO COUNCIL REFUND', 25.0, null],
  [14, 'OnLine Transaction J SAMPLE SAVINGS VIA MOBILE - XFER 14/08/26 10 00000000000000000D', null, 300.0],
  [18, 'Card Transaction 0000 17AUG26 DEMO STREAMING SERVICE ONLINE GB', null, 9.99],
  [21, 'Direct Debit DEMO WATER SERVICES', null, 28.5],
  [24, 'Automated Credit DEMO EMPLOYER LTD EXPENSES', 84.3, null],
  [27, 'Card Transaction 0000 26AUG26 DEMO RAIL TICKETS ONLINE GB', null, 45.6],
  [31, 'OnLine Transaction A FRIEND VIA MOBILE - PYMT FP 31/08/26 10 00000000000000000D', 20.0, null],
];

function makeTransaction(date: string, description: string, paidIn: number | null, withdrawn: number | null): Transaction {
  return { id: newId(), date, description, paidIn, withdrawn, balance: null };
}

export function createSmallSampleTransactions(): Transaction[] {
  return SMALL_SAMPLE_ROWS.map(([day, description, paidIn, withdrawn]) =>
    makeTransaction(addDays(SAMPLE_PERIOD.periodStart, day - 1), description, paidIn, withdrawn),
  );
}

/** Deterministic PRNG (mulberry32) so "generate demo rows" is reproducible. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRECT_DEBIT_PAYEES = [
  'DEMO ENERGY CO',
  'DEMO MOBILE LTD',
  'DEMO INSURANCE PLC',
  'DEMO WATER SERVICES',
  'DEMO GYM CLUB',
  'DEMO BROADBAND LTD',
];
const CARD_MERCHANTS = [
  'DEMO COFFEE HOUSE DEMOTOWN GB',
  'DEMO SUPERMARKET DEMOTOWN GB',
  'DEMO PHARMACY DEMOTOWN GB',
  'DEMO FUEL STATION DEMOTOWN GB',
  'DEMO BOOKSHOP ONLINE GB',
  'DEMO TAKEAWAY DEMOTOWN GB',
  'DEMO HARDWARE STORE DEMOTOWN GB',
];
const ONLINE_PAYEES = [
  'DEMO LANDLORD VIA MOBILE - PYMT FP',
  'J SAMPLE SAVINGS VIA MOBILE - XFER',
  'DEMO UTILITIES VIA MOBILE - PYMT FP',
  'SAMPLE FAMILY MEMBER VIA MOBILE - PYMT FP',
];
const CREDIT_SOURCES = ['Automated Credit DEMO REFUNDS LTD', 'Credit DEMO TRANSFER IN', 'Automated Credit DEMO MARKETPLACE PAYOUT'];

function pick<T>(random: () => number, items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}

function digits(random: () => number, count: number): string {
  let out = '';
  for (let i = 0; i < count; i += 1) out += String(Math.floor(random() * 10));
  return out;
}

/**
 * Generate `count` fictional transactions spread across the period. Useful for
 * testing pagination with many rows.
 */
export function generateTransactions(count: number, periodStart: string, periodEnd: string, seed = 20260801): Transaction[] {
  const random = createRandom(seed);
  const span = Math.max(0, daysBetween(periodStart, periodEnd));
  const rows: Transaction[] = [];

  for (let i = 0; i < count; i += 1) {
    const offset = span === 0 ? 0 : Math.floor((i / Math.max(1, count)) * (span + 1));
    const date = addDays(periodStart, Math.min(span, offset));
    const roll = random();

    // A salary credit at the start and roughly every 35 rows keeps long demo statements in credit.
    if (i % 35 === 0) {
      rows.push(makeTransaction(date, 'Automated Credit DEMO EMPLOYER LTD SALARY', 2150, null));
      continue;
    }
    if (roll < 0.5) {
      const amount = round2(2 + random() * 78);
      rows.push(
        makeTransaction(date, `Card Transaction 0000 ${formatDateCompact(addDays(date, -1))} ${pick(random, CARD_MERCHANTS)}`, null, amount),
      );
    } else if (roll < 0.7) {
      const amount = round2(10 + random() * 140);
      rows.push(makeTransaction(date, `Direct Debit ${pick(random, DIRECT_DEBIT_PAYEES)}`, null, amount));
    } else if (roll < 0.88) {
      const amount = round2(40 + random() * 320);
      rows.push(
        makeTransaction(
          date,
          `OnLine Transaction ${pick(random, ONLINE_PAYEES)} ${formatDateNumeric(date)} 10 ${digits(random, 17)}D`,
          null,
          amount,
        ),
      );
    } else {
      const amount = round2(20 + random() * 480);
      rows.push(makeTransaction(date, pick(random, CREDIT_SOURCES), amount, null));
    }
  }

  return rows.sort((a, b) => compareIsoDates(a.date, b.date));
}

export function createSampleStatement(variant: 'small' | 'large' = 'small'): StatementData {
  const transactions =
    variant === 'small'
      ? createSmallSampleTransactions()
      : generateTransactions(110, SAMPLE_PERIOD.periodStart, SAMPLE_PERIOD.periodEnd);
  return {
    ...SAMPLE_ACCOUNT,
    ...SAMPLE_PERIOD,
    previousBalance: 1000,
    transactions,
    calculationMode: 'auto',
    manualSummary: { totalPaidIn: null, totalWithdrawn: null, newBalance: null },
  };
}
