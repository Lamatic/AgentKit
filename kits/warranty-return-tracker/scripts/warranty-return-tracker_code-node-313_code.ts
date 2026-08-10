
const todayDate = workflow.triggerNode_1.output.today_date;
const extracted = {{InstructorLLMNode_194.output}};

function parseDate(value) {
  if (!value || typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function toISO(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days
    )
  );
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addMonths(date, months) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonth = month + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalisedMonth = ((targetMonth % 12) + 12) % 12;

  const finalDay = Math.min(
    day,
    daysInMonth(targetYear, normalisedMonth)
  );

  return new Date(
    Date.UTC(targetYear, normalisedMonth, finalDay)
  );
}

function daysBetween(from, to) {
  return Math.round(
    (to.getTime() - from.getTime()) / 86400000
  );
}

function classify(days) {
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 7) return "urgent";
  if (days <= 30) return "upcoming";
  return "safe";
}

function decideAction(
  returnStatus,
  warrantyStatus,
  returnDays,
  warrantyDays,
  purchaseDate,
  item
) {
  const returnPolicyKnown =
    Number(item?.return_policy?.window_days) >= 0;
  

  const warrantyKnown =
    Number(item?.warranty?.period_months) >= 0;

  // Policy terms exist, but we cannot calculate deadlines
  // without the purchase date.
  if (!purchaseDate && (returnPolicyKnown || warrantyKnown)) {
    return {
      action: "confirm_purchase_date",
      reason:
        "Policy terms were found, but the purchase date is required to calculate return and warranty deadlines."
    };
  }

  // Neither policy was provided.
  if (!returnPolicyKnown && !warrantyKnown) {
    return {
      action: "verify_policy_information",
      reason:
        "No return period or warranty terms were stated in the supplied purchase information."
    };
  }

  // Return policy missing, warranty exists.
  if (!returnPolicyKnown) {
    return {
      action: "verify_return_policy",
      reason:
        "No return period was stated in the supplied purchase information."
    };
  }

  // Warranty missing, return policy exists.
  if (!warrantyKnown) {
    if (returnStatus === "expired") {
      return {
        action: "verify_warranty",
        reason:
          "The return window has expired and no warranty information was stated; verify coverage with the manufacturer or retailer."
      };
    }

    if (returnStatus === "urgent") {
      return {
        action: "return_now",
        reason:
          `Return window remains active and expires in ${returnDays} day(s).`
      };
    }

    return {
      action: "monitor_return_window",
      reason:
        `Return window is still open (${returnDays} days remaining); warranty terms were not stated.`
    };
  }

  // Both return and warranty have expired.
  if (
    returnStatus === "expired" &&
    warrantyStatus === "expired"
  ) {
    return {
      action: "coverage_expired",
      reason:
        "Both the return window and the warranty period have expired."
    };
  }

  // Return expired, but warranty remains available.
  if (returnStatus === "expired") {
    return {
      action: "check_warranty",
      reason:
        "Return window has expired, but the stated warranty remains active."
    };
  }

  // Return deadline is close.
  if (returnStatus === "urgent") {
    return {
      action: "return_now",
      reason:
        `Return window remains active and expires in ${returnDays} day(s).`
    };
  }

  return {
    action: "monitor_return_window",
    reason:
      `Return window is still open (${returnDays} days remaining).`
  };
}
function computeItem(item, purchaseDate, today) {
  let returnDeadline = null;

  const returnWindowDays = Number(
  item?.return_policy?.window_days
);

if (
  purchaseDate &&
  Number.isFinite(returnWindowDays) &&
  returnWindowDays >= 0
) {
  returnDeadline = addDays(
    purchaseDate,
    returnWindowDays
  );
}

  const returnDays =
    returnDeadline
      ? daysBetween(today, returnDeadline)
      : null;

  const returnStatus = classify(returnDays);

  let warrantyDeadline = null;

  const warrantyPeriodMonths = Number(
  item?.warranty?.period_months
);

if (
  purchaseDate &&
  Number.isFinite(warrantyPeriodMonths) &&
  warrantyPeriodMonths >= 0
) {
  warrantyDeadline = addMonths(
    purchaseDate,
    warrantyPeriodMonths
  );
}

  const warrantyDays =
    warrantyDeadline
      ? daysBetween(today, warrantyDeadline)
      : null;

  const warrantyStatus = classify(warrantyDays);

  const recommendation = decideAction(
  returnStatus,
  warrantyStatus,
  returnDays,
  warrantyDays,
  purchaseDate,
  item
);

  return {
    name: item.name,
    price: item.price ?? null,

    return_deadline:
      returnDeadline ? toISO(returnDeadline) : null,

    return_days_remaining: returnDays,
    return_status: returnStatus,

    return_source_text:
      item.return_policy?.source_text ?? null,

    warranty_deadline:
      warrantyDeadline ? toISO(warrantyDeadline) : null,

    warranty_days_remaining: warrantyDays,
    warranty_status: warrantyStatus,

    warranty_source_text:
      item.warranty?.source_text ?? null,

    recommended_action: recommendation.action,
    recommendation_reason: recommendation.reason
  };
}

const today = parseDate(todayDate);

if (!today) {
  output = {
    purchase: null,
    items: [],
    needs_confirmation: false,
    missing_required_fields: [],
    digest: "",
    parse_error: true,
    error_code: "INVALID_TODAY_DATE"
  };
} else {
  const purchaseDate = parseDate(
    extracted?.purchase?.purchase_date
  );

  const missingRequiredFields = [];

  if (!purchaseDate) {
    missingRequiredFields.push("purchase_date");
  }

  const items = (extracted?.items ?? []).map(item =>
    computeItem(item, purchaseDate, today)
  );

  const urgencyRank = {
    expired: 0,
    urgent: 1,
    upcoming: 2,
    safe: 3,
    unknown: 4
  };

  items.sort((a, b) => {
    const rankA = Math.min(
      urgencyRank[a.return_status],
      urgencyRank[a.warranty_status]
    );

    const rankB = Math.min(
      urgencyRank[b.return_status],
      urgencyRank[b.warranty_status]
    );

    return rankA - rankB;
  });
  const describe = (label, status, days, deadline, policyKnown) => {
  if (status === "unknown") {
    if (policyKnown) {
      return `${label} terms found, but deadline unavailable`;
    }

    return `${label} not stated`;
  }

  if (status === "expired") {
    return `${label} expired ${Math.abs(days)} day(s) ago (was ${deadline})`;
  }

  return `${label} ${status}: ${days} days remaining, deadline ${deadline}`;
};

const actionLabels = {
  return_now: "Return now.",
  monitor_return_window: "Monitor return window.",
  check_warranty: "Check warranty coverage.",
  verify_return_policy: "Verify return policy.",
  verify_warranty: "Verify warranty coverage.",
  coverage_expired: "No coverage remains.",
  verify_policy_information: "Verify policy information.",
  confirm_purchase_date: "Confirm purchase date."
};

const digest = items
  .map(item => {
    const returnPolicyKnown =
      Boolean(item.return_source_text);

    const warrantyPolicyKnown =
      Boolean(item.warranty_source_text);

    return (
      `${item.name} — ` +
      `${describe(
        "return",
        item.return_status,
        item.return_days_remaining,
        item.return_deadline,
        returnPolicyKnown
      )} | ` +
      `${describe(
        "warranty",
        item.warranty_status,
        item.warranty_days_remaining,
        item.warranty_deadline,
        warrantyPolicyKnown
      )} | ` +
      `Action: ${actionLabels[item.recommended_action]}`
    );
  })
  .join("\n");

output = {
  purchase: extracted.purchase,
  items,
  needs_confirmation:
    missingRequiredFields.length > 0,
  missing_required_fields:
    missingRequiredFields,
  digest,
  parse_error: false,
  error_code: ""
};
}