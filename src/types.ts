export interface DigitalProduct {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  priceINR: number;
  category: 'web' | 'iot' | 'template' | 'backend' | 'testing';
  badge?: string;
  features: string[];
  techStack: string[];
  fileSize: string;
  version: string;
  downloadFileName: string;
  previewUrl?: string;
  highlights: string[];
}

export interface ServiceTier {
  id: string;
  title: string;
  priceINR: number;
  duration: string;
  description: string;
  features: string[];
  milestones: {
    phase: string;
    percentage: number;
    description: string;
  }[];
}

export interface Project {
  id: number;
  title: string;
  category: 'web' | 'iot' | 'fintech';
  description: string;
  tags: string[];
  iconName: string;
  liveUrl?: string;
  githubUrl?: string;
  stats?: string;
}

export interface MilestonePayment {
  clientName: string;
  email: string;
  projectId: string;
  milestoneTitle: string;
  amount: string;
  notes?: string;
}

export interface DigitalOrderReceipt {
  orderId: string;
  txnid: string;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  amountINR: number;
  timestamp: string;
  licenseKey: string;
  downloadStatus: 'ready' | 'downloaded';
}
