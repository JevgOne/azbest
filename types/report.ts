export interface ReportConfig {
  type: 'weekly' | 'monthly' | 'custom';
  dateFrom: string;
  dateTo: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text';
  data?: any;
}

export interface GeneratedReport {
  id: number;
  type: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  pdfUrl: string | null;
  status: string;
  createdAt: number;
}
