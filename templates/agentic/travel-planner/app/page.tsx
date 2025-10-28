"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  planTrip,
  type FlightLeg,
  type NormalizedTravelPlan,
} from "@/actions/orchestrate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Compass,
  DollarSign,
  Earth,
  ExternalLink,
  Globe2,
  Lightbulb,
  ListChecks,
  Loader2,
  MapPinned,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Sparkles,
} from "lucide-react";

const MAX_ACTIVITIES = 3;

interface PlannerFormState {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelers: string;
  flightClass: string;
  activities: string[];
}

const ACTIVITY_OPTIONS: { value: string; label: string }[] = [
  { value: "art", label: "Art & design" },
  { value: "food", label: "Food experiences" },
  { value: "history", label: "History & heritage" },
  { value: "adventure", label: "Adventure" },
  { value: "nature", label: "Nature & outdoors" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "culture", label: "Culture" },
  { value: "family", label: "Family-friendly" },
  { value: "music", label: "Music & events" },
  { value: "architecture", label: "Architecture" },
];

const FLIGHT_CLASS_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const PRESET_TRIPS: { label: string; data: Partial<PlannerFormState> }[] = [
  {
    label: "Lisbon remote work week",
    data: {
      origin: "Madrid, Spain",
      destination: "Lisbon, Portugal",
      startDate: "2026-03-03",
      endDate: "2026-03-10",
      budget: "1800",
      travelers: "2",
      flightClass: "economy",
      activities: ["food", "culture", "nightlife"],
    },
  },
  {
    label: "Tokyo family adventure",
    data: {
      origin: "Los Angeles, USA",
      destination: "Tokyo, Japan",
      startDate: "2026-06-15",
      endDate: "2026-06-25",
      budget: "6500",
      travelers: "4",
      flightClass: "premium_economy",
      activities: ["family", "food", "art"],
    },
  },
  {
    label: "Patagonia trekking escape",
    data: {
      origin: "Buenos Aires, Argentina",
      destination: "El Calafate, Argentina",
      startDate: "2026-11-04",
      endDate: "2026-11-12",
      budget: "3200",
      travelers: "2",
      flightClass: "economy",
      activities: ["adventure", "nature", "history"],
    },
  },
];

const defaultFormState: PlannerFormState = {
  origin: "",
  destination: "",
  startDate: "",
  endDate: "",
  budget: "2500",
  travelers: "2",
  flightClass: "economy",
  activities: [] as string[],
};

const parseNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(parsed, 0);
  }
  return fallback;
};

const formatCurrency = (value?: number, currency = "USD") => {
  if (value === undefined) return undefined;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
};

const TravelPlannerPage = () => {
  const [form, setForm] = useState<PlannerFormState>(defaultFormState);
  const [submittedForm, setSubmittedForm] = useState<PlannerFormState | null>(
    null
  );
  const [plan, setPlan] = useState<NormalizedTravelPlan | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const endDateMin = useMemo(() => {
    if (form.startDate) {
      return form.startDate > today ? form.startDate : today;
    }
    return today;
  }, [form.startDate, today]);

  const isFormIncomplete =
    !form.origin.trim() ||
    !form.destination.trim() ||
    !form.startDate ||
    !form.endDate ||
    form.activities.length === 0;

  const rawOutput = useMemo(() => {
    if (!plan) return "";
    if (typeof plan.raw === "string") return plan.raw;
    try {
      return JSON.stringify(plan.raw, null, 2);
    } catch {
      return String(plan.raw);
    }
  }, [plan]);

  const tripSummaryData = useMemo(() => {
    if (plan?.tripSummary) {
      return plan.tripSummary;
    }
    if (!submittedForm) return null;
    const travelersValue =
      submittedForm.travelers && submittedForm.travelers.length > 0
        ? parseNumber(submittedForm.travelers, 0)
        : undefined;
    return {
      destination: submittedForm.destination || undefined,
      dates:
        submittedForm.startDate && submittedForm.endDate
          ? `${submittedForm.startDate} → ${submittedForm.endDate}`
          : undefined,
      duration: undefined,
      totalEstimatedCost: plan?.budget?.total,
      travelers:
        travelersValue && travelersValue > 0 ? travelersValue : undefined,
    };
  }, [plan, submittedForm]);

  const outboundLeg = plan?.flightItinerary?.outbound;
  const returnLeg = plan?.flightItinerary?.return;
  const fallbackFlights = !outboundLeg && !returnLeg ? plan?.flights ?? [] : [];
  const accommodation =
    plan?.accommodation ??
    (plan?.stays && plan.stays.length > 0 ? plan.stays[0] : undefined);
  const travelTips = plan?.travelTips ?? [];
  const bookingTasks = plan?.bookingTasks ?? [];
  const totalCostDisplay =
    tripSummaryData?.totalEstimatedCost !== undefined
      ? formatCurrency(
          tripSummaryData.totalEstimatedCost,
          plan?.budget?.currency ?? "USD"
        )
      : plan?.budget?.total !== undefined
      ? formatCurrency(plan.budget.total, plan?.budget?.currency ?? "USD")
      : undefined;
  const destinationDisplay =
    tripSummaryData?.destination ?? submittedForm?.destination;
  const datesDisplay =
    tripSummaryData?.dates ??
    (submittedForm?.startDate && submittedForm?.endDate
      ? `${submittedForm.startDate} → ${submittedForm.endDate}`
      : undefined);
  const durationDisplay = tripSummaryData?.duration;
  const travelersDisplay =
    tripSummaryData?.travelers !== undefined
      ? `${tripSummaryData.travelers}`
      : submittedForm?.travelers || undefined;
  const flightClassLabel = submittedForm
    ? FLIGHT_CLASS_OPTIONS.find(
        (option) => option.value === submittedForm.flightClass
      )?.label
    : undefined;

  const handleActivityToggle = (value: string) => {
    setForm((prev) => {
      const alreadySelected = prev.activities.includes(value);
      if (alreadySelected) {
        const nextActivities = prev.activities.filter(
          (activity) => activity !== value
        );
        setActivityError(null);
        return { ...prev, activities: nextActivities };
      }
      if (prev.activities.length >= MAX_ACTIVITIES) {
        setActivityError(`Choose up to ${MAX_ACTIVITIES} interests.`);
        return prev;
      }
      setActivityError(null);
      return { ...prev, activities: [...prev.activities, value] };
    });
  };

  const handlePreset = (data: Partial<PlannerFormState>) => {
    setForm((prev) => ({
      ...prev,
      ...data,
      activities: data.activities ? [...data.activities] : [...prev.activities],
    }));
    setError(null);
    setActivityError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.activities.length === 0) {
      setActivityError(
        "Pick at least one interest so the researcher agents can specialize."
      );
      return;
    }

    setError(null);
    setStatus(undefined);
    setActivityError(null);

    const snapshot: PlannerFormState = {
      ...form,
      activities: [...form.activities],
    };

    setSubmittedForm(snapshot);
    setPlan(null);

    startTransition(async () => {
      const result = await planTrip({
        origin: snapshot.origin,
        destination: snapshot.destination,
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        budget: parseNumber(snapshot.budget, 0),
        travelers: parseNumber(snapshot.travelers, 1),
        flightClass: snapshot.flightClass || undefined,
        activities: snapshot.activities,
      });

      if (!result.success) {
        setPlan(null);
        setStatus(undefined);
        setError(result.error);
        return;
      }

      setPlan(result.plan);
      setStatus(result.status);
    });
  };

  const renderFlightLeg = (leg: FlightLeg | undefined, label: string) => {
    if (!leg) return null;
    const priceLabel =
      leg.price !== undefined
        ? formatCurrency(leg.price, leg.currency ?? "USD")
        : undefined;

    return (
      <div
        key={`${label}-${leg.flightNumber ?? leg.departure ?? leg.arrival}`}
        className="space-y-3 rounded-lg border bg-card/40 p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {label === "Outbound" ? (
              <PlaneTakeoff className="h-4 w-4 text-primary" />
            ) : (
              <PlaneLanding className="h-4 w-4 text-primary" />
            )}
            <span className="font-medium text-foreground">
              {leg.airline ?? "Flight"}
            </span>
          </div>
          {priceLabel && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs"
            >
              {priceLabel}
            </Badge>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {leg.from ?? leg.departureAirport}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {leg.to ?? leg.arrivalAirport}
            </span>
          </div>
          <div className="grid gap-1 text-muted-foreground">
            {leg.departure && <span>Depart: {leg.departure}</span>}
            {leg.arrival && <span>Arrive: {leg.arrival}</span>}
            {leg.duration && <span>Duration: {leg.duration}</span>}
            {leg.flightNumber && <span>Flight: {leg.flightNumber}</span>}
            {leg.notes && <span>{leg.notes}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),transparent_60%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.14),transparent_55%)] bg-white text-slate-900 transition-colors duration-500 dark:bg-background dark:text-foreground">
      <header className="relative overflow-hidden border-b border-border/40 bg-white/80 backdrop-blur-lg dark:bg-background/70">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-24 top-8 h-48 w-48 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-500/20" />
          <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600/10 px-3 py-1 text-sky-700 ring-1 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200"
            >
              <Sparkles className="h-4 w-4 text-sky-500 dark:text-sky-300" />
              Lamatic Multi-Agent Kit
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 drop-shadow-sm md:text-4xl lg:text-5xl dark:text-white">
                Multi-Agent Travel Researcher & Planner
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Design dream itineraries backed by real-time flights, stays, and
                activities. Delegate research to specialized Lamatic agents,
                visualize routes, and ship a booking-ready travel brief.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="secondary"
                className="rounded-full border-none bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-200/60 transition hover:brightness-105 hover:shadow-sky-300/80 dark:shadow-sky-800/40"
              >
                <Link
                  href="https://lamatic.ai/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Lamatic Docs
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-slate-200 bg-white/80 px-6 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <Link
                  href="https://github.com/Lamatic/AgentKit/tree/main/templates/agentic/travel-planner"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Template
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <Card className="relative w-full max-w-sm overflow-hidden border-none bg-white/80 shadow-xl shadow-sky-100/60 ring-1 ring-sky-100/80 dark:bg-slate-900/70 dark:shadow-none dark:ring-sky-500/20">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=60')] bg-cover bg-center opacity-30 mix-blend-overlay dark:opacity-20" />
            <CardHeader className="relative space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Travel snapshot
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                Agents coordinate flights, stays, and experiences—then render a
                booking-ready journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1 rounded-lg bg-white/80 p-3 shadow-sm shadow-sky-100/40 dark:bg-slate-900/60 dark:shadow-none">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Flight scout
                </p>
                <p className="font-semibold text-slate-800 dark:text-sky-100">
                  Live routes & fares
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-white/80 p-3 shadow-sm shadow-sky-100/40 dark:bg-slate-900/60 dark:shadow-none">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Stay curator
                </p>
                <p className="font-semibold text-slate-800 dark:text-sky-100">
                  Hotels & rentals
                </p>
              </div>
              <div className="col-span-2 space-y-1 rounded-lg bg-gradient-to-r from-amber-200/70 to-sky-200/70 p-3 text-slate-800 shadow-sm shadow-amber-100/50 dark:from-amber-500/10 dark:to-sky-500/10 dark:text-slate-100 dark:shadow-none">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Adventure graph
                </p>
                <p className="font-medium">
                  Visual itineraries with budget breakdowns, booking tasks, and
                  shareable briefs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10">
          <section className="space-y-6">
            <Card className="border-none bg-white/90 shadow-xl shadow-sky-100/60 ring-1 ring-slate-200/70 backdrop-blur-sm transition hover:shadow-sky-200/80 dark:bg-slate-900/70 dark:shadow-none dark:ring-slate-700/60">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white">
                  <Compass className="h-5 w-5 text-sky-500 dark:text-sky-300" />
                  Plan a new journey
                </CardTitle>
                <CardDescription>
                  Share the essentials and we will orchestrate research,
                  visualization, and booking-ready output.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin</Label>
                      <Input
                        id="origin"
                        placeholder="e.g. Barcelona, Spain"
                        value={form.origin}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            origin: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        placeholder="e.g. Kyoto, Japan"
                        value={form.destination}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            destination: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={form.startDate}
                        min={today}
                        onChange={(event) => {
                          const rawValue = event.target.value;
                          setForm((prev) => {
                            if (!rawValue) {
                              return { ...prev, startDate: "", endDate: "" };
                            }
                            const normalizedValue =
                              rawValue < today ? today : rawValue;
                            const nextState: PlannerFormState = {
                              ...prev,
                              startDate: normalizedValue,
                            };
                            if (
                              prev.endDate &&
                              prev.endDate < normalizedValue
                            ) {
                              nextState.endDate = normalizedValue;
                            }
                            return nextState;
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={form.endDate}
                        min={endDateMin}
                        onChange={(event) => {
                          const rawValue = event.target.value;
                          setForm((prev) => {
                            if (!rawValue) {
                              return { ...prev, endDate: "" };
                            }
                            const minValue =
                              prev.startDate && prev.startDate > today
                                ? prev.startDate
                                : today;
                            const normalizedValue =
                              rawValue < minValue ? minValue : rawValue;
                            return { ...prev, endDate: normalizedValue };
                          });
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (per trip)</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        step="100"
                        value={form.budget}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            budget: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="travelers">Travelers</Label>
                      <Input
                        id="travelers"
                        type="number"
                        min="1"
                        value={form.travelers}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            travelers: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Flight class</Label>
                      <Select
                        value={form.flightClass}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, flightClass: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLIGHT_CLASS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label>Focus areas (pick up to three)</Label>
                        <p className="text-sm text-muted-foreground">
                          Interests help route tasks to the right research
                          agents and activity providers.
                        </p>
                      </div>
                      <Badge variant="outline">
                        {form.activities.length}/{MAX_ACTIVITIES} selected
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_OPTIONS.map((option) => {
                        const selected = form.activities.includes(option.value);
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleActivityToggle(option.value)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                              selected ? "shadow-md" : "hover:shadow-md"
                            )}
                          >
                            {selected && (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>
                    {activityError && (
                      <Alert variant="destructive">
                        <AlertTitle>Activity selection</AlertTitle>
                        <AlertDescription>{activityError}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Quick starts</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_TRIPS.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePreset(preset.data)}
                          className="inline-flex items-center gap-2 rounded-full"
                        >
                          <Sparkles className="h-4 w-4 text-primary" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      The coordinator agent fans out to flight, lodging,
                      activity, budget, and booking sub-agents.
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isPending || isFormIncomplete}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating plan…
                        </>
                      ) : (
                        <>
                          Generate multi-agent plan
                          <Plane className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>
                  We hit an issue while orchestrating the workflow
                </AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </section>

          {(isPending || plan) && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Itinerary & research output
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Results blend research, visualization, and booking
                    instructions for the preferences above.
                  </p>
                </div>
                {status && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <Globe2 className="h-4 w-4 text-primary" />
                    Status: {status.toUpperCase()}
                  </Badge>
                )}
              </div>

              {isPending && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium">
                        Coordinating planner, flight, hotel, and experience
                        agents…
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Live web search and provider APIs can take a few
                        seconds.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isPending && plan && (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <MapPinned className="h-5 w-5 text-primary" />
                          Overview
                        </CardTitle>
                        <CardDescription>
                          A cross-agent summary that fuses research,
                          availability checks, and suggested flow.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {plan.overview ? (
                          <div className="prose prose-neutral max-w-none dark:prose-invert">
                            <ReactMarkdown>{plan.overview}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No high-level overview returned by the workflow –
                            check the detailed sections below.
                          </p>
                        )}
                        {plan.keyHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {plan.keyHighlights.map((highlight, index) => (
                              <Badge
                                key={`${highlight}-${index}`}
                                variant="secondary"
                                className="rounded-full px-3 py-1"
                              >
                                <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Earth className="h-5 w-5 text-primary" />
                          Trip summary
                        </CardTitle>
                        <CardDescription>
                          Derived from Lamatic's trip summary and the
                          preferences you provided.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Origin
                            </span>
                            <span className="font-medium">
                              {submittedForm?.origin || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Destination
                            </span>
                            <span className="font-medium">
                              {destinationDisplay || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Dates</span>
                            <span className="font-medium">
                              {datesDisplay || "—"}
                            </span>
                          </div>
                          {durationDisplay && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Duration
                              </span>
                              <span className="font-medium">
                                {durationDisplay}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Travelers
                            </span>
                            <span className="font-medium">
                              {travelersDisplay || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Flight class
                            </span>
                            <span className="font-medium">
                              {flightClassLabel || "—"}
                            </span>
                          </div>
                          {totalCostDisplay && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Est. spend
                              </span>
                              <span className="font-semibold text-primary">
                                {totalCostDisplay}
                              </span>
                            </div>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <p className="text-muted-foreground">Interests</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {submittedForm?.activities.length ? (
                              submittedForm.activities.map((activity) => {
                                const label =
                                  ACTIVITY_OPTIONS.find(
                                    (option) => option.value === activity
                                  )?.label ?? activity;
                                return (
                                  <Badge
                                    key={activity}
                                    variant="outline"
                                    className="rounded-full px-2.5 py-1 text-xs"
                                  >
                                    {label}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No interests selected
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {plan.itinerary.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          Daily itinerary
                        </CardTitle>
                        <CardDescription>
                          Timeline generated by the itinerary planner agent.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {plan.itinerary.map((day, index) => (
                          <div
                            key={`${day.title}-${index}`}
                            className="space-y-3 rounded-lg border bg-card/50 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge
                                variant="outline"
                                className="rounded-full px-3 py-1 text-xs"
                              >
                                Day {index + 1}
                              </Badge>
                              <h3 className="text-lg font-semibold">
                                {day.title}
                              </h3>
                              {day.location && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPinned className="h-4 w-4" />
                                  {day.location}
                                </div>
                              )}
                            </div>
                            {day.description && (
                              <p className="text-sm text-muted-foreground">
                                {day.description}
                              </p>
                            )}
                            {day.segments.length > 0 && (
                              <div className="space-y-3">
                                {day.segments.map((segment, segmentIndex) => (
                                  <div
                                    key={`${segment.activity}-${segmentIndex}`}
                                    className="flex flex-col gap-2 rounded-md border border-dashed border-border/60 bg-background/80 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        {segment.time && (
                                          <Badge
                                            variant="secondary"
                                            className="rounded-full px-2 py-0.5 text-[11px]"
                                          >
                                            {segment.time}
                                          </Badge>
                                        )}
                                        <p className="font-medium">
                                          {segment.activity}
                                        </p>
                                      </div>
                                      {(segment.location ||
                                        segment.details) && (
                                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                                          {segment.location && (
                                            <span className="inline-flex items-center gap-1">
                                              <MapPinned className="h-3.5 w-3.5" />
                                              {segment.location}
                                            </span>
                                          )}
                                          {segment.details && (
                                            <span>{segment.details}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {segment.cost !== undefined && (
                                        <Badge
                                          variant="outline"
                                          className="rounded-full px-3 py-1 text-xs"
                                        >
                                          Approx. {formatCurrency(segment.cost)}
                                        </Badge>
                                      )}
                                      {segment.link && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          asChild
                                          className="text-xs"
                                        >
                                          <Link
                                            href={segment.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            Details
                                            <ExternalLink className="ml-1 h-3 w-3" />
                                          </Link>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {(outboundLeg ||
                    returnLeg ||
                    (fallbackFlights && fallbackFlights.length > 0)) && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Plane className="h-5 w-5 text-primary" />
                          Flight options
                        </CardTitle>
                        <CardDescription>
                          Curated by the flight research sub-agent.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {outboundLeg &&
                          renderFlightLeg(outboundLeg, "Outbound")}
                        {returnLeg && renderFlightLeg(returnLeg, "Return")}
                        {!outboundLeg &&
                          !returnLeg &&
                          fallbackFlights.map((flight, index) => (
                            <div
                              key={`${flight.airline}-${flight.departure}-${index}`}
                              className="rounded-lg border bg-card/40 p-4"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm text-muted-foreground">
                                  {flight.airline ?? "Flight option"}
                                </div>
                                {flight.price !== undefined && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full px-3 py-1 text-xs"
                                  >
                                    {formatCurrency(
                                      flight.price,
                                      flight.currency
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-3 space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {flight.from}
                                  </span>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {flight.to}
                                  </span>
                                </div>
                                <div className="grid gap-1 text-muted-foreground">
                                  {flight.departure && (
                                    <span>Depart: {flight.departure}</span>
                                  )}
                                  {flight.arrival && (
                                    <span>Arrive: {flight.arrival}</span>
                                  )}
                                  {flight.duration && (
                                    <span>Duration: {flight.duration}</span>
                                  )}
                                  {flight.notes && <span>{flight.notes}</span>}
                                </div>
                              </div>
                              {flight.bookingLink && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="mt-3 text-xs"
                                >
                                  <Link
                                    href={flight.bookingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Open booking link
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  )}

                  {plan.stays.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <BedDouble className="h-5 w-5 text-primary" />
                          Stay recommendations
                        </CardTitle>
                        <CardDescription>
                          Produced by the lodging planner agent with live
                          availability checks.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {plan.stays.map((stay, index) => {
                          const isPrimary =
                            accommodation && stay.name === accommodation.name;
                          return (
                            <div
                              key={`${stay.name}-${index}`}
                              className="space-y-3 rounded-lg border bg-card/40 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {stay.name}
                                  </p>
                                  {stay.location && (
                                    <p className="text-xs text-muted-foreground">
                                      {stay.location}
                                    </p>
                                  )}
                                </div>
                                {isPrimary && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full px-2.5 py-0.5 text-[10px]"
                                  >
                                    Primary stay
                                  </Badge>
                                )}
                              </div>
                              <div className="grid gap-1 text-xs text-muted-foreground">
                                {stay.checkIn && stay.checkOut && (
                                  <span>
                                    {stay.checkIn} → {stay.checkOut}
                                  </span>
                                )}
                                {stay.nights && (
                                  <span>{stay.nights} nights</span>
                                )}
                                {stay.description && (
                                  <span>{stay.description}</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                {stay.price !== undefined && (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full px-3 py-1 text-xs"
                                  >
                                    {formatCurrency(stay.price, stay.currency)}
                                  </Badge>
                                )}
                                {stay.rating && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full px-3 py-1 text-xs"
                                  >
                                    {stay.rating.toFixed(1)} rating
                                  </Badge>
                                )}
                              </div>
                              {stay.link && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-xs"
                                >
                                  <Link
                                    href={stay.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View property
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {plan.activities.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Compass className="h-5 w-5 text-primary" />
                          Experiences & add-ons
                        </CardTitle>
                        <CardDescription>
                          Fielded by the attraction scout and local culture
                          agents.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {plan.activities.map((activity, index) => (
                          <div
                            key={`${activity.name}-${index}`}
                            className="space-y-2 rounded-lg border bg-card/40 p-4 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{activity.name}</p>
                              {activity.price !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="rounded-full px-3 py-1 text-xs"
                                >
                                  {formatCurrency(
                                    activity.price,
                                    activity.currency
                                  )}
                                </Badge>
                              )}
                            </div>
                            <div className="grid gap-1 text-muted-foreground">
                              {activity.category && (
                                <span>{activity.category}</span>
                              )}
                              {activity.location && (
                                <span>Where: {activity.location}</span>
                              )}
                              {activity.time && (
                                <span>When: {activity.time}</span>
                              )}
                              {activity.description && (
                                <span>{activity.description}</span>
                              )}
                            </div>
                            {activity.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-xs"
                              >
                                <Link
                                  href={activity.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View details
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {plan.budget && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          Budget summary
                        </CardTitle>
                        <CardDescription>
                          Compiled by the budget allocation agent.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {plan.budget.total !== undefined && (
                          <div className="flex items-center gap-2 text-lg font-semibold">
                            Estimated total:{" "}
                            <span className="text-primary">
                              {formatCurrency(
                                plan.budget.total,
                                plan.budget.currency
                              )}
                            </span>
                          </div>
                        )}
                        {plan.budget.breakdown.length > 0 && (
                          <div className="grid gap-2">
                            {plan.budget.breakdown.map((item, index) => (
                              <div
                                key={`${item.label}-${index}`}
                                className="flex items-center justify-between rounded-md border bg-card/40 px-3 py-2 text-sm"
                              >
                                <span>{item.label}</span>
                                <span className="font-medium">
                                  {formatCurrency(
                                    item.amount,
                                    item.currency ??
                                      plan.budget?.currency ??
                                      "USD"
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {plan.budget.notes && (
                          <p className="text-sm text-muted-foreground">
                            {plan.budget.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {travelTips.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          Travel tips
                        </CardTitle>
                        <CardDescription>
                          Quick wins sourced from the coordinator and local
                          insight agents.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid gap-2 text-sm">
                          {travelTips.map((tip, index) => (
                            <li
                              key={`${tip}-${index}`}
                              className="flex items-start gap-2 rounded-md border border-dashed border-primary/20 bg-card/40 px-3 py-2"
                            >
                              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {plan.visualizations.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Globe2 className="h-5 w-5 text-primary" />
                          Visualizations & routes
                        </CardTitle>
                        <CardDescription>
                          Rendered by the mapping and timeline visualization
                          agent.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {plan.visualizations.map((viz, index) => (
                          <div
                            key={`${viz.label}-${index}`}
                            className="space-y-2 rounded-lg border bg-card/40 p-4 text-sm"
                          >
                            <p className="font-medium">{viz.label}</p>
                            {viz.description && (
                              <p className="text-muted-foreground">
                                {viz.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {viz.type && (
                                <Badge variant="outline">{viz.type}</Badge>
                              )}
                              {viz.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-xs"
                                >
                                  <Link
                                    href={viz.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Open resource
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                            {viz.embedHtml && (
                              <div
                                className="aspect-video overflow-hidden rounded-md border"
                                dangerouslySetInnerHTML={{
                                  __html: viz.embedHtml,
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {bookingTasks.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <ListChecks className="h-5 w-5 text-primary" />
                          Booking checklist
                        </CardTitle>
                        <CardDescription>
                          Suggested next steps to finalize the itinerary.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        {bookingTasks.map((task, index) => (
                          <div
                            key={`${task.title}-${index}`}
                            className="space-y-1 rounded-md border bg-card/40 p-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{task.title}</p>
                              {task.status && (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-3 py-1 text-xs"
                                >
                                  {task.status}
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                            {task.link && (
                              <Button
                                variant="link"
                                size="sm"
                                asChild
                                className="px-0 text-xs text-primary"
                              >
                                <Link
                                  href={task.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open workflow
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {plan.references.length > 0 && (
                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle>Research references</CardTitle>
                        <CardDescription>
                          Primary sources gathered by the research sub-agents.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {plan.references.map((link, index) => (
                            <div
                              key={`${link}-${index}`}
                              className="flex items-center gap-2"
                            >
                              <Badge
                                variant="outline"
                                className="rounded-full px-2 py-0.5 text-[11px]"
                              >
                                Source {index + 1}
                              </Badge>
                              <Button
                                variant="link"
                                size="sm"
                                asChild
                                className="px-0 text-left text-sm"
                              >
                                <Link
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {link}
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default TravelPlannerPage;
