import { Plan, Feature, Table, Route } from '@/types';

const badge = (text: string) => (
  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-zinc-100 text-zinc-500 border border-zinc-200">
    {text}
  </span>
);

const methodColor: Record<string, string> = {
  GET: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  POST: 'text-blue-600 bg-blue-50 border-blue-200',
  PUT: 'text-amber-600 bg-amber-50 border-amber-200',
  PATCH: 'text-orange-600 bg-orange-50 border-orange-200',
  DELETE: 'text-red-600 bg-red-50 border-red-200'
};

const typeIcon: Record<Plan['type'], string> = {
  web_app: '🌐',
  mobile_app: '📱',
  extension: '🧩',
  api_service: '⚙️'
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-3 flex items-center gap-2">
      <span className="block w-4 h-px bg-zinc-300" />
      {title}
    </h2>
    {children}
  </div>
);

const FeatureCard = ({ feature }: { feature: Feature }) => (
  <div className="group relative bg-white border border-zinc-100 rounded-xl p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5l2.5 2.5L8 3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-800 mb-0.5">{feature.feature_name}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{feature.feature_description}</p>
      </div>
    </div>
  </div>
);

const TableCard = ({ table }: { table: Table }) => (
  <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
    <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-zinc-400">
        <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="7" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="7" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="text-xs font-semibold text-zinc-700 font-mono">{table.name}</span>
    </div>
    <div className="px-4 py-3 flex flex-wrap gap-1.5">
      {table.fields.map((field) => (
        <span
          key={field}
          className="text-[11px] font-mono px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-600"
        >
          {field}
        </span>
      ))}
    </div>
  </div>
);

const RouteRow = ({ route }: { route: Route }) => {
  const colors =
    methodColor[route.method.toUpperCase()] ?? 'text-zinc-600 bg-zinc-50 border-zinc-200';
  return (
    <div className="flex items-center gap-3 py-2 px-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/70 transition-colors duration-100">
      <span
        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border w-14 text-center ${colors}`}
      >
        {route.method.toUpperCase()}
      </span>
      <span className="text-xs font-mono text-zinc-600">{route.path}</span>
    </div>
  );
};

const TechPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">
      {label}
    </span>
    <span className="text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5">
      {value}
    </span>
  </div>
);

const Content = ({ plan }: { plan: Plan }) => {
  return (
    <div className="font-sans text-zinc-900 px-1 pb-8">
      {/* Header */}
      <div className="mb-8 pt-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{typeIcon[plan.type]}</span>
          <div className="flex items-center gap-2">{badge(plan.type.replace('_', ' '))}</div>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed border-l-2 border-zinc-200 pl-3">
          {plan.summary}
        </p>
      </div>

      {/* Features */}
      <Section title="Core Features">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {plan.features.map((f) => (
            <FeatureCard key={f.feature_name} feature={f} />
          ))}
        </div>
      </Section>

      {/* Tech Stack */}
      <Section title="Tech Stack">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <TechPill label="Frontend" value={plan.tech_stack.frontend} />
          <TechPill label="Backend" value={plan.tech_stack.backend} />
          <TechPill label="Database" value={plan.tech_stack.database} />
          <TechPill label="Auth" value={plan.tech_stack.auth} />
          <TechPill label="Deployment" value={plan.tech_stack.deployment} />
        </div>
      </Section>

      {/* Database */}
      <Section title="Database Schema">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {plan.database.tables.map((t) => (
            <TableCard key={t.name} table={t} />
          ))}
        </div>
      </Section>

      {/* API Routes */}
      <Section title="API Routes">
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {plan.api.routes.map((r, i) => (
            <RouteRow key={i} route={r} />
          ))}
        </div>
      </Section>

      {/* Project Structure */}
      <Section title="Project Structure">
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
          <div className="bg-white border border-zinc-100 rounded-xl overscroll-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                Frontend
              </span>
            </div>
            <ul className="px-4 py-3 space-y-1">
              {plan.structure.frontend.map((item, i) => (
                <li key={i} className="text-xs font-mono text-zinc-600 flex items-center gap-2">
                  <span className="text-zinc-300">—</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                Backend
              </span>
            </div>
            <ul className="px-4 py-3 space-y-1">
              {plan.structure.backend.map((item, i) => (
                <li key={i} className="text-xs font-mono text-zinc-600 flex items-center gap-2">
                  <span className="text-zinc-300">—</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default Content;
