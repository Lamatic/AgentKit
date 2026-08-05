import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planTable } from "../lib/table-solver";
import { enrichDishes } from "../lib/allergen-engine";
import type { Budget, Diner, RawDish } from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dish(
  nameOriginal: string,
  priceRaw: string,
  likelyIngredients: string[] = [],
  extra: Partial<RawDish> = {}
): RawDish {
  return { nameOriginal, priceRaw, likelyIngredients, ...extra };
}

function diner(id: string, overrides: Partial<Diner> = {}): Diner {
  return {
    id,
    label: id,
    avoidAllergens: [],
    diet: null,
    dislikes: [],
    ...overrides,
  };
}

const EUR = (amount: number): Budget => ({ amount, currency: "EUR" });

/** Builds a plan from raw dishes, enriching them the way the API route does. */
function plan(
  raws: RawDish[],
  diners: Diner[],
  budget: Budget | null = null,
  options: { servingModel?: "shared" | "individual"; maxDishes?: number } = {}
) {
  return planTable({
    dishes: enrichDishes(raws, "EUR"),
    diners,
    budget,
    ...options,
  });
}

/** Dish names appearing in an order, for readable assertions. */
function namesIn(result: ReturnType<typeof plan>): string[] {
  return result.order.map((line) => line.dish.nameOriginal).sort();
}

// A small menu reused across the guarantee tests.
const MENU: RawDish[] = [
  dish("Green Salad", "€6", ["lettuce", "olive oil"], { category: "starter" }),
  dish("Almond Cake", "€5", ["almond", "sugar"], { category: "dessert" }),
  dish("Prawn Risotto", "€18", ["prawn", "rice"], { category: "main" }),
  dish("Mushroom Risotto", "€14", ["mushroom", "rice"], { category: "main" }),
  dish("Pork Belly", "€16", ["pork"], { category: "main" }),
];

// ---------------------------------------------------------------------------
// Guarantee 1 — allergen elimination is absolute
// ---------------------------------------------------------------------------

describe("planTable — allergen conflicts are eliminated, never traded off", () => {
  // ── 1. The headline case ──
  it("never orders a nut dish when a nut-allergic diner is at the table", () => {
    const party = [
      diner("priya", { avoidAllergens: ["tree-nuts"] }),
      diner("sam"),
    ];

    for (const budget of [EUR(10), EUR(50), EUR(1000), null]) {
      const result = plan(MENU, party, budget);
      assert.ok(
        !namesIn(result).includes("Almond Cake"),
        `Almond Cake was ordered with budget ${budget?.amount ?? "unlimited"}`
      );
    }
  });

  // ── 2. The adversarial case: the unsafe dish is the cheapest way to feed everyone ──
  it("does not order the unsafe dish even when it is the only affordable option", () => {
    // Almond Cake at €4 is the cheapest thing on this menu by a wide margin.
    // A budget-driven solver that treated the allergy as a penalty rather than
    // an elimination would take it. This one cannot see it at all.
    const menu = [
      dish("Almond Cake", "€4", ["almond"]),
      dish("Plain Rice", "€9", ["rice"]),
    ];
    const party = [diner("priya", { avoidAllergens: ["tree-nuts"] })];

    const result = plan(menu, party, EUR(10));

    assert.equal(result.feasible, true);
    assert.deepEqual(namesIn(result), ["Plain Rice"]);
    assert.ok(
      result.rejected.some(
        (r) => r.reason === "allergen-conflict" && r.dishId.includes("almond")
      ),
      "the cake must be rejected for the allergy, on the record"
    );
  });

  it("returns no order at all rather than an unsafe one", () => {
    // The only dish is unsafe for the only diner.
    const result = plan(
      [dish("Almond Cake", "€4", ["almond"])],
      [diner("priya", { avoidAllergens: ["tree-nuts"] })],
      EUR(100)
    );

    assert.equal(result.feasible, false);
    assert.deepEqual(result.order, []);
    assert.equal(result.unfed.length, 1);
  });

  // ── 3. Applies across the whole party ──
  it("respects every diner's allergies, not just the first", () => {
    const party = [
      diner("a"),
      diner("b"),
      diner("c", { avoidAllergens: ["crustaceans"] }),
    ];
    const result = plan(MENU, party, EUR(100));

    for (const line of result.order) {
      assert.ok(
        !line.forDinerIds.includes("c") ||
          !line.dish.allergens.some((h) => h.allergen === "crustaceans"),
        "a crustacean dish was assigned to the diner avoiding crustaceans"
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Guarantee 2 — the budget is a ceiling
// ---------------------------------------------------------------------------

describe("planTable — the budget is a hard ceiling", () => {
  // ── 4. Never exceeded ──
  it("never returns a total above the budget", () => {
    for (const amount of [15, 20, 25, 30, 40, 60, 100]) {
      const result = plan(MENU, [diner("a"), diner("b")], EUR(amount));
      if (result.feasible) {
        assert.ok(
          result.totalAmount <= amount,
          `total ${result.totalAmount} exceeded budget ${amount}`
        );
      }
    }
  });

  it("reports the remaining budget consistently with the total", () => {
    const result = plan(MENU, [diner("a")], EUR(40));
    assert.equal(result.remaining, Math.round((40 - result.totalAmount) * 100) / 100);
  });

  // ── 5. Infeasible is declared, not faked ──
  it("declares infeasible rather than suggesting an over-budget order", () => {
    // Cheapest dish is €6; a €3 budget cannot buy anything.
    const result = plan(MENU, [diner("a")], EUR(3));

    assert.equal(result.feasible, false);
    assert.deepEqual(result.order, []);
    assert.equal(result.totalAmount, 0);
    assert.ok(
      result.infeasibleReason !== null && result.infeasibleReason.length > 0,
      "an infeasible plan must explain itself"
    );
  });

  it("declares infeasible when the budget cannot feed the whole party", () => {
    // Two diners with disjoint needs: the vegetarian can only eat the €14
    // risotto, and pork-eater aside, together they cost more than €10.
    const menu = [
      dish("Mushroom Risotto", "€14", ["mushroom", "rice"]),
      dish("Pork Belly", "€9", ["pork"]),
    ];
    const party = [diner("veg", { diet: "vegetarian" }), diner("any")];

    const result = plan(menu, party, EUR(10));

    assert.equal(result.feasible, false);
    assert.deepEqual(result.order, []);
  });

  // ── 6. A dish costing more than the whole budget is rejected up front ──
  it("rejects a dish whose single serving exceeds the entire budget", () => {
    const result = plan(MENU, [diner("a")], EUR(10));
    assert.ok(
      result.rejected.some((r) => r.reason === "over-budget"),
      "the €18 risotto should be rejected as over-budget against a €10 budget"
    );
  });

  // ── 7. No budget means no ceiling ──
  it("plans without a budget", () => {
    const result = plan(MENU, [diner("a")], null);
    assert.equal(result.feasible, true);
    assert.equal(result.remaining, null);
    assert.ok(result.order.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Guarantee 3 — unpriced dishes are excluded, never assumed free
// ---------------------------------------------------------------------------

describe("planTable — unreadable prices", () => {
  // ── 8. The failure that would quietly break everything ──
  it("excludes an unpriced dish instead of treating it as free", () => {
    const menu = [
      dish("Market Fish", "market price", ["cod"]),
      dish("Green Salad", "€6", ["lettuce"]),
    ];
    const result = plan(menu, [diner("a")], EUR(30));

    assert.ok(
      !namesIn(result).includes("Market Fish"),
      "a dish with no readable price must not enter the order"
    );
    assert.ok(
      result.rejected.some((r) => r.reason === "no-price"),
      "and it must be reported as such"
    );
  });

  it("warns the user about unreadable prices", () => {
    const menu = [
      dish("Market Fish", "market price", ["cod"]),
      dish("Green Salad", "€6", ["lettuce"]),
    ];
    const result = plan(menu, [diner("a")], EUR(30));

    assert.ok(
      result.warnings.some((w) => w.toLowerCase().includes("price")),
      "an unreadable price is worth telling the user about"
    );
  });

  // ── 9. Unreadable lines ──
  it("excludes and reports unreadable menu lines", () => {
    const menu = [
      dish("???", "€8", [], { confidence: "unknown" }),
      dish("Green Salad", "€6", ["lettuce"]),
    ];
    const result = plan(menu, [diner("a")], EUR(30));

    assert.deepEqual(namesIn(result), ["Green Salad"]);
    assert.ok(result.rejected.some((r) => r.reason === "unreadable"));
    assert.ok(result.warnings.some((w) => w.includes("could not be read")));
  });

  // ── 10. Currency mismatch ──
  it("refuses to compare a differently-denominated price with the budget", () => {
    const menu = [
      dish("Imported Special", "¥3000", ["rice"]),
      dish("Green Salad", "€6", ["lettuce"]),
    ];
    const result = plan(menu, [diner("a")], EUR(30));

    assert.ok(!namesIn(result).includes("Imported Special"));
    assert.ok(result.rejected.some((r) => r.reason === "currency-mismatch"));
  });

  it("rejects a mixed-currency menu even when there is no budget", () => {
    // Without a budget there is no ceiling to enforce, but the plan still
    // reports a total. Summing yen into a euro total produces a number that
    // means nothing, so the mismatch is rejected either way.
    const menu = [
      dish("Green Salad", "€6", ["lettuce"]),
      dish("Imported Special", "¥3000", ["rice"]),
    ];
    const result = plan(menu, [diner("a")], null);

    assert.ok(!namesIn(result).includes("Imported Special"));
    assert.ok(
      result.rejected.some(
        (r) => r.reason === "currency-mismatch" && r.detail.includes("totalled")
      ),
      "the reason should explain it cannot be totalled, not blame a budget"
    );
    assert.equal(result.currency, "EUR");
  });
});

// ---------------------------------------------------------------------------
// Coverage — everyone eats, or is named
// ---------------------------------------------------------------------------

describe("planTable — coverage", () => {
  // ── 11. Everyone fed ──
  it("gives every fed diner at least one dish", () => {
    const party = [
      diner("priya", { diet: "vegetarian", avoidAllergens: ["tree-nuts"] }),
      diner("sam", { avoidAllergens: ["crustaceans"] }),
      diner("alex"),
    ];
    const result = plan(MENU, party, EUR(60));

    assert.equal(result.feasible, true);

    for (const d of party) {
      if (result.unfed.some((u) => u.id === d.id)) continue;
      assert.ok(
        result.order.some((line) => line.forDinerIds.includes(d.id)),
        `${d.id} has nothing to eat in this order`
      );
    }
  });

  // ── 12. Nobody is silently starved ──
  it("names a diner for whom nothing on the menu is safe", () => {
    const menu = [dish("Pork Belly", "€8", ["pork"])];
    const party = [diner("veg", { diet: "vegetarian" }), diner("alex")];
    const result = plan(menu, party, EUR(50));

    assert.deepEqual(result.unfed.map((d) => d.id), ["veg"]);
    assert.ok(
      result.warnings.some((w) => w.includes("veg")),
      "an unfed diner must be surfaced, not silently dropped"
    );
  });

  it("still feeds the rest of the table when one diner's diet excludes everything", () => {
    const menu = [dish("Pork Belly", "€8", ["pork"])];
    const party = [diner("veg", { diet: "vegetarian" }), diner("alex")];
    const result = plan(menu, party, EUR(50));

    assert.equal(result.feasible, true);
    assert.ok(result.order.some((line) => line.forDinerIds.includes("alex")));
  });

  // ── 13. Diners priced out are not reported as unfeedable ──
  it("distinguishes 'nothing is safe for you' from 'nothing safe is affordable'", () => {
    // The vegetarian's only safe dish exists but costs more than the budget.
    // Saying "nothing here is safe for you" would be false; the obstacle is money.
    const menu = [
      dish("Mushroom Risotto", "€14", ["mushroom", "rice"]),
      dish("Pork Belly", "€9", ["pork"]),
    ];
    const party = [diner("veg", { diet: "vegetarian" }), diner("any")];

    const result = plan(menu, party, EUR(10));

    assert.deepEqual(result.unfed, [], "the vegetarian is priced out, not unfeedable");
    assert.equal(result.feasible, false);
    assert.ok(result.infeasibleReason?.includes("10"));
  });
});

// ---------------------------------------------------------------------------
// Cross-contamination — the shared-table rule
// ---------------------------------------------------------------------------

describe("planTable — allergens escalate to the whole table when sharing", () => {
  const menu = [dish("Prawn Toast", "€8", ["prawn", "wheat"])];
  const party = [
    diner("sam", { avoidAllergens: ["crustaceans"] }),
    diner("alex"),
  ];

  // ── 14. Shared plates ──
  it("keeps an allergen off the table entirely when plates are shared", () => {
    // Alex could eat prawn toast. But serving spoons get swapped and plates get
    // passed, so a shellfish dish at Sam's table is a shellfish risk to Sam.
    const result = plan(menu, party, EUR(50), { servingModel: "shared" });

    assert.deepEqual(result.order, []);
    assert.ok(
      result.rejected.some(
        (r) => r.reason === "allergen-conflict" && r.detail.includes("shared plates")
      ),
      "the exclusion must explain that sharing is the reason"
    );
  });

  // ── 15. Individual plates ──
  it("allows the dish for diners who can eat it when plates are not shared", () => {
    // Separate plates, no shared serving — Alex may have it, Sam may not.
    const result = plan(menu, party, EUR(50), { servingModel: "individual" });

    assert.equal(result.order.length, 1);
    assert.deepEqual(result.order[0].forDinerIds, ["alex"]);
    assert.deepEqual(result.unfed.map((d) => d.id), ["sam"]);
  });

  // ── 16. Diets do not escalate ──
  it("does not escalate dietary requirements to the whole table", () => {
    // A vegetarian is not harmed by someone else ordering pork. Only allergies
    // are a shared-plate hazard.
    const porkMenu = [dish("Pork Belly", "€9", ["pork"])];
    const vegParty = [diner("veg", { diet: "vegetarian" }), diner("alex")];

    const result = plan(porkMenu, vegParty, EUR(50), { servingModel: "shared" });

    assert.equal(result.order.length, 1);
    assert.deepEqual(result.order[0].forDinerIds, ["alex"]);
  });
});

// ---------------------------------------------------------------------------
// Auditability
// ---------------------------------------------------------------------------

describe("planTable — auditability", () => {
  // ── 13. Every dish accounted for exactly once ──
  it("places every input dish in either the order or the rejection list", () => {
    const party = [diner("a", { avoidAllergens: ["tree-nuts"] }), diner("b")];
    const menu = [
      ...MENU,
      dish("Mystery", "no price", ["rice"]),
      dish("???", "€5", [], { confidence: "unknown" }),
    ];

    const result = plan(menu, party, EUR(45));

    const orderedIds = result.order.map((line) => line.dish.id);
    const rejectedIds = result.rejected.map((r) => r.dishId);
    const accountedFor = [...orderedIds, ...rejectedIds].sort();
    const allIds = enrichDishes(menu, "EUR").map((d) => d.id).sort();

    assert.deepEqual(accountedFor, allIds);
    assert.equal(
      new Set(accountedFor).size,
      accountedFor.length,
      "no dish should be accounted for twice"
    );
  });

  it("gives every rejection a non-empty reason", () => {
    const result = plan(MENU, [diner("a", { avoidAllergens: ["tree-nuts"] })], EUR(20));
    for (const rejection of result.rejected) {
      assert.ok(rejection.detail.length > 0, `${rejection.dishId} has no detail`);
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("planTable — determinism", () => {
  // ── 14. Same input, byte-identical output ──
  it("returns deeply equal results for the same input run twice", () => {
    const party = [diner("a", { diet: "vegetarian" }), diner("b")];
    const first = plan(MENU, party, EUR(40));
    const second = plan(MENU, party, EUR(40));
    assert.deepStrictEqual(first, second);
  });

  // ── 15. Input order must not matter ──
  it("selects the same dishes regardless of the order they arrive in", () => {
    const party = [diner("a", { diet: "vegetarian" }), diner("b")];
    const forward = plan(MENU, party, EUR(40));
    const reversed = plan([...MENU].reverse(), party, EUR(40));

    assert.deepEqual(namesIn(forward), namesIn(reversed));
    assert.equal(forward.totalAmount, reversed.totalAmount);
  });
});

// ---------------------------------------------------------------------------
// Selection quality
// ---------------------------------------------------------------------------

describe("planTable — selection quality", () => {
  // ── 16. Variety when there is money for it ──
  it("spends surplus budget on more than one category", () => {
    const result = plan(MENU, [diner("a")], EUR(60));
    const categories = new Set(
      result.order.map((line) => line.dish.category).filter(Boolean)
    );
    assert.ok(
      categories.size > 1,
      "with €60 and a five-dish menu the order should not be single-category"
    );
  });

  it("respects maxDishes", () => {
    const result = plan(MENU, [diner("a")], EUR(100), { maxDishes: 2 });
    assert.ok(result.order.length <= 2);
  });

  // ── 17. The improvement pass ──
  it("prefers a cheaper dish that covers the same diners", () => {
    // Both dishes are safe for everyone; the solver should take the cheaper.
    const menu = [
      dish("Expensive Rice", "€20", ["rice"], { category: "main" }),
      dish("Cheap Rice", "€7", ["rice"], { category: "main" }),
    ];
    const result = plan(menu, [diner("a")], EUR(21), { maxDishes: 1 });

    assert.deepEqual(namesIn(result), ["Cheap Rice"]);
    assert.equal(result.totalAmount, 7);
  });

  // ── 18. Coverage beats cheapness when they conflict ──
  it("pays more when the cheap dish cannot feed everyone", () => {
    const menu = [
      dish("Pork Bun", "€5", ["pork"], { category: "main" }),
      dish("Veg Bun", "€9", ["cabbage"], { category: "main" }),
    ];
    const party = [diner("veg", { diet: "vegetarian" }), diner("any")];

    const result = plan(menu, party, EUR(30));

    assert.ok(
      namesIn(result).includes("Veg Bun"),
      "the vegetarian must be fed even though the pork bun is cheaper"
    );
  });
});

// ---------------------------------------------------------------------------
// Serving models
// ---------------------------------------------------------------------------

describe("planTable — serving models", () => {
  // ── 19. Individual plates ──
  it("gives each diner their own plate and charges per serving", () => {
    const menu = [dish("Rice Bowl", "€10", ["rice"], { category: "main" })];
    const party = [diner("a"), diner("b"), diner("c")];

    const result = plan(menu, party, EUR(40), { servingModel: "individual" });

    assert.equal(result.feasible, true);
    assert.equal(result.order.length, 1, "one dish, ordered three times");
    assert.equal(result.order[0].quantity, 3);
    assert.equal(result.order[0].amount, 30);
    assert.equal(result.totalAmount, 30);
  });

  it("declares infeasible when individual plates exceed the budget", () => {
    const menu = [dish("Rice Bowl", "€10", ["rice"])];
    const party = [diner("a"), diner("b"), diner("c")];

    const result = plan(menu, party, EUR(25), { servingModel: "individual" });

    assert.equal(result.feasible, false);
    assert.deepEqual(result.order, []);
  });

  // ── 20. Sharing counts a dish once ──
  it("charges a shared dish once however many diners it feeds", () => {
    const menu = [dish("Rice Bowl", "€10", ["rice"])];
    const party = [diner("a"), diner("b"), diner("c")];

    const result = plan(menu, party, EUR(40), { servingModel: "shared", maxDishes: 1 });

    assert.equal(result.order[0].quantity, 1);
    assert.equal(result.totalAmount, 10);
    assert.deepEqual(result.order[0].forDinerIds.sort(), ["a", "b", "c"]);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("planTable — edge cases", () => {
  // ── 21. Empty inputs ──
  it("handles an empty menu", () => {
    const result = plan([], [diner("a")], EUR(50));
    assert.equal(result.feasible, false);
    assert.deepEqual(result.order, []);
    assert.ok(result.infeasibleReason !== null);
  });

  it("handles a menu where nothing is readable", () => {
    const menu = [dish("???", "€5", [], { confidence: "unknown" })];
    const result = plan(menu, [diner("a")], EUR(50));
    assert.equal(result.feasible, false);
    assert.deepEqual(result.order, []);
  });

  // ── 22. A single diner with no constraints ──
  it("plans for one unconstrained diner", () => {
    const result = plan(MENU, [diner("solo")], EUR(20));
    assert.equal(result.feasible, true);
    assert.ok(result.order.length >= 1);
    assert.ok(result.totalAmount <= 20);
  });
});
