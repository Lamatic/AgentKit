"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import config from "@/lamatic-config.json";

const travelPlannerFlow = (config.flows as Record<string, any> | undefined)
  ?.travelPlanner;

if (!travelPlannerFlow) {
  throw new Error("travelPlanner flow not found in lamatic-config.json");
}

export interface TravelPreferences {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  flightClass?: string;
  activities: string[];
}

export interface TravelSegment {
  time?: string;
  activity: string;
  location?: string;
  details?: string;
  cost?: number;
  link?: string;
}

export interface TravelDayPlan {
  title: string;
  location?: string;
  description?: string;
  segments: TravelSegment[];
}

export interface FlightOption {
  airline?: string;
  from?: string;
  to?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  price?: number;
  currency?: string;
  bookingLink?: string;
  notes?: string;
}

export interface StayOption {
  name: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  price?: number;
  currency?: string;
  link?: string;
  description?: string;
  rating?: number;
}

export interface ActivityOption {
  name: string;
  category?: string;
  location?: string;
  time?: string;
  description?: string;
  price?: number;
  currency?: string;
  link?: string;
}

export interface BudgetBreakdownItem {
  label: string;
  amount: number;
  currency?: string;
}

export interface BudgetSummary {
  total?: number;
  currency?: string;
  breakdown: BudgetBreakdownItem[];
  notes?: string;
}

export interface VisualizationResource {
  label: string;
  url?: string;
  type?: string;
  description?: string;
  embedHtml?: string;
}

export interface BookingTask {
  title: string;
  description?: string;
  link?: string;
  status?: string;
}

export interface TripSummary {
  destination?: string;
  dates?: string;
  duration?: string;
  totalEstimatedCost?: number;
  travelers?: number;
}

export interface FlightLeg extends FlightOption {
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
}

export interface FlightItinerary {
  outbound?: FlightLeg;
  return?: FlightLeg;
}

export interface NormalizedTravelPlan {
  overview?: string;
  keyHighlights: string[];
  itinerary: TravelDayPlan[];
  flights: FlightOption[];
  stays: StayOption[];
  activities: ActivityOption[];
  budget?: BudgetSummary;
  visualizations: VisualizationResource[];
  bookingTasks: BookingTask[];
  references: string[];
  travelTips: string[];
  nextSteps: string[];
  tripSummary?: TripSummary;
  flightItinerary?: FlightItinerary;
  accommodation?: StayOption;
  raw: unknown;
}

export interface PlanTripSuccess {
  success: true;
  status?: string;
  plan: NormalizedTravelPlan;
}

export interface PlanTripError {
  success: false;
  error: string;
}

export type PlanTripResponse = PlanTripSuccess | PlanTripError;

const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value === undefined || value === null) return [];
  return [value as T];
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const cleanObject = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

const parseJson = (value: unknown) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const parseSegments = (value: unknown): TravelSegment[] => {
  return toArray<any>(value)
    .map((segment) => {
      const segmentObj =
        typeof segment === "string" ? { activity: segment } : segment;
      const activity =
        segmentObj?.activity ?? segmentObj?.title ?? segmentObj?.name ?? "";
      if (!activity) return null;
      return cleanObject({
        time: segmentObj?.time ?? segmentObj?.slot ?? segmentObj?.startTime,
        activity,
        location: segmentObj?.location ?? segmentObj?.city ?? segmentObj?.place,
        details: segmentObj?.details ?? segmentObj?.description,
        cost: toNumber(segmentObj?.price ?? segmentObj?.cost),
        link: segmentObj?.link ?? segmentObj?.bookingLink,
      }) as TravelSegment;
    })
    .filter(Boolean) as TravelSegment[];
};

const parseItinerary = (value: unknown): TravelDayPlan[] => {
  const days = toArray<any>(value);
  if (days.length === 0) return [];

  return days
    .map((day, index) => {
      if (typeof day === "string") {
        return {
          title: `Day ${index + 1}`,
          description: day,
          segments: [],
        } satisfies TravelDayPlan;
      }

      const title =
        day?.title ??
        day?.day ??
        day?.label ??
        (day?.date ? `Day ${index + 1} · ${day.date}` : `Day ${index + 1}`);

      const segments = parseSegments(
        day?.segments ?? day?.activities ?? day?.schedule
      );

      return cleanObject({
        title,
        location: day?.location ?? day?.city ?? day?.region,
        description: day?.description ?? day?.summary ?? day?.highlights,
        segments,
      }) as TravelDayPlan;
    })
    .filter(Boolean);
};

const parseFlights = (value: unknown): FlightOption[] => {
  return toArray<any>(value)
    .map((flight) => {
      const airline = flight?.airline ?? flight?.carrier ?? flight?.provider;
      const from = flight?.from ?? flight?.origin;
      const to = flight?.to ?? flight?.destination;
      if (!airline && !from && !to) {
        return null;
      }

      return cleanObject({
        airline,
        from,
        to,
        departure: flight?.departure ?? flight?.depart ?? flight?.startTime,
        arrival: flight?.arrival ?? flight?.arrive ?? flight?.endTime,
        duration: flight?.duration,
        price: toNumber(flight?.price ?? flight?.cost),
        currency: flight?.currency,
        bookingLink: flight?.link ?? flight?.bookingLink,
        notes: flight?.notes ?? flight?.description,
      }) as FlightOption;
    })
    .filter(Boolean) as FlightOption[];
};

const parseStays = (value: unknown): StayOption[] => {
  return toArray<any>(value)
    .map((stay) => {
      const name = stay?.name ?? stay?.hotel ?? stay?.property;
      if (!name) return null;

      return cleanObject({
        name,
        location: stay?.location ?? stay?.address ?? stay?.city,
        checkIn: stay?.checkIn ?? stay?.check_in,
        checkOut: stay?.checkOut ?? stay?.check_out,
        nights: stay?.nights ?? stay?.length,
        price: toNumber(stay?.price ?? stay?.cost),
        currency: stay?.currency,
        link: stay?.link ?? stay?.bookingLink,
        description: stay?.description ?? stay?.notes,
        rating: typeof stay?.rating === "number" ? stay.rating : undefined,
      }) as StayOption;
    })
    .filter(Boolean) as StayOption[];
};

const parseActivities = (value: unknown): ActivityOption[] => {
  return toArray<any>(value)
    .map((activity) => {
      if (typeof activity === "string") {
        return { name: activity } satisfies ActivityOption;
      }

      const name = activity?.name ?? activity?.title;
      if (!name) return null;

      return cleanObject({
        name,
        category: activity?.category ?? activity?.type,
        location: activity?.location ?? activity?.city,
        time: activity?.time ?? activity?.slot,
        description: activity?.description ?? activity?.details,
        price: toNumber(activity?.price ?? activity?.cost),
        currency: activity?.currency,
        link: activity?.link ?? activity?.bookingLink,
      }) as ActivityOption;
    })
    .filter(Boolean) as ActivityOption[];
};

const parseBudget = (value: unknown): BudgetSummary | undefined => {
  if (!value) return undefined;

  const data = Array.isArray(value) ? value : [value];
  const breakdown: BudgetBreakdownItem[] = [];
  let total: number | undefined;
  let currency: string | undefined;
  let notes: string | undefined;

  for (const item of data) {
    if (!item) continue;
    if (item.total !== undefined || item.overall !== undefined) {
      total = toNumber(item.total ?? item.overall) ?? total;
      currency = item.currency ?? currency;
      continue;
    }
    if (item.notes || item.summary) {
      notes = item.notes ?? item.summary;
    }
    if (item.label || item.category || item.type) {
      const label = item.label ?? item.category ?? item.type;
      const amount = toNumber(item.amount ?? item.cost ?? item.price);
      if (label && amount !== undefined) {
        breakdown.push(
          cleanObject({
            label,
            amount,
            currency: item.currency,
          }) as BudgetBreakdownItem
        );
      }
    }
  }

  if (
    breakdown.length === 0 &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const record = value as Record<string, any>;
    const ignoredKeys = new Set(["total", "overall", "currency", "notes", "summary"]);

    for (const [label, amountRaw] of Object.entries(record)) {
      if (ignoredKeys.has(label)) continue;
      const amount = toNumber(amountRaw);
      if (amount === undefined) continue;
      const formattedLabel = label
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      breakdown.push(
        cleanObject({
          label: formattedLabel,
          amount,
          currency: record.currency ?? currency,
        }) as BudgetBreakdownItem
      );
    }

    const inferredTotal =
      toNumber(record.total ?? record.overall) ??
      (breakdown.length
        ? breakdown.reduce((sum, entry) => sum + entry.amount, 0)
        : undefined);
    if (inferredTotal !== undefined) {
      total = inferredTotal;
    }
    currency = record.currency ?? currency;
    if (record.notes || record.summary) {
      notes = record.notes ?? record.summary;
    }
  }

  if (!total && breakdown.length) {
    total = breakdown.reduce((sum, entry) => sum + entry.amount, 0);
  }

  if (total || breakdown.length || notes) {
    return cleanObject({
      total,
      currency,
      breakdown,
      notes,
    }) as BudgetSummary;
  }

  return undefined;
};

const parseVisualizations = (value: unknown): VisualizationResource[] => {
  return toArray<any>(value)
    .map((viz) => {
      const label = viz?.label ?? viz?.title ?? viz?.name;
      const url = viz?.url ?? viz?.link ?? viz?.mapUrl;
      const embed = viz?.embed ?? viz?.iframe;
      if (!label && !url && !embed) return null;

      return cleanObject({
        label: label ?? "Visualization",
        url,
        type: viz?.type ?? viz?.variant,
        description: viz?.description ?? viz?.notes,
        embedHtml: embed,
      }) as VisualizationResource;
    })
    .filter(Boolean) as VisualizationResource[];
};

const parseBookingTasks = (value: unknown): BookingTask[] => {
  return toArray<any>(value)
    .map((task) => {
      if (typeof task === "string") {
        return { title: task } satisfies BookingTask;
      }

      const title = task?.title ?? task?.name;
      if (!title) return null;

      return cleanObject({
        title,
        description: task?.description ?? task?.details,
        link: task?.link ?? task?.bookingLink,
        status: task?.status,
      }) as BookingTask;
    })
    .filter(Boolean) as BookingTask[];
};

const parseStringList = (value: unknown): string[] => {
  return toArray<any>(value)
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const text =
          record.title ??
          record.summary ??
          record.detail ??
          record.description ??
          record.note ??
          record.value ??
          "";
        return typeof text === "string" ? text.trim() : "";
      }
      return "";
    })
    .filter((entry) => entry.length > 0);
};

const parseTripSummary = (value: unknown): TripSummary | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const summary = value as Record<string, any>;
  const result = cleanObject({
    destination: summary.destination ?? summary.location,
    dates: summary.dates ?? summary.date_range,
    duration: summary.duration ?? summary.length,
    totalEstimatedCost: toNumber(summary.total_estimated_cost ?? summary.totalCost ?? summary.total_budget),
    travelers: toNumber(summary.travelers ?? summary.guests),
  }) as TripSummary;

  return Object.keys(result).length > 0 ? result : undefined;
};

const parseFlightLeg = (value: unknown): FlightLeg | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const leg = value as Record<string, any>;
  const legData = cleanObject({
    airline: leg.airline ?? leg.carrier,
    flightNumber: leg.flight_number ?? leg.flightNumber,
    from: leg.from ?? leg.origin ?? leg.departure_airport,
    to: leg.to ?? leg.destination ?? leg.arrival_airport,
    departure: leg.departure_time ?? leg.departure ?? leg.depart,
    arrival: leg.arrival_time ?? leg.arrival ?? leg.arrive,
    duration: leg.duration,
    price: toNumber(leg.price ?? leg.cost ?? leg.max_price),
    currency: leg.currency ?? leg.price_currency,
    bookingLink: leg.booking_link ?? leg.link,
    notes: leg.notes,
    departureAirport: leg.departure_airport,
    arrivalAirport: leg.arrival_airport,
  }) as FlightLeg;

  if (!legData.airline && !legData.from && !legData.to) {
    return undefined;
  }

  return legData;
};

const parseFlightItinerary = (value: unknown): FlightItinerary | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const flights = value as Record<string, any>;
  const outboundLeg = parseFlightLeg(flights.outbound ?? flights.departure ?? flights.departing);
  const returnLeg = parseFlightLeg(flights.return ?? flights.inbound ?? flights.arrival);

  if (!outboundLeg && !returnLeg) {
    return undefined;
  }

  return {
    outbound: outboundLeg,
    return: returnLeg,
  };
};

const flightLegToOption = (leg: FlightLeg): FlightOption => {
  return cleanObject({
    airline: leg.airline,
    from: leg.from ?? leg.departureAirport,
    to: leg.to ?? leg.arrivalAirport,
    departure: leg.departure,
    arrival: leg.arrival,
    duration: leg.duration,
    price: leg.price,
    currency: leg.currency,
    bookingLink: leg.bookingLink,
    notes: leg.flightNumber ? `Flight ${leg.flightNumber}` : leg.notes,
  }) as FlightOption;
};

const parseAccommodationDetail = (value: unknown): StayOption | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const stay = value as Record<string, any>;
  const stayRecord: Record<string, any> = {
    name: stay.hotel_name ?? stay.name ?? stay.property,
    location: stay.address ?? stay.location ?? stay.city,
    checkIn: stay.check_in ?? stay.checkIn,
    checkOut: stay.check_out ?? stay.checkOut,
    nights: toNumber(stay.nights ?? stay.length),
    price: toNumber(stay.total_price ?? stay.price_per_night ?? stay.price),
    currency: stay.currency ?? stay.price_currency,
    link: stay.booking_link ?? stay.link,
    description: stay.description ?? stay.notes,
    rating: typeof stay.rating === "number" ? stay.rating : toNumber(stay.rating),
  };

  const normalizedStay = cleanObject(stayRecord) as StayOption;
  if (!normalizedStay.name) {
    return undefined;
  }
  return normalizedStay;
};

const parseDailyActivitiesPlan = (value: unknown): TravelDayPlan[] => {
  const days = toArray<any>(value);
  if (!days.length) return [];

  return days
    .map((day, index) => {
      const dayNumber =
        typeof day?.day === "number" && Number.isFinite(day.day) ? day.day : index + 1;
      const title = day?.title ?? `Day ${dayNumber}`;
      const description = typeof day?.summary === "string" ? day.summary : undefined;
      const location = day?.location ?? day?.city;
      const activities = toArray<any>(day?.activities);

      const segments = activities
        .map((activity) => {
          if (typeof activity === "string") {
            const trimmed = activity.trim();
            if (!trimmed) return null;
            return cleanObject({
              activity: trimmed,
            }) as TravelSegment;
          }

          if (activity && typeof activity === "object") {
            const record = activity as Record<string, any>;
            const text =
              record.activity ?? record.title ?? record.description ?? record.detail ?? "";
            if (!text || typeof text !== "string") return null;
            return cleanObject({
              time: record.time ?? record.timeslot ?? record.period,
              activity: text,
              location: record.location ?? record.city,
              details: record.details ?? record.notes,
              cost: toNumber(record.price ?? record.cost),
              link: record.link ?? record.booking_link,
            }) as TravelSegment;
          }

          return null;
        })
        .filter(Boolean) as TravelSegment[];

      if (!segments.length && description) {
        segments.push({
          activity: description,
        });
      }

      return cleanObject({
        title,
        location,
        description,
        segments,
      }) as TravelDayPlan;
    })
    .filter((plan) => plan.segments.length > 0);
};

const parseHighlights = (value: unknown): string[] => {
  return parseStringList(value);
};

const parseReferences = (value: unknown): string[] => {
  return toArray<any>(value)
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.url ?? item?.link ?? null;
    })
    .filter((link): link is string => Boolean(link));
};

const normalizeTravelPlan = (raw: unknown): NormalizedTravelPlan => {
  const parsed = parseJson(raw) as Record<string, any> | string | undefined;

  if (!parsed) {
    return {
      overview: undefined,
      keyHighlights: [],
      itinerary: [],
      flights: [],
      stays: [],
      activities: [],
      budget: undefined,
      visualizations: [],
      bookingTasks: [],
      references: [],
      travelTips: [],
      nextSteps: [],
      tripSummary: undefined,
      flightItinerary: undefined,
      accommodation: undefined,
      raw,
    };
  }

  if (typeof parsed === "string") {
    return {
      overview: parsed,
      keyHighlights: [],
      itinerary: [],
      flights: [],
      stays: [],
      activities: [],
      budget: undefined,
      visualizations: [],
      bookingTasks: [],
      references: [],
      travelTips: [],
      nextSteps: [],
      tripSummary: undefined,
      flightItinerary: undefined,
      accommodation: undefined,
      raw,
    };
  }

  let overview =
    parsed.overview ??
    parsed.summary ??
    parsed.description ??
    parsed.planSummary ??
    parsed.resultSummary;

  let itinerary = parseItinerary(
    parsed.itinerary ?? parsed.timeline ?? parsed.dailyPlan ?? parsed.days
  );

  let flights = parseFlights(
    parsed.flights ?? parsed.flightOptions ?? parsed.transport
  );
  let stays = parseStays(
    parsed.accommodations ?? parsed.hotels ?? parsed.stays
  );
  const activities = parseActivities(
    parsed.activities ?? parsed.experiences ?? parsed.recommendations
  );
  let budget = parseBudget(parsed.budget ?? parsed.costs ?? parsed.pricing);
  const visualizations = parseVisualizations(
    parsed.visualizations ?? parsed.maps ?? parsed.routes
  );
  let bookingTasks = parseBookingTasks(
    parsed.booking ?? parsed.nextSteps ?? parsed.actions ?? parsed.booking_next_steps
  );
  const references = parseReferences(
    parsed.references ?? parsed.links ?? parsed.sources
  );
  let keyHighlights = parseHighlights(
    parsed.highlights ?? parsed.keyPoints ?? parsed.takeaways ?? []
  );

  const tripSummary = parseTripSummary(parsed.trip_summary);
  const recommendedItinerary = parsed.recommended_itinerary;
  const flightItinerary = parseFlightItinerary(recommendedItinerary?.flights);
  const accommodation = parseAccommodationDetail(recommendedItinerary?.accommodation);
  const recommendedDaily = parseDailyActivitiesPlan(recommendedItinerary?.daily_activities);
  const travelTips = parseStringList(parsed.travel_tips);
  const nextSteps = parseStringList(parsed.booking_next_steps);

  if (!overview && tripSummary) {
    const destinationText = tripSummary.destination ? ` to ${tripSummary.destination}` : "";
    const durationText = tripSummary.duration ? ` for ${tripSummary.duration}` : "";
    overview = `Journey${destinationText}${durationText}`.trim();
  }

  if (recommendedDaily.length) {
    itinerary = recommendedDaily;
  }

  if (flightItinerary) {
    const itineraryFlights: FlightOption[] = [];
    if (flightItinerary.outbound) {
      itineraryFlights.push(flightLegToOption(flightItinerary.outbound));
    }
    if (flightItinerary.return) {
      itineraryFlights.push(flightLegToOption(flightItinerary.return));
    }
    if (itineraryFlights.length) {
      flights = [...itineraryFlights, ...flights];
    }
  }

  if (accommodation) {
    const existingNames = new Set(stays.map((stay) => stay.name));
    if (!existingNames.has(accommodation.name)) {
      stays = [accommodation, ...stays];
    }
  }

  if (parsed.budget_breakdown) {
    const breakdownBudget = parseBudget(parsed.budget_breakdown);
    if (breakdownBudget) {
      budget = breakdownBudget;
    }
  }

  if (!keyHighlights.length && travelTips.length) {
    keyHighlights = travelTips.slice(0, 3);
  }

  if (nextSteps.length) {
    const taskTitles = new Set(bookingTasks.map((task) => task.title));
    const additionalTasks = nextSteps
      .filter((step) => !taskTitles.has(step))
      .map((step) => ({ title: step } satisfies BookingTask));
    if (additionalTasks.length) {
      bookingTasks = [...bookingTasks, ...additionalTasks];
    }
  }

  return {
    overview,
    keyHighlights,
    itinerary,
    flights,
    stays,
    activities,
    budget,
    visualizations,
    bookingTasks,
    references,
    travelTips,
    nextSteps,
    tripSummary,
    flightItinerary,
    accommodation,
    raw,
  };
};

export async function planTrip(
  preferences: TravelPreferences
): Promise<PlanTripResponse> {
  try {
    const interestsList: string[] = Array.isArray(preferences.activities)
      ? preferences.activities
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    const payload = cleanObject({
      origin: preferences.origin.trim(),
      destination: preferences.destination.trim(),
      start_date: preferences.startDate,
      end_date: preferences.endDate,
      budget: Number.isFinite(preferences.budget)
        ? preferences.budget
        : undefined,
      travelers: Number.isFinite(preferences.travelers)
        ? preferences.travelers
        : undefined,
      flight_class: preferences.flightClass?.trim(),
      interests: interestsList.length > 0 ? interestsList : undefined,
    });

    const response = await lamaticClient.executeFlow(
      travelPlannerFlow.workflowId,
      payload
    );

    const status = response?.status ?? response?.result?.status ?? "unknown";
    const rawResult =
      response?.result?.result ??
      response?.result?.data ??
      response?.result ??
      response;

    const plan = normalizeTravelPlan(rawResult);

    return {
      success: true,
      status,
      plan,
    };
  } catch (error) {
    console.error(
      "[travel-planner] Failed to execute travel planner flow",
      error
    );
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while executing travel planner workflow.";

    return {
      success: false,
      error: message,
    };
  }
}
