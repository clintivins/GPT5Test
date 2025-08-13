export type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

export type DigestConfig = {
  emailTo: string;
  emailFrom: string;
  smtpHost: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
};
