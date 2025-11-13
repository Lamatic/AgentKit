export interface Job {
  id: string
  title: string
  category: string
  description: string
  requirements: string[]
  location: string
  type: string
}

export interface JobCategory {
  name: string
  jobs: Job[]
}

// This data structure can be easily populated from your backend
export const jobsData: JobCategory[] = [
  {
    name: "Engineering",
    jobs: [
      {
        id: "eng-1",
        title: "Senior Full Stack Engineer",
        category: "Engineering",
        description: `We are looking for a Senior Full Stack Engineer to join our growing team. You will be responsible for building scalable web applications using modern technologies.

Key Responsibilities:
- Design and develop full-stack web applications
- Collaborate with product and design teams
- Write clean, maintainable code
- Mentor junior developers
- Participate in code reviews`,
        requirements: [
          "5+ years of experience in full-stack development",
          "Strong proficiency in React, Node.js, and TypeScript",
          "Experience with cloud platforms (AWS, GCP, or Azure)",
          "Excellent problem-solving skills",
          "Strong communication skills",
        ],
        location: "Remote",
        type: "Full-time",
      },
      {
        id: "eng-2",
        title: "Frontend Developer",
        category: "Engineering",
        description: `Join our frontend team to build beautiful, responsive user interfaces that delight our customers.

Key Responsibilities:
- Build responsive web applications
- Implement pixel-perfect designs
- Optimize application performance
- Work closely with designers and backend engineers`,
        requirements: [
          "3+ years of frontend development experience",
          "Expert knowledge of React and modern CSS",
          "Experience with state management (Redux, Zustand)",
          "Understanding of web performance optimization",
          "Portfolio of previous work",
        ],
        location: "San Francisco, CA",
        type: "Full-time",
      },
    ],
  },
  {
    name: "Marketing",
    jobs: [
      {
        id: "mkt-1",
        title: "Content Marketing Manager",
        category: "Marketing",
        description: `We're seeking a creative Content Marketing Manager to develop and execute our content strategy.

Key Responsibilities:
- Develop content marketing strategy
- Create engaging blog posts, whitepapers, and case studies
- Manage content calendar
- Analyze content performance
- Collaborate with design and product teams`,
        requirements: [
          "4+ years of content marketing experience",
          "Excellent writing and editing skills",
          "Experience with SEO and content analytics",
          "Strong project management skills",
          "B2B SaaS experience preferred",
        ],
        location: "Remote",
        type: "Full-time",
      },
      {
        id: "mkt-2",
        title: "Growth Marketing Lead",
        category: "Marketing",
        description: `Lead our growth marketing efforts to drive user acquisition and retention.

Key Responsibilities:
- Develop and execute growth strategies
- Run A/B tests and experiments
- Manage paid advertising campaigns
- Analyze user data and metrics
- Optimize conversion funnels`,
        requirements: [
          "5+ years of growth marketing experience",
          "Data-driven mindset with strong analytical skills",
          "Experience with marketing automation tools",
          "Proven track record of driving growth",
          "Startup experience preferred",
        ],
        location: "New York, NY",
        type: "Full-time",
      },
    ],
  },
  {
    name: "Design",
    jobs: [
      {
        id: "des-1",
        title: "Senior Product Designer",
        category: "Design",
        description: `We're looking for a Senior Product Designer to shape the future of our product experience.

Key Responsibilities:
- Design intuitive user interfaces
- Create user flows and wireframes
- Conduct user research and testing
- Collaborate with engineering and product teams
- Maintain design system`,
        requirements: [
          "5+ years of product design experience",
          "Strong portfolio demonstrating UX/UI skills",
          "Proficiency in Figma and design tools",
          "Experience with design systems",
          "Excellent communication skills",
        ],
        location: "Remote",
        type: "Full-time",
      },
    ],
  },
  {
    name: "Sales",
    jobs: [
      {
        id: "sal-1",
        title: "Account Executive",
        category: "Sales",
        description: `Join our sales team to help businesses transform their operations with our platform.

Key Responsibilities:
- Generate and qualify leads
- Conduct product demonstrations
- Negotiate and close deals
- Build long-term customer relationships
- Meet and exceed sales targets`,
        requirements: [
          "3+ years of B2B sales experience",
          "Proven track record of meeting quotas",
          "Excellent presentation skills",
          "Experience with CRM tools (Salesforce, HubSpot)",
          "SaaS sales experience preferred",
        ],
        location: "Austin, TX",
        type: "Full-time",
      },
    ],
  },
]
