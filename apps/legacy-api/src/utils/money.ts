export class Money {
  private constructor(private readonly amountKobo: number) {}

  /* -----------------------------
   * Factory Methods
   * ----------------------------- */

  static fromKobo(kobo: number): Money {
    if (!Number.isInteger(kobo)) {
      throw new Error('Money must be stored as integer kobo.');
    }
    return new Money(kobo);
  }

  static fromNaira(naira: number): Money {
    const kobo = Math.round(naira * 100);
    return new Money(kobo);
  }

  static zero(): Money {
    return new Money(0);
  }

  /* -----------------------------
   * Getters
   * ----------------------------- */

  get kobo(): number {
    return this.amountKobo;
  }

  get naira(): number {
    return this.amountKobo / 100;
  }

  /* -----------------------------
   * Arithmetic
   * ----------------------------- */

  add(other: Money): Money {
    return new Money(this.amountKobo + other.amountKobo);
  }

  subtract(other: Money): Money {
    return new Money(this.amountKobo - other.amountKobo);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amountKobo * factor));
  }

  percentage(percent: number): Money {
    return new Money(Math.round((this.amountKobo * percent) / 100));
  }

  /* -----------------------------
   * Comparison
   * ----------------------------- */

  isGreaterThan(other: Money): boolean {
    return this.amountKobo > other.amountKobo;
  }

  isLessThan(other: Money): boolean {
    return this.amountKobo < other.amountKobo;
  }

  equals(other: Money): boolean {
    return this.amountKobo === other.amountKobo;
  }

  /* -----------------------------
   * Formatting
   * ----------------------------- */

  format(locale = 'en-NG', currency = 'NGN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(this.naira);
  }
}

export function createMoney(amount: number, unit: 'kobo' | 'naira'): Money {
  if (unit === 'kobo') {
    return Money.fromKobo(amount);
  } else {
    return Money.fromNaira(amount);
  }
}
