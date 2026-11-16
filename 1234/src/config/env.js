import { path, getNodeBuiltin } from './runtime.js';
import { EMAIL_ADDRESSES, TB_BYTES, GB_BYTES, PLAN_DEFAULT_QUOTAS } from './constants.js';

const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

function loadDotEnv() {
  const fs = getNodeBuiltin('fs');
  if (!fs) return;
  try {
    const envPath = path.resolve(typeof process !== 'undefined' && process.cwd ? process.cwd() : '/', '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in procEnv)) {
        procEnv[key] = val;
      }
    }
  } catch (_) {}
}

loadDotEnv();

let serverReferenceQuotaGb = Number(procEnv.MONTHLY_QUOTA_GB || 50);

export function getMonthlyQuotaGb() {
  return serverReferenceQuotaGb;
}

export function setMonthlyQuotaGb(newGb) {
  const val = Number(newGb);
  if (!Number.isFinite(val) || val <= 0) {
    throw new Error('Giá trị dung lượng tham chiếu phải là số dương hợp lệ.');
  }
  serverReferenceQuotaGb = val;
  procEnv.MONTHLY_QUOTA_GB = String(val);
  return serverReferenceQuotaGb;
}

export function getOAuthProvidersStatus(workerEnv = null) {
  const envSource = workerEnv || procEnv;
  return {
    google: {
      provider: 'google',
      name: 'Google',
      configured: Boolean(envSource.GOOGLE_CLIENT_ID && envSource.GOOGLE_CLIENT_SECRET),
      auth_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth'
    },
    facebook: {
      provider: 'facebook',
      name: 'Facebook',
      configured: Boolean(envSource.FACEBOOK_CLIENT_ID && envSource.FACEBOOK_CLIENT_SECRET),
      auth_endpoint: 'https://www.facebook.com/v19.0/dialog/oauth'
    },
    microsoft: {
      provider: 'microsoft',
      name: 'Microsoft',
      configured: Boolean(envSource.MICROSOFT_CLIENT_ID && envSource.MICROSOFT_CLIENT_SECRET),
      auth_endpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    },
    apple: {
      provider: 'apple',
      name: 'Apple',
      configured: Boolean(envSource.APPLE_CLIENT_ID && envSource.APPLE_CLIENT_SECRET),
      auth_endpoint: 'https://appleid.apple.com/auth/authorize'
    }
  };
}

export function getIntegrationStatus(workerEnv = null) {
  const envSource = workerEnv || procEnv;
  const resendKey = envSource.RESEND_API_KEY || procEnv.RESEND_API_KEY || '';
  const emailConfigured = Boolean(resendKey);
  const paymentConfigured = Boolean(
    envSource.PAYMENT_BANK_CODE &&
    envSource.PAYMENT_BANK_ACCOUNT_NO
  );
  const hasD1Binding = Boolean(workerEnv && workerEnv.DB);
  const hasR2Binding = Boolean(workerEnv && workerEnv.R2);
  const oauthStatus = getOAuthProvidersStatus(workerEnv);

  return {
    infrastructure: {
      architecture: 'Cloudflare Workers + Cloudflare D1 + Cloudflare R2',
      worker_name: 'wordbridge-edu',
      d1_binding: 'DB',
      d1_database_name: 'word',
      d1_database_id: 'ce84cc48-6d49-409b-b45a-13ba3bc4a771',
      d1_connected: true,
      d1_runtime_mode: hasD1Binding ? 'cloudflare_d1_binding' : 'd1_compatible_adapter',
      r2_binding: 'R2',
      r2_bucket_name: 'word',
      r2_connected: true,
      r2_runtime_mode: hasR2Binding ? 'cloudflare_r2_binding' : 'r2_compatible_adapter',
      monthly_quota_gb: getMonthlyQuotaGb(),
      monthly_quota_bytes: getMonthlyQuotaGb() * GB_BYTES,
      override_plan_quotas: false,
      plan_default_quotas: {
        personal_free_gb: PLAN_DEFAULT_QUOTAS.personal_free.quota_bytes / GB_BYTES,
        personal_plus_monthly_gb: PLAN_DEFAULT_QUOTAS.personal_plus_monthly.quota_bytes / GB_BYTES,
        personal_plus_yearly_gb: PLAN_DEFAULT_QUOTAS.personal_plus_yearly.quota_bytes / GB_BYTES,
        org_trial_gb: PLAN_DEFAULT_QUOTAS.org_trial.quota_bytes / GB_BYTES,
        org_plus_monthly_gb: PLAN_DEFAULT_QUOTAS.org_plus_monthly.quota_bytes / GB_BYTES,
        org_plus_yearly_gb: PLAN_DEFAULT_QUOTAS.org_plus_yearly.quota_bytes / GB_BYTES
      },
      database_engine: 'Cloudflare D1 (word)',
      storage_engine: 'Cloudflare R2 (word)'
    },
    email: {
      connected: emailConfigured,
      provider: emailConfigured ? 'resend' : 'unconfigured',
      resend_configured: emailConfigured,
      status_label: emailConfigured
        ? 'Đã kết nối Resend API (Chỉ đánh dấu Đã gửi sau khi Resend phản hồi thành công)'
        : 'Chưa cấu hình khóa Resend API (Email được giữ ở trạng thái Chờ cấu hình trong hàng đợi)',
      addresses: EMAIL_ADDRESSES
    },
    payment: {
      connected: paymentConfigured,
      provider: 'manual_bank_transfer_qr',
      bank_code: envSource.PAYMENT_BANK_CODE || 'VIETQR',
      account_no_masked: envSource.PAYMENT_BANK_ACCOUNT_NO
        ? '***' + String(envSource.PAYMENT_BANK_ACCOUNT_NO).slice(-4)
        : 'Chờ cấu hình tài khoản nhận',
      status_label: 'Chuyển khoản ngân hàng thủ công kèm mã QR – Chỉ kích hoạt sau khi Admin đối soát giao dịch thực tế'
    },
    oauth: oauthStatus
  };
}

const cwd = (typeof process !== 'undefined' && typeof process.cwd === 'function') ? process.cwd() : '/';
export const PORT = Number(procEnv.PORT || 3000);
export const NODE_ENV = procEnv.NODE_ENV || 'development';
export const CANONICAL_ORIGIN = procEnv.CANONICAL_ORIGIN || 'https://wordbridge.io.vn';
export const LOCAL_DB_FILE = procEnv.LOCAL_DB_FILE || procEnv.SQLITE_DB_PATH || path.resolve(cwd, 'data/wordbridge_d1_local.sqlite');
export const STORAGE_ROOT_PATH = procEnv.STORAGE_ROOT_PATH || path.resolve(cwd, 'data/wordbridge_r2_local');
export const STORAGE_BACKUP_PATH = procEnv.STORAGE_BACKUP_PATH || path.resolve(cwd, 'data/wordbridge_backups');
export const STORAGE_SERVER_PROVISIONED_BYTES = Number(procEnv.STORAGE_SERVER_PROVISIONED_BYTES || (2 * TB_BYTES));
export const SESSION_SECRET = procEnv.SESSION_SECRET || 'wb_dev_session_secret_do_not_use_in_prod_2026';
export const CSRF_SECRET = procEnv.CSRF_SECRET || 'wb_dev_csrf_secret_do_not_use_in_prod_2026';
export const ADMIN_BOOTSTRAP_SECRET = procEnv.ADMIN_BOOTSTRAP_SECRET || '';
