export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  domains_selected: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Paper {
  id: number;
  title: string;
  authors: string[];
  abstract: string;
  pub_date: string;
  source: string;
  venue: string;
  external_link: string;
  pdf_link: string;
  citation_count: number;
  is_open_access: boolean;
  domain_tags: string[];
  is_read: boolean;
  is_bookmarked: boolean;
}

export interface PaperListResponse {
  papers: Paper[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface DomainInfo {
  name: string;
  is_custom: boolean;
}

export interface RefreshResponse {
  new_papers: number;
  source_used: string;
  timestamp: string;
}
