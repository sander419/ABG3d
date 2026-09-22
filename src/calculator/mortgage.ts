/**
 * Mortgage estimate for building a house by contract (ИЖС, escrow).
 *
 * Family mortgage rules used here (as of September 2026, see the calculator footer):
 *  - rate 6 %, down payment from 20 %;
 *  - preferential limit 12 mln ₽ in Moscow/region and St Petersburg/Leningrad region;
 *  - above the limit the rest can be taken at the bank's market rate ("combined" loan).
 * The market rate is an editable estimate, not a bank offer.
 */

export const FAMILY_RATE = 6;
export const FAMILY_LIMIT = 12_000_000;
export const MIN_DOWN_SHARE = 0.2;
/** ДОМ.РФ: average market rate for private-house construction loans, mid-December 2025. */
export const DEFAULT_MARKET_RATE = 20.8;
export const DEFAULT_TERM_YEARS = 30;

/** Monthly annuity payment. Zero-rate and zero-principal cases are handled. */
export function annuityPayment(principal: number, annualRatePercent: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const n = Math.round(years * 12);
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export interface MortgageInput {
  /** Contract price that goes into the loan (house + any extras the buyer adds). */
  price: number;
  downPayment: number;
  familyEligible: boolean;
  marketRate: number;
  years: number;
}

export interface MortgagePlan {
  loan: number;
  minDownPayment: number;
  downPaymentTooLow: boolean;
  familyPart: number;
  marketPart: number;
  monthlyFamily: number;
  monthlyMarket: number;
  monthly: number;
  /** Total paid to the bank over the whole term. */
  totalPaid: number;
  overpayment: number;
}

export function planMortgage({ price, downPayment, familyEligible, marketRate, years }: MortgageInput): MortgagePlan {
  const safePrice = Math.max(0, price);
  const down = Math.min(Math.max(0, downPayment), safePrice);
  const loan = safePrice - down;
  const minDownPayment = Math.ceil(safePrice * MIN_DOWN_SHARE);
  const familyPart = familyEligible ? Math.min(loan, FAMILY_LIMIT) : 0;
  const marketPart = loan - familyPart;
  const monthlyFamily = annuityPayment(familyPart, FAMILY_RATE, years);
  const monthlyMarket = annuityPayment(marketPart, marketRate, years);
  const monthly = monthlyFamily + monthlyMarket;
  const totalPaid = monthly * Math.round(years * 12);
  return {
    loan,
    minDownPayment,
    downPaymentTooLow: down < minDownPayment,
    familyPart,
    marketPart,
    monthlyFamily,
    monthlyMarket,
    monthly,
    totalPaid,
    overpayment: Math.max(0, totalPaid - loan),
  };
}

export function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

export function formatMln(value: number): string {
  return `${(value / 1_000_000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} млн ₽`;
}
