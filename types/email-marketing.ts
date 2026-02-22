export interface EmailCampaign {
  id: number;
  ecomail_id: string | null;
  name: string;
  subject: string;
  template_id: string | null;
  list_id: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sent_count: number;
  open_count: number;
  click_count: number;
  unsubscribe_count: number;
  bounce_count: number;
  open_rate: number;
  click_rate: number;
  scheduled_at: number | null;
  sent_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface PushCampaign {
  id: number;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  image: string | null;
  segment: string | null;
  sent_count: number;
  click_count: number;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_at: number | null;
  sent_at: number | null;
  created_at: number;
}

export interface PushSubscription {
  id: number;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  user_agent: string | null;
  customer_email: string | null;
  active: boolean;
  created_at: number;
}

export interface SmsCampaign {
  id: number;
  name: string;
  message: string;
  sender: string | null;
  recipients: string[];
  segment: string | null;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at: number | null;
  sent_at: number | null;
  cost: number;
  created_at: number;
}
