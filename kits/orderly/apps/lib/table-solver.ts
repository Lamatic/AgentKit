// table-solver.ts — turns an annotated menu, a party, and a budget into one order.
//
// This is the module the rest of the project exists to make possible, and the
// one place where the design thesis is enforced rather than merely described:
// **the model reads, the solver decides.** No language model is consulted here.
// Given the same inputs this function returns the same bytes, every time.
//
// ## What is guaranteed
//
// 1. **Allergen conflicts are eliminated, not penalised.** A dish that any diner
//    must avoid is removed from the candidate pool in Stage 0, before any
//    optimisation begins. There is no later stage that can reintroduce it —
//    not budget pressure, not a hunt for variety, not a tie-break. The
//    guarantee is structural, which is why it can be tested by asserting on
//    output rather than by reasoning about weights.
//
// 2. **The budget is a ceiling.** `totalAmount` never exceeds it. When no order
//    can feed the table within budget, the function says so and returns nothing
//    — it never offers a plausible order that happens to cost more than the
//    diner said they had.
//
// 3. **Unpriced dishes are excluded and reported.** A price that could not be
//    read is never treated as zero. See `price.ts` for why that particular
//    failure would be the worst one.
//
// 4. **Every dish is accounted for.** Each input dish appears exactly once in
//    either `order` or `rejected`, and every rejection carries a reason. The
//    decision is auditable end to end.
//
// ## What is NOT guaranteed
//
// Optimality. The selection is a deterministic greedy heuristic with one
// improvement pass — good, explainable, and fast, but not a proof that no
// better basket exists within the budget. Set cover is NP-hard and a menu is
// not worth an exact solver. The claim this module makes is that it never
// violates a constraint, which is the claim that matters when someone has a
// nut allergy. Do not let the README or the demo overstate it.

import type {
  Budget,
  Diner,
  EnrichedDish,
  ParsedPrice,
  ServingModel,
} from "./types";
import { eligibleDiners } from "./allergen-engine";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SolverInput {
  dishes: readonly EnrichedDish[];
  diners: readonly Diner[];
  /** `null` means no budget constraint. */
  budget: Budget | null;
  /** Defaults to `"shared"`. */
  servingModel?: ServingModel;
  /** Cap on distinct dishes in a shared order. Defaults to `diners.length + 2`. */
  maxDishes?: number;
}

export type RejectionReason =
  /** The vision model could not read this menu line. */
  | "unreadable"
  /** Every diner must avoid it because of an allergen. */
  | "allergen-conflict"
  /** Every diner must avoid it because of a dietary requirement. */
  | "diet-conflict"
  /** The printed price could not be parsed. */
  | "no-price"
  /** Priced in a currency that cannot be compared with the budget. */
  | "currency-mismatch"
  /** A single serving already exceeds the whole budget. */
  | "over-budget"
  /** Eligible and affordable, but not chosen for this order. */
  | "not-selected";

export interface Rejection {
  dishId: string;
  reason: RejectionReason;
  /** Human-readable explanation, shown in the UI. */
  detail: string;
}

export interface OrderLine {
  dish: EnrichedDish;
  /** IDs of the diners this line is for. */
  forDinerIds: string[];
  /** Servings ordered. Always 1 when sharing; one per diner otherwise. */
  quantity: number;
  /** Cost contributed by this line — unit price times quantity. */
  amount: number;
}

export interface TablePlan {
  /**
   * True when an order satisfying every hard constraint was produced.
   *
   * False means either the budget could not cover an order feeding everyone who
   * can be fed, or there was nothing orderable at all. `infeasibleReason` says
   * which.
   */
  feasible: boolean;
  infeasibleReason: string | null;
  order: OrderLine[];
  totalAmount: number;
  currency: string;
  /** Budget left over, or `null` when no budget was set. */
  remaining: number | null;
  /** Diners for whom no dish on this menu is safe. */
  unfed: Diner[];
  /** Every dish not in `order`, with the reason it is not. */
  rejected: Rejection[];
  /** Non-fatal problems worth showing the user, e.g. unreadable prices. */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface Candidate {
  dish: EnrichedDish;
  price: ParsedPrice;
  /** Diners who can eat this dish. Never empty for a candidate. */
  eligible: Diner[];
  eligibleIds: Set<string>;
}

/** Rounds to cents, keeping IEEE-754 drift out of budget comparisons. */
function round(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * The total ordering used for every tie-break in this module.
 *
 * Cheaper first, then by dish ID. Without a total order the greedy stages would
 * depend on input array order, and the same menu scanned twice could produce
 * different orders — which would make the guarantees above untestable.
 */
function byPriceThenId(a: Candidate, b: Candidate): number {
  return a.price.amount - b.price.amount || a.dish.id.localeCompare(b.dish.id);
}

/** Diners covered by a set of candidates. */
function coveredBy(candidates: readonly Candidate[]): Set<string> {
  const covered = new Set<string>();
  for (const candidate of candidates) {
    for (const id of candidate.eligibleIds) covered.add(id);
  }
  return covered;
}

// ---------------------------------------------------------------------------
// The solver
// ---------------------------------------------------------------------------

/**
 * Plans one order for a table.
 *
 * @see the module header for the guarantees this upholds and the one it does not.
 */
export function planTable(input: SolverInput): TablePlan {
  const servingModel: ServingModel = input.servingModel ?? "shared";
  const { dishes, diners, budget } = input;
  const maxDishes = input.maxDishes ?? diners.length + 2;

  const rejected: Rejection[] = [];
  const warnings: string[] = [];

  // ── Stage 0. Build the candidate pool ────────────────────────────────────
  //
  // Everything disqualifying happens here, before any optimisation exists to
  // trade it against. A dish that leaves this stage is one that *somebody* at
  // the table can safely eat and that we can price.

  /** Passed every safety and pricing filter AND fits the budget. */
  const candidates: Candidate[] = [];
  /** Safe, but a single serving costs more than the whole budget. */
  const unaffordable: Candidate[] = [];

  let unreadableCount = 0;
  let unpricedCount = 0;

  for (const dish of dishes) {
    if (dish.unreadable) {
      unreadableCount += 1;
      rejected.push({
        dishId: dish.id,
        reason: "unreadable",
        detail: "this menu line could not be read reliably",
      });
      continue;
    }

    // Cross-contamination: on shared plates an allergen anywhere on the table
    // is an allergen everywhere on it. Serving spoons get swapped, plates get
    // passed, crumbs travel. So in shared mode a dish conflicting with *any*
    // diner's allergy is excluded outright, not merely withheld from them.
    //
    // Dietary requirements are treated differently and deliberately so: a
    // vegetarian is not harmed by someone else ordering pork, so diets stay a
    // per-diner matter. Only allergies escalate to the whole table.
    if (servingModel === "shared") {
      const atRisk = diners.find((diner) =>
        dish.allergens.some((hit) => diner.avoidAllergens.includes(hit.allergen))
      );
      if (atRisk !== undefined) {
        rejected.push({
          dishId: dish.id,
          reason: "allergen-conflict",
          detail: `${atRisk.label} must avoid an allergen in this dish. On shared plates it cannot come to the table at all`,
        });
        continue;
      }
    }

    const eligible = eligibleDiners(dish, diners);
    if (eligible.length === 0) {
      // Nobody can eat it. Distinguish allergen from diet so the user learns
      // something actionable rather than just "excluded".
      const allergenDriven = diners.some((diner) =>
        dish.allergens.some((hit) => diner.avoidAllergens.includes(hit.allergen))
      );
      rejected.push({
        dishId: dish.id,
        reason: allergenDriven ? "allergen-conflict" : "diet-conflict",
        detail: allergenDriven
          ? "conflicts with an allergy at this table"
          : "conflicts with a dietary requirement at this table",
      });
      continue;
    }

    if (dish.price === null) {
      unpricedCount += 1;
      rejected.push({
        dishId: dish.id,
        reason: "no-price",
        detail: "the printed price could not be read, so it cannot be budgeted",
      });
      continue;
    }

    if (
      budget !== null &&
      dish.price.currency !== "" &&
      budget.currency !== "" &&
      dish.price.currency !== budget.currency
    ) {
      rejected.push({
        dishId: dish.id,
        reason: "currency-mismatch",
        detail: `priced in ${dish.price.currency}, which cannot be compared with a ${budget.currency} budget`,
      });
      continue;
    }

    const candidate: Candidate = {
      dish,
      price: dish.price,
      eligible,
      eligibleIds: new Set(eligible.map((d) => d.id)),
    };

    if (budget !== null && dish.price.amount > budget.amount) {
      // Kept aside rather than discarded: this dish is safe, so a diner who
      // could only have eaten this one is priced out, not unfeedable. The
      // distinction changes what we tell them.
      unaffordable.push(candidate);
      rejected.push({
        dishId: dish.id,
        reason: "over-budget",
        detail: "a single serving costs more than the whole budget",
      });
      continue;
    }

    candidates.push(candidate);
  }

  if (unreadableCount > 0) {
    warnings.push(
      `${unreadableCount} menu ${unreadableCount === 1 ? "line" : "lines"} could not be read and ${unreadableCount === 1 ? "was" : "were"} left out.`
    );
  }
  if (unpricedCount > 0) {
    warnings.push(
      `${unpricedCount} ${unpricedCount === 1 ? "dish has" : "dishes have"} an unreadable price and cannot be included in a budgeted order.`
    );
  }

  candidates.sort(byPriceThenId);

  const currency = budget?.currency ?? candidates[0]?.price.currency ?? "";

  // ── Stage 1. Who can eat at all ──────────────────────────────────────────

  // Feedability is judged on safety alone, deliberately ignoring the budget.
  // A diner whose only safe dish is too expensive has not been failed by the
  // menu — they have been failed by the budget, and saying "nothing here is
  // safe for you" would be false. That case surfaces as infeasibility below,
  // which is the honest report and the actionable one.
  const feedable = coveredBy([...candidates, ...unaffordable]);
  const unfed = diners.filter((diner) => !feedable.has(diner.id));
  const toFeed = diners.filter((diner) => feedable.has(diner.id));

  for (const diner of unfed) {
    warnings.push(
      `Nothing on this menu is safe for ${diner.label}. Ask staff about off-menu options.`
    );
  }

  /** Bails out with an empty order rather than an order that breaks a promise. */
  const infeasible = (reason: string): TablePlan => {
    for (const candidate of candidates) {
      rejected.push({
        dishId: candidate.dish.id,
        reason: "not-selected",
        detail: reason,
      });
    }
    return {
      feasible: false,
      infeasibleReason: reason,
      order: [],
      totalAmount: 0,
      currency,
      remaining: budget === null ? null : budget.amount,
      unfed,
      rejected,
      warnings,
    };
  };

  // Checked safety-first, so the message names the real obstacle.
  if (toFeed.length === 0) {
    return infeasible("No dish on this menu is safe for anyone at this table.");
  }
  if (candidates.length === 0) {
    return infeasible(
      budget === null
        ? "No dish on this menu can be ordered for this table."
        : `Nothing safe for this table costs less than ${budget.amount} ${budget.currency}.`
    );
  }

  // ── Stages 2–4. Select ───────────────────────────────────────────────────

  const selected =
    servingModel === "individual"
      ? selectIndividual(candidates, toFeed, budget)
      : selectShared(candidates, toFeed, budget, maxDishes);

  if (selected === null) {
    return infeasible(
      budget === null
        ? "No combination of dishes feeds everyone at this table."
        : `No combination of dishes feeds everyone at this table within ${budget.amount} ${budget.currency}.`
    );
  }

  // ── Stage 5. Assemble ────────────────────────────────────────────────────

  const totalAmount = round(
    selected.reduce((sum, line) => sum + line.amount, 0)
  );

  const chosenIds = new Set(selected.map((line) => line.dish.id));
  for (const candidate of candidates) {
    if (!chosenIds.has(candidate.dish.id)) {
      rejected.push({
        dishId: candidate.dish.id,
        reason: "not-selected",
        detail: "safe and affordable, but not needed for this order",
      });
    }
  }

  return {
    feasible: true,
    infeasibleReason: null,
    order: selected,
    totalAmount,
    currency,
    remaining: budget === null ? null : round(budget.amount - totalAmount),
    unfed,
    rejected,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Shared-plate selection
// ---------------------------------------------------------------------------

/**
 * Stages 2–4 for shared plates: cover everyone, spend the remainder on variety,
 * then try to make the whole thing cheaper.
 *
 * Returns `null` when the budget cannot cover an order that feeds everyone.
 */
function selectShared(
  candidates: readonly Candidate[],
  toFeed: readonly Diner[],
  budget: Budget | null,
  maxDishes: number
): OrderLine[] | null {
  const ceiling = budget?.amount ?? Number.POSITIVE_INFINITY;

  // ── Stage 2. Coverage — everyone eats ──
  //
  // Greedy set cover: repeatedly take the dish with the best price per
  // newly-covered diner. Ties break on price then ID, so the result does not
  // depend on the order dishes arrived in.

  const chosen: Candidate[] = [];
  const covered = new Set<string>();
  let spent = 0;

  const needed = new Set(toFeed.map((d) => d.id));

  while (covered.size < needed.size) {
    let best: Candidate | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      if (chosen.includes(candidate)) continue;
      if (round(spent + candidate.price.amount) > ceiling) continue;

      let newlyCovered = 0;
      for (const id of candidate.eligibleIds) {
        if (needed.has(id) && !covered.has(id)) newlyCovered += 1;
      }
      if (newlyCovered === 0) continue;

      // Cost per person newly fed. Cheaper is better; `candidates` is already
      // sorted by (price, id), so the first candidate to achieve a given score
      // is the deterministic winner.
      const score = candidate.price.amount / newlyCovered;
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    if (best === null) return null; // Cannot feed everyone within budget.

    chosen.push(best);
    spent = round(spent + best.price.amount);
    for (const id of best.eligibleIds) covered.add(id);
  }

  // ── Stage 4. Improvement — swap for cheaper equivalents ──
  //
  // Run before enrichment so any money freed here is available to spend on
  // variety rather than simply left on the table.

  let improved = true;
  while (improved) {
    improved = false;

    for (let i = 0; i < chosen.length; i += 1) {
      const current = chosen[i];

      for (const replacement of candidates) {
        if (replacement.price.amount >= current.price.amount) continue;
        if (chosen.includes(replacement)) continue;

        const swapped = [...chosen];
        swapped[i] = replacement;

        const stillCovered = coveredBy(swapped);
        const coversEveryone = [...needed].every((id) => stillCovered.has(id));
        if (!coversEveryone) continue;

        chosen[i] = replacement;
        spent = round(spent - current.price.amount + replacement.price.amount);
        improved = true;
        break;
      }

      if (improved) break;
    }
  }

  // Drop any dish the swaps made redundant.
  for (let i = chosen.length - 1; i >= 0; i -= 1) {
    const without = chosen.filter((_, index) => index !== i);
    const stillCovered = coveredBy(without);
    if ([...needed].every((id) => stillCovered.has(id))) {
      spent = round(spent - chosen[i].price.amount);
      chosen.splice(i, 1);
    }
  }

  // ── Stage 3. Enrichment — spend what is left on variety ──
  //
  // Preference order: a category not yet represented, then the dish that suits
  // the most diners, then cheapest, then ID. Everyone is already fed by this
  // point, so nothing here can compromise coverage.

  while (chosen.length < maxDishes) {
    const categories = new Set(
      chosen.map((c) => (c.dish.category ?? "").toLowerCase()).filter((c) => c !== "")
    );

    const affordable = candidates.filter(
      (candidate) =>
        !chosen.includes(candidate) &&
        round(spent + candidate.price.amount) <= ceiling
    );
    if (affordable.length === 0) break;

    affordable.sort((a, b) => {
      const aNew = categories.has((a.dish.category ?? "").toLowerCase()) ? 1 : 0;
      const bNew = categories.has((b.dish.category ?? "").toLowerCase()) ? 1 : 0;
      return (
        aNew - bNew ||
        b.eligibleIds.size - a.eligibleIds.size ||
        byPriceThenId(a, b)
      );
    });

    const next = affordable[0];
    chosen.push(next);
    spent = round(spent + next.price.amount);
  }

  return toOrderLines(chosen, "shared");
}

// ---------------------------------------------------------------------------
// Individual-plate selection
// ---------------------------------------------------------------------------

/**
 * Selection when everyone orders their own dish.
 *
 * Each diner takes the cheapest thing they can safely eat. There is no
 * enrichment stage: once every diner has a plate, adding more would be ordering
 * food nobody asked for.
 *
 * Returns `null` when the budget cannot give everyone a plate.
 */
function selectIndividual(
  candidates: readonly Candidate[],
  toFeed: readonly Diner[],
  budget: Budget | null
): OrderLine[] | null {
  const ceiling = budget?.amount ?? Number.POSITIVE_INFINITY;

  /** dish id → diners assigned to it */
  const assignments = new Map<string, { candidate: Candidate; diners: Diner[] }>();
  let spent = 0;

  // Diners are processed in a stable order so the plan is reproducible.
  const ordered = [...toFeed].sort((a, b) => a.id.localeCompare(b.id));

  for (const diner of ordered) {
    // `candidates` is pre-sorted by (price, id), so the first eligible entry is
    // deterministically the cheapest safe dish for this diner.
    const pick = candidates.find((candidate) => candidate.eligibleIds.has(diner.id));
    if (pick === undefined) return null;

    if (round(spent + pick.price.amount) > ceiling) return null;

    spent = round(spent + pick.price.amount);
    const existing = assignments.get(pick.dish.id);
    if (existing === undefined) {
      assignments.set(pick.dish.id, { candidate: pick, diners: [diner] });
    } else {
      existing.diners.push(diner);
    }
  }

  return [...assignments.values()].map(({ candidate, diners }) => ({
    dish: candidate.dish,
    forDinerIds: diners.map((d) => d.id),
    quantity: diners.length,
    amount: round(candidate.price.amount * diners.length),
  }));
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Converts chosen candidates into order lines, in a stable display order. */
function toOrderLines(
  chosen: readonly Candidate[],
  servingModel: ServingModel
): OrderLine[] {
  return [...chosen].sort(byPriceThenId).map((candidate) => ({
    dish: candidate.dish,
    forDinerIds: candidate.eligible.map((d) => d.id),
    quantity: servingModel === "shared" ? 1 : candidate.eligible.length,
    amount: candidate.price.amount,
  }));
}
