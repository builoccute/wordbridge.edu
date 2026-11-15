'use strict';
const fs = require('fs');
const path = require('path');
const { EMAIL_ADDRESSES, TB_BYTES, GB_BYTES } = require('./constants');

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
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
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

// Cho phép cập nhật MONTHLY_QUOTA_GB tại máy chủ qua biến môi trường hoặc API quản trị
let serverMonthlyQuotaGb = Number(process.env.MONTHLY_QUOTA_GB || 50);

function getMonthlyQuotaGb() {
  return serverMonthlyQuotaGb;
}

function setMonthlyQuotaGb(newGb) {
  const val = Number(newGb);
  if (!Number.isFinite(val) || val <= 0) {
    throw new Error('MONTHLY_QUOTA_GB phải là số dương hợp lệ.');
  }
  serverMonthlyQuotaGb = val;
  process.env.MONTHLY_QUOTA_GB = String(val);
  return serverMonthlyQuotaGb;
}

function getIntegrationStatus(workerEnv = null) {
  const resendKey = (workerEnv && workerEnv.RESEND_API_KEY) || process.env.RESEND_API_KEY || '';
  const emailConfigured = Boolean(
    resendKey ||
    (process.env.EMAIL_PROVIDER && process.env.EMAIL_PROVIDER !== 'unconfigured' && (process.env.SMTP_HOST || process.env.EMAIL_API_KEY))
  );
  const paymentConfigured = Boolean(
    process.env.PAYMENT_PROVIDER &&
    process.env.PAYMENT_PROVIDER !== 'unconfigured' &&
    process.env.PAYMENT_BANK_ACCOUNT_NO &&
    process.env.PAYMENT_WEBHOOK_SECRET
  );
  const hasD1Binding = Boolean(workerEnv && workerEnv.DB);
  const hasR2Binding = Boolean(workerEnv && workerEnv.R2);

  return {
    infrastructure: {
      worker_name: 'wordbridge',
      d1_binding: 'DB',
      d1_database_name: 'word',
      d1_database_id: 'ce84cc48-6d49-409b-b45a-13ba3bc4a771',
      d1_connected: hasD1Binding,
      r2_binding: 'R2',
      r2_bucket_name: 'word',
      r2_connected: hasR2Binding,
      monthly_quota_gb: getMonthlyQuotaGb(),
      monthly_quota_bytes: getMonthlyQuotaGb() * GB_BYTES,
      database_engine: hasD1Binding ? 'Cloudflare D1 (word - ce84cc48-6d49-409b-b45a-13ba3bc4a771)' : 'SQL Engine (Tương thích D1 & PostgreSQL)',
      storage_engine: hasR2Binding ? 'Cloudflare R2 Bucket (word)' : 'Object Storage Server (Tương thích R2)'
    },
    email: {
      connected: emailConfigured,
      provider: resendKey ? 'resend' : (process.env.EMAIL_PROVIDER || 'unconfigured'),
      resend_configured: Boolean(resendKey),
      status_label: resendKey
        ? 'Đã tích hợp RESEND_API_KEY (Gửi email trực tiếp qua https://api.resend.com/emails)'
        : (emailConfigured ? 'Đã kết nối nhà cung cấp email' : 'Chưa cấu hình RESEND_API_KEY (Đang lưu hàng đợi an toàn; hãy thêm biến RESEND_API_KEY trong Cloudflare Worker)'),
      addresses: EMAIL_ADDRESSES
    },
    payment: {
      connected: paymentConfigured,
      provider: process.env.PAYMENT_PROVIDER || 'unconfigured',
      bank_code: process.env.PAYMENT_BANK_CODE || 'Chưa cấu hình',
      account_no_masked: process.env.PAYMENT_BANK_ACCOUNT_NO
        ? '***' + String(process.env.PAYMENT_BANK_ACCOUNT_NO).slice(-4)
        : 'Chưa cấu hình',
      status_label: paymentConfigured ? 'Đã kết nối cổng thanh toán/ngân hàng' : 'Chỉ xác nhận qua Webhook hợp lệ hoặc đối soát phân quyền'
    }
  };
}

module.exports = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CANONICAL_ORIGIN: process.env.CANONICAL_ORIGIN || 'https://wordbridge.io.vn',
  LOCAL_DB_FILE: process.env.LOCAL_DB_FILE || process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data/wordbridge_self_managed.db'),
  STORAGE_ROOT_PATH: process.env.STORAGE_ROOT_PATH || path.resolve(process.cwd(), 'data/dedicated_storage'),
  STORAGE_BACKUP_PATH: process.env.STORAGE_BACKUP_PATH || path.resolve(process.cwd(), 'data/dedicated_backups'),
  STORAGE_SERVER_PROVISIONED_BYTES: Number(process.env.STORAGE_SERVER_PROVISIONED_BYTES || (2 * TB_BYTES)),
  SESSION_SECRET: process.env.SESSION_SECRET || 'wb_dev_session_secret_do_not_use_in_prod_2026',
  CSRF_SECRET: process.env.CSRF_SECRET || 'wb_dev_csrf_secret_do_not_use_in_prod_2026',
  getMonthlyQuotaGb,
  setMonthlyQuotaGb,
  getIntegrationStatus
};
