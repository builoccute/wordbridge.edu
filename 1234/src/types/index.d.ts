/**
 * WORD BRIDGE — TypeScript Type Definitions & Domain Contracts
 * Website: https://www.wordbridge.vn/
 * Standalone PDF Reader (SSO only): https://reader.wordbridge.vn/
 */

export type LanguageCode = 'zh' | 'en' | 'ru';
export type UILanguageCode = 'vi' | 'en' | 'zh' | 'ru';

export type AdminRoleCode =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'ACADEMIC_ADMIN'
  | 'CONTENT_EDITOR'
  | 'MODERATOR'
  | 'EXAM_ADMIN'
  | 'DATA_ADMIN'
  | 'SECURITY_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'INSTRUCTOR'
  | 'LEARNER';

export interface EnvBindings {
  DB: D1Database;
  STORAGE: R2Bucket;
  ASSETS?: Fetcher;
  APP_NAME: string;
  APP_TAGLINE: string;
  APP_URL: string;
  PDF_READER_SSO_URL: string;
  EMAIL_FROM_NOREPLY: string;
  EMAIL_REPLY_TO_CSKH: string;
  EMAIL_FROM_CSKH: string;
  EMAIL_FROM_CONTACT: string;
  SESSION_SECRET?: string;
  CSRF_SECRET?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_API_KEY?: string;
  LEARNER_MEET_PROVIDER?: string;
  LEARNER_MEET_API_KEY?: string;
  LEARNER_MEET_API_SECRET?: string;
  PDF_READER_SSO_ENABLED?: string;
  PDF_READER_SSO_SHARED_SECRET?: string;
  AI_ADAPTER_PROVIDER?: string;
  AI_ADAPTER_API_KEY?: string;
}

export interface RegistrationPayload {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolName: string;
  workplaceName: string;
}
