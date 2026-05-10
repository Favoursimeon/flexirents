// FlexiRents Risk Scoring Framework
// 4 Dimensions, Total = 100 points
// A. Income Stability (40 pts)
// B. Payment History & Behaviour (25 pts)
// C. Rent Burden Ratio (20 pts)
// D. Social & Structural Support (15 pts)

export interface FIGInput {
  // A. Income Stability
  income_category: string; // salaried_permanent, salaried_contract, mixed_income, informal_consistent, irregular
  employment_duration_months: number;

  // B. Payment History & Behaviour
  previous_flexirent_repayment: boolean;
  guarantor_credibility: string; // strong, none
  mobile_money_consistency: boolean;
  rent_dispute_history: boolean;

  // C. Rent Burden Ratio
  monthly_net_income: number;
  target_rent: number;

  // D. Social & Structural Support
  social_support_type: string; // employer_backed, strong_guarantor, family_fallback, none

  // Legacy fields (kept for backward compatibility)
  income_source: string;
  employer_tier: string;
  payment_behaviour: string;
  gov_id_verified: boolean;
  bank_verified: boolean;
  employment_verified: boolean;
}

export interface FIGResult {
  income_stability_score: number;
  payment_behaviour_score: number;
  rent_burden_score: number;
  social_support_score: number;
  total_score: number;
  tier: string;
  // Legacy compatibility
  income_score: number;
  affordability_score: number;
  employment_score: number;
  behaviour_score: number;
  verification_score: number;
}

export const TIER_PLANS: Record<string, { allowed: string[]; locked: string[] }> = {
  A: { allowed: ["FlexiMonthly", "Flexi50", "Flexi75", "Full Payment"], locked: [] },
  B: { allowed: ["Flexi50", "Flexi75", "Full Payment"], locked: ["FlexiMonthly"] },
  C: { allowed: ["Flexi75", "Full Payment"], locked: ["FlexiMonthly", "Flexi50"] },
  D: { allowed: ["Full Payment"], locked: ["FlexiMonthly", "Flexi50", "Flexi75"] },
};

// A. Income Stability (max 40)
const INCOME_CATEGORY_SCORES: Record<string, number> = {
  salaried_permanent: 40,
  salaried_contract: 34,
  mixed_income: 29,
  informal_consistent: 24,
  irregular: 14,
};

// D. Social & Structural Support (max 15)
const SOCIAL_SUPPORT_SCORES: Record<string, number> = {
  employer_backed: 15,
  strong_guarantor: 12,
  family_fallback: 6,
  none: 0,
};

export function calculateFIGScore(input: FIGInput): FIGResult {
  // A. Income Stability (40 pts)
  const income_stability_score = INCOME_CATEGORY_SCORES[input.income_category] ?? 14;

  // B. Payment History & Behaviour (25 pts)
  let payment_behaviour_score = 0;
  if (input.previous_flexirent_repayment) payment_behaviour_score += 15;
  if (input.guarantor_credibility === "strong") payment_behaviour_score += 10;
  if (input.mobile_money_consistency) payment_behaviour_score += 10;
  if (input.rent_dispute_history) payment_behaviour_score -= 10;
  payment_behaviour_score = Math.max(0, Math.min(25, payment_behaviour_score));

  // C. Rent Burden Ratio (20 pts)
  let rent_burden_score = 0;
  if (input.monthly_net_income > 0 && input.target_rent > 0) {
    const rentRatio = input.target_rent / input.monthly_net_income;
    if (rentRatio <= 0.30) rent_burden_score = 20;
    else if (rentRatio <= 0.35) rent_burden_score = 17;
    else if (rentRatio <= 0.40) rent_burden_score = 13;
    else rent_burden_score = 7;
  }

  // D. Social & Structural Support (15 pts)
  const social_support_score = SOCIAL_SUPPORT_SCORES[input.social_support_type] ?? 0;

  const total_score = Math.min(100, income_stability_score + payment_behaviour_score + rent_burden_score + social_support_score);

  let tier = "D";
  if (total_score >= 75) tier = "A";
  else if (total_score >= 60) tier = "B";
  else if (total_score >= 45) tier = "C";

  return {
    income_stability_score,
    payment_behaviour_score,
    rent_burden_score,
    social_support_score,
    total_score,
    tier,
    // Legacy compatibility mappings
    income_score: income_stability_score,
    affordability_score: rent_burden_score,
    employment_score: Math.round(income_stability_score * 15 / 40),
    behaviour_score: payment_behaviour_score,
    verification_score: Math.round(social_support_score * 10 / 15),
  };
}
