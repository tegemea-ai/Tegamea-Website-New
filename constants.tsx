import { ServicePackage, BlogPost } from './types';

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Working with Tegemea is one of the best decisions I've made for my business. The level of care, precision, and ownership they take is truly exceptional.",
    author: "James Watters",
    role: "Founder, Watters & Co"
  },
  {
    quote: "The peace of mind knowing that our operations are being handled by a professional who 'just gets it' is invaluable. It has allowed me to focus entirely on growth.",
    author: "Sarah Jenkins",
    role: "Principal Consultant"
  },
  {
    quote: "Tegemea doesn't just provide task support; they provide strategic infrastructure. They have become an indispensable part of our firm's daily success.",
    author: "Dr. Marcus Thorne",
    role: "Managing Director"
  },
  {
    quote: "A complete step-change from traditional virtual assistants. The professional standards and cultural alignment are exactly what we were looking for in the UK.",
    author: "Elena Rossi",
    role: "Legal Partner"
  }
];

export const PACKAGES: ServicePackage[] = [
  {
    id: 'core',
    name: 'Core Retainer',
    hoursPerMonth: '5 – 10 hours per week',
    rate: '£33 + VAT per hour',
    validity: 'Flexible over 8 weeks',
    minTerm: '6 months',
    description: 'A flexible retainer designed for small-to-medium businesses that need regular, dependable support without overcommitting hours.',
    bestFor: [
      'Managing inboxes, diaries, and documentation',
      'Light project support and operational assistance',
      'Moving away from ad-hoc help toward consistent delivery'
    ],
    whyWorks: 'Provides calm, reliable support that adapts to your workload without the pressure of rigid weekly allocations.'
  },
  {
    id: 'growth',
    name: 'Growth Retainer',
    hoursPerMonth: '15 – 20 hours per week',
    rate: '£30 + VAT per hour',
    validity: 'Monthly allocation',
    minTerm: '6 months',
    description: 'Designed for established businesses that require consistent, hands-on support and a higher level of ownership across operations.',
    bestFor: [
      'Delegating core admin and recurring operational tasks',
      'Supporting workflows and internal organisation',
      'Leaders who want dependable execution without constant direction'
    ],
    whyWorks: 'Creates operational stability, reduces decision fatigue, and ensures work is handled to a consistently high standard.'
  },
  {
    id: 'partnership',
    name: 'Partnership Retainer',
    hoursPerMonth: '25+ hours per week',
    rate: '£28 + VAT per hour',
    validity: 'Monthly allocation',
    minTerm: '6 months',
    description: 'Built for long-term, high-volume partnerships where Tegemea becomes a deeply embedded support function within your business.',
    bestFor: [
      'Businesses with significant operational volume',
      'Managing complex workloads across multiple workstreams',
      'Long-term engagements where trust and consistency are essential'
    ],
    whyWorks: 'Delivers scale without chaos — providing depth, reliability, and continuity as your business grows.'
  },
  {
    id: 'bespoke',
    name: 'Bespoke Team Support',
    hoursPerMonth: 'Custom allocation',
    rate: 'Bespoke Pricing',
    validity: 'Custom Engagement',
    minTerm: 'Custom',
    description: 'Designed for firms requiring a comprehensive, multi-disciplinary support function. We architect and manage a dedicated team of virtual assistants to handle complex operations.',
    bestFor: [
      'Businesses requiring multi-person redundancy and specialized skill sets',
      'Scaling firms with complex multi-territory operations',
      'Establishing a fully outsourced administrative or operational department'
    ],
    whyWorks: 'Provides institutional resilience and scalable capacity without the overhead of internal team management.'
  }
];

export const TRUST_POINTS = [
  {
    title: "Vetted UK Talent",
    description: "Every assistant is rigorously vetted for high educational and professional standards, ensuring deep cultural alignment across the UK."
  },
  {
    title: "Strategic Discretion",
    description: "Operating with the highest level of confidentiality and professional indemnity for peace of mind."
  },
  {
    title: "Operational Infrastructure",
    description: "We build and support operational infrastructure designed for years of sustained, strategic growth."
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '2',
    slug: 'uk-virtual-assistants-vs-global-freelancers',
    title: 'UK Virtual Assistants vs Global Freelancers: A Guide for Professional Services Leaders',
    excerpt: 'The appeal of global freelance platforms is obvious, yet firms often discover that what looks like cost efficiency translates into operational drag.',
    category: 'Hiring Insights',
    date: 'Jan 15, 2026',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    readTime: '6 min read',
    content: `
      <p>The appeal of global freelance platforms is obvious: lower hourly rates, vast talent pools, and the promise of 24/7 coverage. Yet firms that have travelled this path often discover that what looks like cost efficiency on a spreadsheet translates into operational drag in practice.</p>

      <p>The difference between UK-based virtual assistants and their global counterparts isn't about capability or work ethic. It's about the invisible infrastructure that makes collaboration either seamless or exhausting.</p>

      <h2>The Real Currency: Time and Trust</h2>
      <p>When your barrister needs a court bundle prepared, your tax partner requires Companies House filings cross-referenced, or your client director needs meeting notes that capture the subtext of a tense negotiation, the person supporting them must understand more than the task. They must understand the context.</p>

      <p>UK-based VAs bring an intuitive grasp of professional norms that can't be taught through a project brief. They know that "end of play" means 5:00pm, not midnight. They understand the significance of a Law Society reference, the structure of UK academic qualifications, and why you don't schedule internal meetings during Wimbledon fortnight if you can avoid it. This cultural fluency eliminates the constant micro-explanations that drain partner time.</p>

      <p>Time-zone alignment sounds trivial until you need urgent support. A global freelancer in Manila or Lahore operates on a 7-8 hour offset, meaning your morning crisis becomes their evening task—delivered when your office is closed. A UK-based VA working 9-to-5 GMT is available when you are, can join calls with UK clients without scheduling gymnastics, and can respond to genuine urgent tasks within the same business day.</p>

      <h2>Professional Standards as a Competitive Advantage</h2>
      <p>The unregulated nature of global freelance platforms creates asymmetric risk. When you hire through Upwork or Fiverr, you're navigating varying interpretations of confidentiality, data protection, and professional conduct. UK-based VAs operating as legitimate businesses are bound by GDPR, UK employment and data protection law, and professional indemnity requirements. They carry insurance. They understand what client confidentiality means in a legal context, not just as a checkbox in a terms of service agreement.</p>

      <p>For firms handling sensitive client matters, whether legal disputes, financial restructuring, or strategic transactions, this isn't paranoia. It's risk management. The reputational damage from a single data breach or confidentiality lapse can erase years of cost savings.</p>

      <h2>The Efficiency Paradox</h2>
      <p>Here's where the mathematics of global hiring falls apart. That £10/hour VA might look attractive compared to a £30/hour UK-based assistant, but the fully-loaded cost tells a different story.</p>

      <p>Factor in the partner or director time spent clarifying instructions, correcting misunderstandings rooted in cultural or contextual gaps, and redoing work that missed the mark. Add the productivity loss from asynchronous communication delays and the opportunity cost of tasks that simply don't get done because they're too complicated to delegate across time zones. The efficiency gain evaporates.</p>

      <p>UK-based VAs operate as force multipliers because they reduce friction. They can be trusted with ambiguous instructions because they'll fill in the blanks correctly. They can escalate issues intelligently because they understand what matters. They can represent your firm's standards because they share them.</p>

      <h2>Strategic Delegation vs. Task Offloading</h2>
      <p>Global freelancers excel at discrete, well-defined tasks: graphic design, data entry, transcription. But professional services firms don't just need tasks completed, they need strategic support that extends the judgment of fee-earners.</p>

      <p>A UK-based VA who has supported solicitors understands the rhythm of a transaction timeline. They know when to chase, when to wait, and how to communicate with clients in a way that reinforces rather than undermines your firm's positioning. They become an extension of your team, not just a vendor.</p>

      <p>This is the distinction between hiring someone to execute tasks and hiring someone who can carry context, exercise judgment, and operate with minimal supervision. The latter requires shared reference points that geographical and cultural distance makes difficult to establish.</p>

      <h2>The Boutique Firm Advantage</h2>
      <p>Ironically, this matters most for smaller and mid-sized firms. Large corporations can absorb the overhead of training global teams, building process documentation, and managing across time zones. They have the systems and redundancy to make it work.</p>

      <p>Boutique and mid-tier professional firms operate with leaner margins. Every hour of partner time wasted on administrative friction directly impacts billable capacity and client service quality. For these firms, UK-based VAs aren't a premium option, they're the efficient one.</p>

      <h2>Making the Calculation</h2>
      <p>The question isn't whether UK-based support costs more per hour. The question is whether that support delivers more value per hour worked and per hour of your time saved.</p>

      <p>When you account for communication efficiency, reduced error rates, eliminated rework, time-zone synchronicity, and the ability to delegate with confidence, the total cost of ownership shifts dramatically. The firm that pays £30/hour for 15 focused, effective hours often gets better outcomes than the one paying £10/hour for 40 hours of managed frustration.</p>

      <p>Operational trust isn't a luxury. It's the foundation that allows senior leaders to delegate meaningfully, scale intelligently, and focus their own expertise where it creates the most value. Cultural nuance and professional alignment aren't soft benefits, they're the hard infrastructure of effective remote collaboration.</p>

      <p>The firms that understand this distinction don't just save money. They reclaim time, reduce risk, and build support structures that genuinely extend their capabilities rather than simply checking a box labelled "administrative coverage."</p>
    `
  },
  {
    id: '1',
    slug: 'ceos-guide-to-strategic-delegation',
    title: 'The CEO\'s Guide to Strategic Delegation',
    excerpt: 'True leadership isn\'t about doing more; it\'s about ensuring the right things are done by the right people. Learn the framework for high-level delegation.',
    category: 'Leadership',
    date: 'Oct 12, 2024',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
    readTime: '6 min read'
  },
  {
    id: '3',
    slug: 'operational-architecture-missing-piece',
    title: 'Operational Architecture: The Missing Piece',
    excerpt: 'Most firms suffer from "process debt." Discover how a strategic VA partner can rebuild your business backend for scalable growth.',
    category: 'Operational Strategy',
    date: 'Sep 28, 2024',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    readTime: '8 min read'
  }
];