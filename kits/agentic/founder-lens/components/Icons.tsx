export const Icons = {
  Logo: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lensGradUI" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M50 10 L85 50 L50 90 L15 50 Z" fill="url(#lensGradUI)" fillOpacity="0.9" />
      <path d="M50 10 L85 50 L50 50 Z" fill="#ffffff" fillOpacity="0.3" />
      <path d="M50 50 L15 50 L50 90 Z" fill="#000000" fillOpacity="0.2" />
      <circle cx="50" cy="50" r="16" fill="#ffffff" />
      <circle cx="50" cy="50" r="6" fill="#3b82f6" />
    </svg>
  ),

  DataNode: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),

  NeuralGraph: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  ),

  RiskPrism: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20L12 2z"></path>
      <path d="M12 8L22 22"></path>
      <path d="M12 8L2 22"></path>
    </svg>
  ),

  Search: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" className="text-primary drop-shadow-[2px_2px_3px_var(--clay-shadow)]" />
      <path d="M20 20l-4-4" className="text-muted-foreground drop-shadow-[1px_1px_2px_var(--clay-shadow)]" />
    </svg>
  ),

  Chat: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" className="text-primary drop-shadow-[2px_2px_3px_var(--clay-shadow)]" />
      <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),

  Target: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" className="text-primary drop-shadow-[2px_2px_3px_var(--clay-shadow)]" />
      <circle cx="12" cy="12" r="5" className="text-muted-foreground" />
      <circle cx="12" cy="12" r="1" className="text-primary" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="4" className="text-primary" />
      <line x1="12" y1="20" x2="12" y2="22" className="text-primary" />
      <line x1="2" y1="12" x2="4" y2="12" className="text-primary" />
      <line x1="20" y1="12" x2="22" y2="12" className="text-primary" />
    </svg>
  ),

  Check: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" className="text-green-500 drop-shadow-[1px_1px_1px_rgba(0,0,0,0.1)]" />
    </svg>
  ),

  Lightning: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" className="text-yellow-500 drop-shadow-[2px_2px_4px_rgba(234,179,8,0.3)]" fill="currentColor" fillOpacity="0.2" />
    </svg>
  )
};
