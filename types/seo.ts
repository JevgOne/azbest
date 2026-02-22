export interface MetaTagAnalysis {
  url: string;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  h1: string[];
  h2: string[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robots: string | null;
  issues: MetaTagIssue[];
  score: number;
}

export interface MetaTagIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

export interface SchemaOrgResult {
  url: string;
  schemas: SchemaOrgItem[];
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SchemaOrgItem {
  type: string;
  properties: Record<string, any>;
  valid: boolean;
  errors: string[];
}
