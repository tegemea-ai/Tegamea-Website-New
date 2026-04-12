export interface ServicePackage {
  id: string;
  name: string;
  hoursPerMonth: string;
  rate: string;
  validity: string;
  minTerm: string;
  description: string;
  bestFor: string[];
  whyWorks: string;
}

export interface AssessmentResult {
  packageId: string;
  reasoning: string;
  strategicInsight: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: string;
  date: string;
  image: string;
  readTime: string;
}