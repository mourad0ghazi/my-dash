export interface CompoundYear { year: number; withInterest: number; invested: number; interest: number }

export function calculateCompoundInterest(initial: number, monthly: number, annualRate: number, years: number): CompoundYear[] {
  const monthlyRate = annualRate / 100 / 12
  let balance = initial
  const result: CompoundYear[] = [{ year: 0, withInterest: initial, invested: initial, interest: 0 }]
  for (let month = 1; month <= years * 12; month += 1) {
    balance = balance * (1 + monthlyRate) + monthly
    if (month % 12 === 0) {
      const invested = initial + monthly * month
      result.push({ year: month / 12, withInterest: Math.round(balance), invested, interest: Math.round(balance - invested) })
    }
  }
  return result
}

export function calculateLoan(principal: number, annualRate: number, years: number) {
  const months = Math.max(1, years * 12)
  const rate = annualRate / 100 / 12
  const payment = rate === 0 ? principal / months : principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
  const total = payment * months
  const yearly: { year: number; principal: number; interest: number; balance: number }[] = []
  let balance = principal
  let yearPrincipal = 0
  let yearInterest = 0
  for (let month = 1; month <= months; month += 1) {
    const interest = balance * rate
    const paidPrincipal = Math.min(balance, payment - interest)
    balance = Math.max(0, balance - paidPrincipal)
    yearPrincipal += paidPrincipal
    yearInterest += interest
    if (month % 12 === 0 || month === months) {
      yearly.push({ year: Math.ceil(month / 12), principal: Math.round(yearPrincipal), interest: Math.round(yearInterest), balance: Math.round(balance) })
      yearPrincipal = 0
      yearInterest = 0
    }
  }
  return { payment, total, interest: total - principal, yearly }
}

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))
