import { Plan } from './types';

export const dummyPlan: Plan = {
  type: 'web_app',
  summary:
    'A peer-to-peer rental platform where users can list, discover, and rent household items like tools, cameras, and furniture — with built-in payments, reviews, and availability tracking.',
  features: [
    {
      feature_name: 'Item Listings',
      feature_description:
        'Owners can list items with photos, descriptions, pricing, and availability windows.'
    },
    {
      feature_name: 'Search & Filters',
      feature_description:
        'Renters can search by category, location, price range, and availability dates.'
    },
    {
      feature_name: 'Booking System',
      feature_description:
        'Users can request rentals for specific date ranges; owners can approve or decline.'
    },
    {
      feature_name: 'Payments',
      feature_description:
        'Stripe-powered checkout with automatic payouts to item owners after rental completion.'
    },
    {
      feature_name: 'Reviews & Ratings',
      feature_description: 'Both renters and owners can leave reviews after each completed rental.'
    },
    {
      feature_name: 'Notifications',
      feature_description:
        'Email and in-app notifications for booking requests, approvals, and reminders.'
    }
  ],
  database: {
    tables: [
      { name: 'users', fields: ['id', 'name', 'email', 'avatar', 'created_at'] },
      {
        name: 'items',
        fields: ['id', 'owner_id', 'title', 'description', 'price_per_day', 'category', 'location']
      },
      {
        name: 'bookings',
        fields: ['id', 'item_id', 'renter_id', 'start_date', 'end_date', 'status']
      },
      { name: 'reviews', fields: ['id', 'booking_id', 'reviewer_id', 'rating', 'comment'] },
      { name: 'payments', fields: ['id', 'booking_id', 'amount', 'stripe_payment_id', 'status'] }
    ]
  },
  api: {
    routes: [
      { method: 'GET', path: '/api/items' },
      { method: 'POST', path: '/api/items' },
      { method: 'GET', path: '/api/items/:id' },
      { method: 'PUT', path: '/api/items/:id' },
      { method: 'DELETE', path: '/api/items/:id' },
      { method: 'POST', path: '/api/bookings' },
      { method: 'GET', path: '/api/bookings/:id' },
      { method: 'PATCH', path: '/api/bookings/:id/status' },
      { method: 'POST', path: '/api/reviews' },
      { method: 'POST', path: '/api/payments/checkout' }
    ]
  },
  structure: {
    frontend: [
      'app/page.tsx/app/page.tsx',
      'app/items/[id]/page.tsx',
      'app/dashboard/page.tsx',
      'components/ItemCard.tsx',
      'components/BookingModal.tsx',
      'components/ReviewForm.tsx'
    ],
    backend: [
      'api/items/route.ts',
      'api/bookings/route.ts',
      'api/reviews/route.ts',
      'api/payments/route.ts',
      'lib/db.ts',
      'lib/stripe.ts'
    ]
  },
  tech_stack: {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Next.js API Routes',
    database: 'PostgreSQL + Prisma',
    auth: 'NextAuth.js',
    deployment: 'Vercel + Supabase'
  }
};
