export interface TeamMember {
  id: string;
  index: string;
  name: string;
  role: string;
  image: string;
  email?: string;
  description: string;
  bio?: string;
  skills?: string[];
  /** Short tech badges shown on the card (2-4 items) */
  techStack?: string[];
  linkedin: string;
  github?: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 'chethan-kumar',
    index: '01',
    name: 'Chethan Kumar K V',
    role: 'AI/ML Engineer',
    image: '/team/chethan.webp',
    email: 'chethankumar.ai@gmail.com',
    description: 'Building the AI orchestration, RAG clinical knowledge retrieval, and real-time voice intelligence layer.',
    bio: 'Specializes in applied machine learning, neural speech synthesis, low-latency conversational agents, and deterministic guardrail architectures for clinical dental workflows.',
    skills: ['PyTorch', 'LLM Guardrails', 'LangChain', 'RAG Embeddings', 'Next.js 16', 'FastAPI'],
    techStack: ['PyTorch', 'LangChain', 'FastAPI'],
    linkedin: 'https://www.linkedin.com/in/chethan-kumar-k-v/',
  },
  {
    id: 'sanjana',
    index: '02',
    name: 'Sanjana',
    role: 'Frontend & Spatial UI Engineer',
    image: '/team/sanjana.webp',
    email: 'sanjana.frontend@gmail.com',
    description: 'Crafting responsive user interfaces, fluid animations, and high-contrast accessible clinical dashboards.',
    bio: 'Frontend engineer focused on modern React/Next.js architectures, micro-interactions, responsive design systems, and WCAG AAA compliant healthcare software.',
    skills: ['React 19', 'Next.js Turbopack', 'Tailwind CSS', 'TypeScript', 'Framer Motion', 'Web Accessibility'],
    techStack: ['React', 'Tailwind CSS', 'TypeScript'],
    linkedin: 'https://www.linkedin.com/',
  },
  {
    id: 'suhani',
    index: '03',
    name: 'Suhani',
    role: 'Lead Product & UX Designer',
    image: '/team/suhani.webp',
    email: 'suhani.uxdesign@gmail.com',
    description: 'Designing intuitive dental patient workflows, spatial UX systems, and seamless clinic onboarding experiences.',
    bio: 'Product and UX designer specializing in healthcare systems, user research, wireframing, interactive prototyping, and human-centered design for high-trust dental applications.',
    skills: ['Product Design', 'Figma', 'Design Systems', 'User Research', 'Spatial UI', 'Prototyping'],
    techStack: ['Figma', 'Design Systems', 'Prototyping'],
    linkedin: 'https://www.linkedin.com/',
  },
  {
    id: 'shreya',
    index: '04',
    name: 'Shreya',
    role: 'Full Stack Developer',
    image: '/team/shreya.webp',
    email: 'shreya.fullstack@gmail.com',
    description: 'Developing end-to-end appointment scheduling, real-time sync, and clinic management features.',
    bio: 'Full-stack software engineer delivering robust API layers, database optimization, third-party integrations, and scalable web applications for medical SaaS platforms.',
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Next.js', 'REST APIs', 'Supabase'],
    techStack: ['Node.js', 'PostgreSQL', 'Supabase'],
    linkedin: 'https://www.linkedin.com/',
  },
  {
    id: 'kishan',
    index: '05',
    name: 'Kishan',
    role: 'Backend & Cloud Telephony Architect',
    image: '/team/kishan.webp',
    email: 'kishan.backend@gmail.com',
    description: 'Engineering low-latency Twilio voice pipelines, WhatsApp Cloud webhooks, and distributed appointment queuing.',
    bio: 'Backend architect focused on cloud telephony, webhook event processing, high-concurrency PostgreSQL transactions, and real-time streaming architectures.',
    skills: ['Twilio Telephony', 'WhatsApp Cloud API', 'WebSockets', 'PostgreSQL RLS', 'Redis', 'Docker'],
    techStack: ['Twilio', 'WhatsApp API', 'Redis', 'WebSockets'],
    linkedin: 'https://www.linkedin.com/',
  },
  {
    id: 'srujan',
    index: '06',
    name: 'Srujan',
    role: 'Security & DevOps Engineer',
    image: '/team/srujan.webp',
    email: 'srujan.devsecops@gmail.com',
    description: 'Enforcing HIPAA compliance, Supabase Row-Level Security, automated CI/CD, and zero-trust cloud infrastructure.',
    bio: 'DevSecOps engineer specializing in infrastructure security, HIPAA-ready data protection, automated test pipelines, container orchestration, and cloud reliability.',
    skills: ['Supabase RLS', 'HIPAA Security', 'CI/CD Pipelines', 'AWS / Vercel', 'OAuth 2.0', 'Terraform'],
    techStack: ['Supabase', 'CI/CD', 'Terraform', 'Docker'],
    linkedin: 'https://www.linkedin.com/',
  },
];


