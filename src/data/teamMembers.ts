export interface TeamMember {
  id: string;
  index: string;
  name: string;
  role: string;
  image: string;
  description: string;
  bio?: string;
  skills?: string[];
  linkedin: string;
  github?: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 'chethan-kumar',
    index: '01',
    name: 'Chethan Kumar K V',
    role: 'AI/ML Engineer',
    image: '/team/member-1.jpg',
    description: 'Building the AI orchestration, RAG knowledge retrieval, and intelligent clinical workflow layer.',
    bio: 'Specializes in applied machine learning, neural speech synthesis, low-latency conversational agents, and deterministic guardrail architectures for healthcare and dental clinical workflows.',
    skills: ['PyTorch', 'LLM Guardrails', 'LangChain', 'RAG', 'Next.js 16', 'Vector Embeddings'],
    linkedin: 'https://www.linkedin.com/in/chethan-kumar-k-v/',
  },
  {
    id: 'arjun-sharma',
    index: '02',
    name: 'Arjun Sharma',
    role: 'Lead Full-Stack Architect',
    image: '/team/member-2.jpg',
    description: 'Architecting deterministic availability engines, cloud telephony, and real-time synchronization.',
    bio: 'Senior systems architect focusing on distributed fault-tolerant scheduling engines, PostgreSQL concurrency control, high-throughput WebSockets, and Twilio telephony infrastructure.',
    skills: ['TypeScript', 'Next.js Turbopack', 'PostgreSQL RLS', 'Twilio Voice', 'Redis', 'Docker'],
    linkedin: 'https://www.linkedin.com/',
  },
  {
    id: 'priya-nair',
    index: '03',
    name: 'Priya Nair',
    role: 'Lead Product & UI/UX Designer',
    image: '/team/member-3.jpg',
    description: 'Crafting Apple-grade spatial design systems, high-contrast typography, and accessible micro-interactions.',
    bio: 'Product designer with 8+ years designing high-trust clinical software, liquid glass spatial ergonomics, design systems, and WCAG AAA accessible healthcare interfaces.',
    skills: ['Design Systems', 'Figma', 'Spatial UI', 'Tailwind CSS', 'Micro-Interactions', 'User Research'],
    linkedin: 'https://www.linkedin.com/',
  },
  {
    id: 'rohan-verma',
    index: '04',
    name: 'Rohan Verma',
    role: 'Security & DevOps Engineer',
    image: '/team/member-4.jpg',
    description: 'Enforcing PostgreSQL Row-Level Security, HIPAA compliance pipelines, and multi-tenant cloud infrastructure.',
    bio: 'DevSecOps specialist focused on cloud infrastructure isolation, zero-trust security postures, automated penetration testing, OAuth2 / OIDC token safety, and zero-downtime deployments.',
    skills: ['Supabase RLS', 'HIPAA Compliance', 'AWS / Vercel', 'CI/CD Pipelines', 'OAuth 2.0', 'Terraform'],
    linkedin: 'https://www.linkedin.com/',
  },
];
