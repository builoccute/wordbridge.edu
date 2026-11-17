"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Database,
  Download,
  Eye,
  FileCode2,
  FileText,
  Filter,
  FolderArchive,
  GraduationCap,
  HardDrive,
  History,
  KeyRound,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  Upload,
  XCircle,
} from "lucide-react";
import { adminRequest, formatShortDateTime } from "@/components/admin/admin-types";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Input } from "@/components/ui";
import type { PublicUser } from "@/lib/auth";
import { cn, formatViNumber } from "@/lib/utils";
import {
  LEARNER_TARGET_GROUPS,
  TRAINING_INSTITUTION_TYPES,
} from "@/lib/utils";

interface SourceStorageStudioProps {
  adminUser: PublicUser;
  standalonePage?: boolean;
}

type VaultViewSection =
  | "DASHBOARD"
  | "ALL_DATA"
  | "DOCUMENTS"
  | "POSTS"
  | "COMMENTS"
  | "UPLOADED_FILES"
  | "VERSIONS"
  | "TRASH"
  | "AUDIT_LOGS"
  | "SECURITY_SETTINGS"
  | "SYNC_STATUS"
  | "VOCATIONAL_TAXONOMY";

interface AccessStatusDTO {
  accountId: string;
  email: string;
  name: string;
  role: string;
  isAuthorized: boolean;
  isAccountLocked: boolean;
  hasPinSetup: boolean;
  mustResetPin: boolean;
  failedAttempts: number;
  maxFailedAttempts: number;
  lockUntil: string | null;
  lockRemainingSeconds: number;
  sessionValid: boolean;
  sessionExpiresAt: string | null;
  systemLock: {
    isLocked: boolean;
    lockedBy: string | null;
    lockedByName: string | null;
    reason: string | null;
    lockedAt: string | null;
    autoArchiveEnabled?: boolean;
  };
  adminAccounts: Array<{
    account_id: string;
    email: string;
    name: string;
    role: string;
    is_authorized: number;
    is_locked: number;
    failed_attempts: number;
    lock_until: string | null;
    must_reset_pin: number;
    hasPinSetup: boolean;
    pin_set_at: string | null;
    pin_updated_at: string | null;
  }>;
}

interface StorageOverviewDTO {
  stats: {
    totalItems: number;
    documentsCount: number;
    communityPostsCount: number;
    communityCommentsCount: number;
    uploadedFilesCount: number;
    totalVersionsCount: number;
    trashItemsCount: number;
    quarantinedItemsCount: number;
    blobCount: number;
    blobBytes: number;
    logicalUsedBytes: number;
    databaseFileSizeBytes: number;
    physicalDiskFreeBytes: number;
    physicalDiskTotalBytes: number;
    physicalDiskUsedBytes: number;
    physicalDiskUsedPercent: number;
    activeOrPendingTasksCount: number;
    pendingImportJobsCount: number;
    pendingArchiveEventsCount: number;
    maxSingleFileBytes: number;
  };
  systemStatus: {
    vaultState: "OPEN" | "LOCKED";
    systemLock: AccessStatusDTO["systemLock"];
    storageServiceConnected: boolean;
    sqliteStatus: string;
    autoArchiveState: string;
    initialImportState: {
      hasCompletedInitialImport: boolean;
      lastJobId: string | null;
      lastBatchCode: string | null;
      status: string;
      updatedAt?: string;
    };
    lastBackup: {
      backupId: string;
      fileName: string;
      sizeBytes: number;
      checksumSha256: string;
      createdAt: string;
      label: string;
    } | null;
    backupsCount: number;
    warnings: string[];
    nodes: Array<{
      id: string;
      node_code: string;
      name: string;
      db_file_path: string;
      status: string;
      notes: string;
    }>;
    architecture: {
      engine: string;
      pinHashAlgorithm: string;
      usesCloudflareR2: boolean;
      usesCloudflareD1: boolean;
    };
  };
  backups: Array<{
    backupId: string;
    fileName: string;
    sizeBytes: number;
    checksumSha256: string;
    createdAt: string;
    createdBy: string;
    label: string;
  }>;
}

interface StorageItemRow {
  id: string;
  item_type: "DOCUMENT" | "COMMUNITY_POST" | "COMMUNITY_COMMENT" | "UPLOADED_FILE";
  source_id: string | null;
  parent_source_id: string | null;
  title: string | null;
  preview_text: string | null;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  creator_id: string | null;
  creator_name: string | null;
  editor_id: string | null;
  editor_name: string | null;
  owner_id: string | null;
  source_status: string;
  storage_status: string;
  is_quarantined: number;
  quarantine_reason: string | null;
  external_url: string | null;
  external_source_note: string | null;
  file_id: string | null;
  file_format: string | null;
  file_size_bytes: number;
  checksum_sha256: string;
  current_version: number;
  storage_path: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  source_created_at: string | null;
  source_updated_at: string | null;
  imported_batch_code: string | null;
  archived_at: string;
  updated_at: string;
}

interface StorageVersionRow {
  id: string;
  item_id: string;
  version_number: number;
  title: string | null;
  content: string | null;
  file_id: string | null;
  file_size_bytes: number;
  checksum_sha256: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  change_summary: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface AuditLogRow {
  id: string;
  event_code: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action_label: string;
  target_item_id: string | null;
  target_type: string | null;
  target_label: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  error_reason: string | null;
  details: Record<string, unknown>;
  integrity_hash: string;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let val = bytes;
  let uIdx = 0;
  while (val >= 1024 && uIdx < units.length - 1) {
    val /= 1024;
    uIdx++;
  }
  return `${val.toFixed(uIdx === 0 ? 0 : 2)} ${units[uIdx]}`;
}

export function SourceStorageStudio({
  adminUser,
  standalonePage = true,
}: SourceStorageStudioProps) {
  const { notify } = useApp();

  const [access, setAccess] = React.useState<AccessStatusDTO | null>(null);
  const [loadingAccess, setLoadingAccess] = React.useState(true);
  const [pinInput, setPinInput] = React.useState("");
  const [setupPinInput, setSetupPinInput] = React.useState("");
  const [setupConfirmInput, setSetupConfirmInput] = React.useState("");
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const [forgotMode, setForgotMode] = React.useState(false);
  const [forgotStep, setForgotStep] = React.useState<"REQUEST" | "RESET">("REQUEST");
  const [accountPassword, setAccountPassword] = React.useState("");
  const [otpInput, setOtpInput] = React.useState("");
  const [resetNewPin, setResetNewPin] = React.useState("");
  const [resetConfirmPin, setResetConfirmPin] = React.useState("");
  const [devOtpHint, setDevOtpHint] = React.useState<string | null>(null);

  const [section, setSection] = React.useState<VaultViewSection>("DASHBOARD");
  const [overview, setOverview] = React.useState<StorageOverviewDTO | null>(null);
  const [loadingOverview, setLoadingOverview] = React.useState(false);

  const [items, setItems] = React.useState<StorageItemRow[]>([]);
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 1,
  });
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ACTIVE");
  const [formatFilter, setFormatFilter] = React.useState("ALL");
  const [creatorFilter, setCreatorFilter] = React.useState("");
  const [versionFilter, setVersionFilter] = React.useState("");
  const [dateFromFilter, setDateFromFilter] = React.useState("");
  const [dateToFilter, setDateToFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<StorageItemRow | null>(null);
  const [selectedVersions, setSelectedVersions] = React.useState<StorageVersionRow[]>([]);
  const [previewData, setPreviewData] = React.useState<{
    title: string | null;
    fileFormat: string;
    versionNumber: number;
    canPreviewText: boolean;
    safeSourceText: string | null;
    securityNote: string;
    externalUrl: string | null;
    externalSourceNote: string | null;
    checksumSha256: string;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [uploadLogicalPath, setUploadLogicalPath] = React.useState("");
  const [uploadNotes, setUploadNotes] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgressPct, setUploadProgressPct] = React.useState(0);
  const [uploadStatusMsg, setUploadStatusMsg] = React.useState<string | null>(null);
  const uploadAbortRef = React.useRef<AbortController | null>(null);

  const [permDeleteModalOpen, setPermDeleteModalOpen] = React.useState(false);
  const [permDeleteTargets, setPermDeleteTargets] = React.useState<string[]>([]);
  const [permDeletePhrase, setPermDeletePhrase] = React.useState("");

  const [auditLogs, setAuditLogs] = React.useState<AuditLogRow[]>([]);
  const [auditActorFilter, setAuditActorFilter] = React.useState("");
  const [auditEventFilter, setAuditEventFilter] = React.useState("ALL");
  const [auditPage, setAuditPage] = React.useState(1);
  const [auditTotalPages, setAuditTotalPages] = React.useState(1);

  const [importData, setImportData] = React.useState<{
    initialImportState: StorageOverviewDTO["systemStatus"]["initialImportState"];
    jobs: Array<{
      id: string;
      batch_code: string;
      triggered_by_name: string;
      status: string;
      total_discovered: number;
      processed_count: number;
      success_count: number;
      skipped_duplicate_count: number;
      failed_count: number;
      errors: Array<{ entityType: string; sourceId: string; title: string; error: string }>;
      checkpoints: Array<{
        entity_type: string;
        last_source_id: string | null;
        processed_count: number;
        status: string;
      }>;
      started_at: string;
      completed_at: string | null;
    }>;
    recentArchiveEvents: Array<{
      id: string;
      idempotency_key: string;
      event_type: string;
      item_type: string;
      source_id: string;
      status: string;
      retry_count: number;
      last_error: string | null;
      version_number: number | null;
      created_at: string;
    }>;
  } | null>(null);

  const [changeCurPin, setChangeCurPin] = React.useState("");
  const [changeNewPin, setChangeNewPin] = React.useState("");
  const [changeConfirmPin, setChangeConfirmPin] = React.useState("");
  const [lockReasonInput, setLockReasonInput] = React.useState(
    "Bảo trì định kỳ hoặc khóa khẩn cấp bảo vệ kho mã nguồn"
  );
  const [unlockPinInput, setUnlockPinInput] = React.useState("");
  const [backupLabelInput, setBackupLabelInput] = React.useState("");

  const [taxonomyFields, setTaxonomyFields] = React.useState<
    Array<{
      id: string;
      code: string;
      name: string;
      group_name: string;
      specialties: Array<{
        id: string;
        name: string;
        major_name: string;
        sampleSituations?: string[];
      }>;
    }>
  >([]);
  const [newFieldCode, setNewFieldCode] = React.useState("");
  const [newFieldName, setNewFieldName] = React.useState("");
  const [newSpecFieldId, setNewSpecFieldId] = React.useState("A");
  const [newSpecName, setNewSpecName] = React.useState("");

  const loadAccessStatus = React.useCallback(async () => {
    setLoadingAccess(true);
    try {
      const res = await adminRequest<AccessStatusDTO>("/api/admin/storage/access");
      setAccess(res);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Không thể kiểm tra quyền truy cập kho.");
    } finally {
      setLoadingAccess(false);
    }
  }, []);

  const loadOverview = React.useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await adminRequest<StorageOverviewDTO>("/api/admin/storage");
      setOverview(res);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải thống kê kho lưu trữ.", "error");
    } finally {
      setLoadingOverview(false);
    }
  }, [notify]);

  const loadItems = React.useCallback(
    async (page = 1, overrideType?: string, overrideStatus?: string) => {
      setLoadingItems(true);
      try {
        const effType = overrideType !== undefined ? overrideType : typeFilter;
        const effStatus = overrideStatus !== undefined ? overrideStatus : statusFilter;
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "15",
          type: effType,
          status: effStatus,
        });
        if (formatFilter !== "ALL") params.set("format", formatFilter);
        if (creatorFilter.trim()) params.set("creator", creatorFilter.trim());
        if (versionFilter.trim()) params.set("version", versionFilter.trim());
        if (dateFromFilter) params.set("dateFrom", dateFromFilter);
        if (dateToFilter) params.set("dateTo", dateToFilter);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await adminRequest<{
          items: StorageItemRow[];
          pagination: typeof pagination;
        }>(`/api/admin/storage/items?${params.toString()}`);

        setItems(res.items);
        setPagination(res.pagination);
        setSelectedIds([]);
      } catch (err) {
        notify(err instanceof Error ? err.message : "Không thể tải danh sách dữ liệu.", "error");
      } finally {
        setLoadingItems(false);
      }
    },
    [
      typeFilter,
      statusFilter,
      formatFilter,
      creatorFilter,
      versionFilter,
      dateFromFilter,
      dateToFilter,
      searchQuery,
      notify,
    ]
  );

  const loadAuditLogs = React.useCallback(
    async (page = 1) => {
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "25" });
        if (auditActorFilter.trim()) params.set("actor", auditActorFilter.trim());
        if (auditEventFilter !== "ALL") params.set("eventCode", auditEventFilter);
        const res = await adminRequest<{
          logs: AuditLogRow[];
          pagination: { page: number; totalPages: number };
        }>(`/api/admin/storage/audit?${params.toString()}`);
        setAuditLogs(res.logs);
        setAuditPage(res.pagination.page);
        setAuditTotalPages(res.pagination.totalPages);
      } catch (err) {
        notify(err instanceof Error ? err.message : "Không thể tải nhật ký hoạt động.", "error");
      }
    },
    [auditActorFilter, auditEventFilter, notify]
  );

  const loadImportStatus = React.useCallback(async () => {
    try {
      const res = await adminRequest<NonNullable<typeof importData>>("/api/admin/storage/import");
      setImportData(res);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải trạng thái đồng bộ.", "error");
    }
  }, [notify]);

  const loadTaxonomy = React.useCallback(async () => {
    try {
      const res = await adminRequest<{ fields: typeof taxonomyFields }>("/api/taxonomy");
      setTaxonomyFields(res.fields);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void loadAccessStatus();
  }, [loadAccessStatus]);

  React.useEffect(() => {
    if (access?.sessionValid) {
      void loadOverview();
      void loadItems(1);
      void loadTaxonomy();
    }
  }, [access?.sessionValid, loadOverview, loadItems, loadTaxonomy]);

  React.useEffect(() => {
    if (!access?.lockRemainingSeconds || access.lockRemainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setAccess((prev) => {
        if (!prev || prev.lockRemainingSeconds <= 1) {
          void loadAccessStatus();
          return prev;
        }
        return { ...prev, lockRemainingSeconds: prev.lockRemainingSeconds - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [access?.lockRemainingSeconds, loadAccessStatus]);

  const handleSelectQuickSection = (target: VaultViewSection) => {
    setSection(target);
    if (target === "ALL_DATA") {
      setTypeFilter("ALL");
      setStatusFilter("ACTIVE");
      void loadItems(1, "ALL", "ACTIVE");
    } else if (target === "DOCUMENTS") {
      setTypeFilter("DOCUMENT");
      setStatusFilter("ACTIVE");
      void loadItems(1, "DOCUMENT", "ACTIVE");
    } else if (target === "POSTS") {
      setTypeFilter("COMMUNITY_POST");
      setStatusFilter("ACTIVE");
      void loadItems(1, "COMMUNITY_POST", "ACTIVE");
    } else if (target === "COMMENTS") {
      setTypeFilter("COMMUNITY_COMMENT");
      setStatusFilter("ACTIVE");
      void loadItems(1, "COMMUNITY_COMMENT", "ACTIVE");
    } else if (target === "UPLOADED_FILES") {
      setTypeFilter("UPLOADED_FILE");
      setStatusFilter("ALL");
      void loadItems(1, "UPLOADED_FILE", "ALL");
    } else if (target === "VERSIONS") {
      setTypeFilter("ALL");
      setStatusFilter("ACTIVE");
      void loadItems(1, "ALL", "ACTIVE");
    } else if (target === "TRASH") {
      setTypeFilter("ALL");
      setStatusFilter("TRASHED");
      void loadItems(1, "ALL", "TRASHED");
    } else if (target === "AUDIT_LOGS") {
      void loadAuditLogs(1);
    } else if (target === "SYNC_STATUS") {
      void loadImportStatus();
    } else if (target === "VOCATIONAL_TAXONOMY") {
      void loadTaxonomy();
    } else if (target === "DASHBOARD") {
      void loadOverview();
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!/^\d{6}$/.test(setupPinInput)) {
      setAuthError("Mã PIN phải gồm chính xác 6 chữ số từ 0 đến 9 (cho phép số 0 ở đầu).");
      return;
    }
    if (setupPinInput !== setupConfirmInput) {
      setAuthError("Mã PIN xác nhận không khớp.");
      return;
    }
    setAuthBusy(true);
    try {
      await adminRequest("/api/admin/storage/access", {
        method: "POST",
        body: JSON.stringify({
          action: "SETUP_PIN",
          pin: setupPinInput,
          confirmPin: setupConfirmInput,
        }),
      });
      setSetupPinInput("");
      setSetupConfirmInput("");
      notify("Đã thiết lập mã PIN 6 chữ số (Argon2id) thành công! Vui lòng nhập PIN để mở kho.", "success");
      await loadAccessStatus();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Không thể thiết lập PIN.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!/^\d{6}$/.test(pinInput)) {
      setAuthError("Vui lòng nhập đúng 6 chữ số PIN.");
      return;
    }
    setAuthBusy(true);
    try {
      await adminRequest("/api/admin/storage/access", {
        method: "POST",
        body: JSON.stringify({
          action: "VERIFY_PIN",
          pin: pinInput,
        }),
      });
      setPinInput("");
      notify("Xác minh PIN thành công! Phiên truy cập kho có hiệu lực tối đa 8 giờ.", "success");
      await loadAccessStatus();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Mã PIN không chính xác.");
      await loadAccessStatus();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      const res = await adminRequest<{
        email: string;
        expiresAt: string;
        devOtpHint?: string;
      }>("/api/admin/storage/access", {
        method: "POST",
        body: JSON.stringify({
          action: "FORGOT_PIN_REQUEST",
          accountPassword: accountPassword || undefined,
        }),
      });
      setDevOtpHint(res.devOtpHint || null);
      setForgotStep("RESET");
      notify(`Đã phát hành mã OTP 6 số (hiệu lực 5 phút, dùng 1 lần) tới ${res.email}.`, "info");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Không thể gửi OTP khôi phục PIN.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResetPinWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!/^\d{6}$/.test(resetNewPin) || resetNewPin !== resetConfirmPin) {
      setAuthError("PIN mới phải gồm đúng 6 chữ số (0–9) và khớp với PIN xác nhận.");
      return;
    }
    setAuthBusy(true);
    try {
      await adminRequest("/api/admin/storage/access", {
        method: "POST",
        body: JSON.stringify({
          action: "FORGOT_PIN_RESET",
          otp: otpInput,
          newPin: resetNewPin,
          confirmPin: resetConfirmPin,
        }),
      });
      setForgotMode(false);
      setForgotStep("REQUEST");
      setOtpInput("");
      setResetNewPin("");
      setResetConfirmPin("");
      setDevOtpHint(null);
      notify("Khôi phục PIN mới thành công! Các phiên kho cũ đã được thu hồi.", "success");
      await loadAccessStatus();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Xác minh OTP hoặc đặt lại PIN thất bại.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogoutVault = async () => {
    await adminRequest("/api/admin/storage/access", {
      method: "POST",
      body: JSON.stringify({ action: "LOGOUT_VAULT" }),
    });
    notify("Đã đóng phiên truy cập Kho lưu trữ mã nguồn.", "info");
    await loadAccessStatus();
  };

  const openItemDetailAndPreview = async (item: StorageItemRow, versionNumber?: number) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const verParam = versionNumber ? `&version=${versionNumber}` : "";
      const [detailRes, prevRes] = await Promise.all([
        adminRequest<{ item: StorageItemRow; versions: StorageVersionRow[] }>(
          `/api/admin/storage/items?itemId=${encodeURIComponent(item.id)}`
        ),
        adminRequest<NonNullable<typeof previewData>>(
          `/api/admin/storage/items?itemId=${encodeURIComponent(item.id)}&mode=preview${verParam}`
        ),
      ]);
      setSelectedItem(detailRes.item);
      setSelectedVersions(detailRes.versions);
      setPreviewData(prevRes);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tải chi tiết mục lưu trữ.", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadItem = (itemId: string, versionNumber?: number) => {
    const qs = versionNumber ? `&version=${versionNumber}` : "";
    const url = `/api/admin/storage/files?itemId=${encodeURIComponent(itemId)}${qs}&raw=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleRestoreVersion = async (itemId: string, versionNumber: number, applyLive = false) => {
    const msg = applyLive
      ? `XÁC NHẬN BỔ SUNG: Bạn có chắc chắn muốn cập nhật nội dung phiên bản #${versionNumber} từ kho về trực tiếp hệ thống gốc trên website không?`
      : `Khôi phục phiên bản #${versionNumber} thành phiên bản hiện tại mới trong kho (không tự động ghi đè dữ liệu gốc trên website)?`;
    if (!window.confirm(msg)) return;

    try {
      await adminRequest("/api/admin/storage/versions", {
        method: "POST",
        body: JSON.stringify({
          action: applyLive ? "APPLY_TO_LIVE_WEBSITE" : "RESTORE_IN_VAULT",
          itemId,
          versionNumber,
          confirmApplyToLive: applyLive,
        }),
      });
      notify(
        applyLive
          ? `Đã đồng bộ phiên bản #${versionNumber} về hệ thống gốc trên website!`
          : `Đã khôi phục phiên bản #${versionNumber} thành phiên bản hiện tại mới trong kho!`,
        "success"
      );
      if (selectedItem) {
        await openItemDetailAndPreview(selectedItem);
      }
      await loadItems(pagination.page);
      await loadOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lỗi khôi phục phiên bản.", "error");
    }
  };

  const handleMoveToTrash = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Đưa ${ids.length} mục đã chọn vào Thùng rác kho lưu trữ? (Dữ liệu chưa bị xóa vĩnh viễn và có thể khôi phục)`
      )
    ) {
      return;
    }
    try {
      await adminRequest("/api/admin/storage/trash", {
        method: "POST",
        body: JSON.stringify({
          action: "MOVE_TO_TRASH",
          itemIds: ids,
          reason: "Quản trị viên chuyển vào thùng rác",
        }),
      });
      notify(`Đã chuyển ${ids.length} mục vào Thùng rác.`, "info");
      setDetailModalOpen(false);
      await loadItems(pagination.page);
      await loadOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể chuyển vào thùng rác.", "error");
    }
  };

  const handleRestoreFromTrash = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await adminRequest("/api/admin/storage/trash", {
        method: "POST",
        body: JSON.stringify({
          action: "RESTORE_FROM_TRASH",
          itemIds: ids,
        }),
      });
      notify(`Đã khôi phục ${ids.length} mục từ Thùng rác (giữ nguyên ID và checksum SHA-256)!`, "success");
      await loadItems(pagination.page);
      await loadOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể khôi phục từ thùng rác.", "error");
    }
  };

  const handleConfirmPermanentDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminRequest<{ deletedCount: number; freedBytes: number }>(
        "/api/admin/storage/trash",
        {
          method: "POST",
          body: JSON.stringify({
            action: "PERMANENT_DELETE",
            itemIds: permDeleteTargets,
            confirmationPhrase: permDeletePhrase,
          }),
        }
      );
      notify(
        `Đã xóa vĩnh viễn ${res.deletedCount} mục và giải phóng ${formatBytes(res.freedBytes)} BLOB!`,
        "success"
      );
      setPermDeleteModalOpen(false);
      setPermDeleteTargets([]);
      setPermDeletePhrase("");
      await loadItems(1);
      await loadOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xóa vĩnh viễn thất bại.", "error");
    }
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      notify("Vui lòng chọn ít nhất một tệp để tải lên kho.", "error");
      return;
    }

    const maxBytes = 15 * 1024 * 1024;
    for (const f of uploadFiles) {
      if (f.size > maxBytes) {
        notify(
          `Tệp '${f.name}' (${formatBytes(f.size)}) vượt quá giới hạn tối đa 15 MB/tệp!`,
          "error"
        );
        return;
      }
      if (f.size === 0) {
        notify(`Tệp '${f.name}' rỗng (0 byte).`, "error");
        return;
      }
    }

    setUploading(true);
    setUploadProgressPct(5);
    setUploadStatusMsg(`Đang khởi tạo phiên tải lên cho ${uploadFiles.length} tệp...`);
    const controller = new AbortController();
    uploadAbortRef.current = controller;

    try {
      let completed = 0;
      for (const file of uploadFiles) {
        if (controller.signal.aborted) break;
        setUploadStatusMsg(`Đang ghi BLOB SQLite và kiểm tra SHA-256 cho '${file.name}'...`);

        const formData = new FormData();
        formData.append("file", file);
        if (uploadLogicalPath.trim()) {
          formData.append("logicalPath", uploadLogicalPath.trim());
        }
        if (uploadNotes.trim()) {
          formData.append("notes", uploadNotes.trim());
        }

        const res = await fetch("/api/admin/storage/files", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        const json = (await res.json()) as {
          success: boolean;
          data?: {
            file?: {
              fileName: string;
              versionNumber: number;
              checksumSha256: string;
              isQuarantined: boolean;
              quarantineReason?: string;
            };
          };
          error?: { message?: string };
        };

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || `Lỗi tải tệp ${file.name}`);
        }

        completed++;
        setUploadProgressPct(Math.round((completed / uploadFiles.length) * 100));

        if (json.data?.file?.isQuarantined) {
          notify(
            `Cảnh báo bảo mật: '${file.name}' chứa thông tin cấu hình nhạy cảm và đã được đưa vào khu vực cách ly (${json.data.file.quarantineReason}).`,
            "info"
          );
        }
      }

      notify(
        `Đã tải lên và xác minh checksum SHA-256 thành công cho ${completed} tệp trong SQLite BLOB!`,
        "success"
      );
      setUploadFiles([]);
      setUploadLogicalPath("");
      setUploadNotes("");
      setUploadModalOpen(false);
      await loadOverview();
      await loadItems(1);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        notify("Đã hủy tác vụ tải tệp lên kho (không tạo bản ghi chưa hoàn tất).", "info");
      } else {
        notify(err instanceof Error ? err.message : "Tải tệp lên thất bại.", "error");
      }
    } finally {
      setUploading(false);
      setUploadProgressPct(0);
      setUploadStatusMsg(null);
      uploadAbortRef.current = null;
    }
  };

  const handleCancelActiveUpload = () => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }
  };

  const handleToggleSystemLock = async (lock: boolean) => {
    try {
      await adminRequest("/api/admin/storage/access", {
        method: "POST",
        body: JSON.stringify({
          action: "SYSTEM_LOCK",
          lock,
          reason: lockReasonInput,
          pin: unlockPinInput || undefined,
        }),
      });
      setUnlockPinInput("");
      notify(
        lock
          ? "Đã khóa kho lưu trữ toàn hệ thống và thu hồi mọi phiên đang hoạt động!"
          : "Đã mở khóa kho lưu trữ toàn hệ thống!",
        "success"
      );
      await loadAccessStatus();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể thay đổi trạng thái khóa kho.", "error");
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(changeNewPin) || changeNewPin !== changeConfirmPin) {
      notify("Mã PIN mới phải gồm đúng 6 chữ số (0–9) và khớp xác nhận.", "error");
      return;
    }
    try {
      await adminRequest("/api/admin/storage/access", {
        method: "POST",
        body: JSON.stringify({
          action: "CHANGE_PIN",
          currentPin: changeCurPin,
          newPin: changeNewPin,
          confirmPin: changeConfirmPin,
        }),
      });
      setChangeCurPin("");
      setChangeNewPin("");
      setChangeConfirmPin("");
      notify("Đã đổi mã PIN thành công! Vui lòng xác minh lại PIN mới để mở phiên mới.", "success");
      await loadAccessStatus();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể đổi mã PIN.", "error");
    }
  };

  const handleCreateBackup = async () => {
    try {
      const res = await adminRequest<{
        backup: { backupId: string; fileName: string; sizeBytes: number; checksumSha256: string };
      }>("/api/admin/storage/backup", {
        method: "POST",
        body: JSON.stringify({
          action: "CREATE_BACKUP",
          label: backupLabelInput.trim() || "Sao lưu chủ động bởi Admin",
        }),
      });
      setBackupLabelInput("");
      notify(
        `Sao lưu SQLite BLOB thành công: ${res.backup.fileName} (${formatBytes(res.backup.sizeBytes)})`,
        "success"
      );
      await loadOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Sao lưu thất bại.", "error");
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (
      !window.confirm(
        `Xác nhận khôi phục cơ sở dữ liệu kho lưu trữ từ bản sao lưu '${backupId}'?`
      )
    ) {
      return;
    }
    try {
      await adminRequest("/api/admin/storage/backup", {
        method: "POST",
        body: JSON.stringify({
          action: "RESTORE_BACKUP",
          backupId,
        }),
      });
      notify(`Đã khôi phục kho lưu trữ từ bản sao lưu ${backupId} thành công!`, "success");
      await loadOverview();
      await loadItems(1);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Khôi phục bản sao lưu thất bại.", "error");
    }
  };

  const handleAddVocationalField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminRequest("/api/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          operation: "ADD_FIELD",
          code: newFieldCode,
          name: newFieldName,
        }),
      });
      setNewFieldCode("");
      setNewFieldName("");
      notify("Đã thêm lĩnh vực nghề nghiệp mới vào danh mục hệ thống!", "success");
      await loadTaxonomy();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể thêm lĩnh vực.", "error");
    }
  };

  const handleAddVocationalSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminRequest("/api/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          operation: "ADD_SPECIALTY",
          fieldId: newSpecFieldId,
          name: newSpecName,
        }),
      });
      setNewSpecName("");
      notify("Đã mở rộng chuyên ngành mới trong hệ thống quản trị!", "success");
      await loadTaxonomy();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể thêm chuyên ngành.", "error");
    }
  };

  if (loadingAccess && !access) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#19462b] border-t-transparent" />
          <p className="text-xs font-bold text-[var(--muted-foreground)]">
            Đang kiểm tra xác thực đa lớp &amp; trạng thái Kho lưu trữ mã nguồn...
          </p>
        </div>
      </div>
    );
  }

  if (!access?.sessionValid) {
    const isSystemLocked = Boolean(access?.systemLock?.isLocked);
    const needsSetup = !access?.hasPinSetup || Boolean(access?.mustResetPin);
    const isLockedOut15m = (access?.lockRemainingSeconds || 0) > 0;

    return (
      <div
        className={cn(
          "bg-[#f6f3ea] bg-paper-grid px-4 py-8 sm:px-6 dark:bg-[#0c130e]",
          standalonePage && "min-h-screen"
        )}
      >
        <div className="mx-auto max-w-xl space-y-5">
          {standalonePage && (
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 hover:text-[var(--heading)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quản trị hệ thống</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-bold">
                <Database className="h-3.5 w-3.5 text-[#19462b] dark:text-[#9ee56f]" />
                WORD BRIDGE SOURCE STORAGE · /luu-tru-ma-nguon
              </span>
            </div>
          )}

          <Card className="rounded-[28px] border-2 border-[#1b2d1c] bg-white p-6 sm:p-8 shadow-[6px_6px_0_#1b2d1c] dark:border-[#9ee56f]/35 dark:bg-[#16211a]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#1b2d1c] bg-[#9ee56f] text-[#0f241b] shadow-[3px_3px_0_#1b2d1c]">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#48753e] dark:text-[#9ee56f]">
                    XÁC THỰC BẢO MẬT 6 LỚP · SQLITE BLOB ĐỘC LẬP
                  </p>
                  <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[var(--heading)]">
                    Lưu trữ mã nguồn &amp; dữ liệu
                  </h1>
                </div>
              </div>
              <Badge variant={isSystemLocked ? "gold" : "green"}>
                {isSystemLocked ? "KHO ĐANG KHÓA" : "YÊU CẦU MÃ PIN"}
              </Badge>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[var(--muted-foreground)]">Tài khoản Admin: </span>
                <b className="text-[var(--heading)]">{adminUser.name}</b> ({adminUser.email})
              </div>
              <Badge variant="neutral">Argon2id + Salt riêng</Badge>
            </div>

            {isSystemLocked ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold">
                        Kho lưu trữ đang bị khóa toàn hệ thống
                      </p>
                      <p>
                        Lý do: <b>{access?.systemLock?.reason || "Bảo mật hệ thống"}</b>
                      </p>
                      <p>
                        Người thực hiện:{" "}
                        <b>{access?.systemLock?.lockedByName || access?.systemLock?.lockedBy}</b> ·
                        Thời điểm: {formatShortDateTime(access?.systemLock?.lockedAt)}
                      </p>
                      <p className="text-[11px] opacity-85">
                        Mọi thao tác đọc, tải lên, tải xuống và khôi phục đang bị chặn. Dữ liệu hiện có được bảo toàn nguyên vẹn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-[var(--border)] p-4">
                  <label className="block text-xs font-bold text-[var(--heading)]">
                    Mở khóa kho toàn hệ thống (Chỉ dành cho Admin quản lý bảo mật kho)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={unlockPinInput}
                      onChange={(e) =>
                        setUnlockPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Nhập PIN 6 chữ số để mở khóa"
                      className="font-mono text-center tracking-[0.35em]"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleToggleSystemLock(false)}
                      disabled={unlockPinInput.length !== 6}
                    >
                      <Unlock className="h-4 w-4" />
                      Mở khóa kho
                    </Button>
                  </div>
                </div>
              </div>
            ) : forgotMode ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-extrabold text-[var(--heading)]">
                    Khôi phục mã PIN 6 chữ số (Quên mật khẩu/PIN kho)
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setAuthError(null);
                    }}
                    className="text-xs font-bold text-[var(--primary)] underline cursor-pointer"
                  >
                    Quay lại nhập PIN
                  </button>
                </div>

                {forgotStep === "REQUEST" ? (
                  <form onSubmit={handleRequestForgotOtp} className="space-y-3.5 text-xs">
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      Hệ thống sẽ xác minh tài khoản Admin đang đăng nhập (<b>{adminUser.email}</b>)
                      và gửi mã OTP 6 chữ số có thời hạn <b>5 phút</b> (chỉ dùng 1 lần). Hệ thống
                      không bao giờ gửi PIN dạng văn bản thuần qua email.
                    </p>
                    <div>
                      <label className="mb-1 block font-bold">
                        Xác nhận mật khẩu tài khoản Admin chính (nếu có)
                      </label>
                      <Input
                        type="password"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Nhập mật khẩu đăng nhập Admin để xác thực lại"
                      />
                    </div>
                    {authError && (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        {authError}
                      </p>
                    )}
                    <Button type="submit" loading={authBusy} className="w-full">
                      Gửi mã OTP khôi phục PIN (Hiệu lực 5 phút)
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPinWithOtp} className="space-y-3.5 text-xs">
                    {devOtpHint && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Mã OTP (Môi trường thử nghiệm):</span>
                          <button
                            type="button"
                            onClick={() => setOtpInput(devOtpHint)}
                            className="rounded bg-amber-200 px-2 py-0.5 font-mono font-extrabold"
                          >
                            {devOtpHint} (Điền nhanh)
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block font-bold">Mã OTP 6 số (Hiệu lực 5 phút)</label>
                      <Input
                        required
                        maxLength={6}
                        inputMode="numeric"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Nhập 6 chữ số OTP"
                        className="font-mono text-center text-base font-bold tracking-[0.35em]"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block font-bold">PIN mới (6 chữ số 0–9)</label>
                        <Input
                          required
                          type="password"
                          maxLength={6}
                          inputMode="numeric"
                          value={resetNewPin}
                          onChange={(e) =>
                            setResetNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="VD: 048291"
                          className="font-mono text-center tracking-[0.3em]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-bold">Xác nhận PIN mới</label>
                        <Input
                          required
                          type="password"
                          maxLength={6}
                          inputMode="numeric"
                          value={resetConfirmPin}
                          onChange={(e) =>
                            setResetConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="Nhập lại 6 chữ số"
                          className="font-mono text-center tracking-[0.3em]"
                        />
                      </div>
                    </div>
                    {authError && (
                      <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        {authError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" loading={authBusy} className="flex-1">
                        Lưu PIN mới &amp; Thu hồi phiên cũ
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForgotStep("REQUEST")}
                      >
                        Cấp lại OTP
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : needsSetup ? (
              <form onSubmit={handleSetupPin} className="mt-5 space-y-4 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
                  <p className="font-bold">Thiết lập mã PIN 6 chữ số lần đầu cho tài khoản Admin</p>
                  <p className="mt-0.5 text-[11px]">
                    Mã PIN gồm đúng 6 chữ số (0–9, cho phép số 0 ở đầu), được băm bằng thuật toán
                    chuyên dụng <b>Argon2id</b> với salt riêng và pepper phía máy chủ. Không có PIN
                    mặc định dùng chung.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold">Mã PIN mới (6 chữ số)</label>
                    <Input
                      required
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupPinInput}
                      onChange={(e) =>
                        setSetupPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Nhập 6 chữ số (VD: 012345)"
                      className="font-mono text-center text-base font-bold tracking-[0.35em]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold">Xác nhận lại mã PIN</label>
                    <Input
                      required
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupConfirmInput}
                      onChange={(e) =>
                        setSetupConfirmInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Nhập lại 6 chữ số"
                      className="font-mono text-center text-base font-bold tracking-[0.35em]"
                    />
                  </div>
                </div>

                {authError && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {authError}
                  </p>
                )}

                <Button type="submit" loading={authBusy} className="w-full">
                  <KeyRound className="h-4 w-4" />
                  Thiết lập mã PIN 6 chữ số
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPin} className="mt-5 space-y-4 text-xs">
                {isLockedOut15m ? (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950">
                    <p className="font-bold text-sm">
                      Tạm khóa xác minh PIN trong 15 phút (Đã nhập sai 5 lần liên tiếp)
                    </p>
                    <p className="mt-1">
                      Thời gian chờ còn lại:{" "}
                      <b className="font-mono text-base">
                        {Math.floor((access?.lockRemainingSeconds || 0) / 60)} phút{" "}
                        {(access?.lockRemainingSeconds || 0) % 60} giây
                      </b>
                    </p>
                    <p className="mt-1 text-[11px] opacity-80">
                      Lưu ý: Khóa xác minh PIN chỉ bảo vệ kho lưu trữ, không khóa tài khoản WORD
                      BRIDGE của bạn.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Nhập mã PIN 6 chữ số để mở kho (Phiên tối đa 8 giờ)
                      </label>
                      <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                        Sai liên tiếp: {access?.failedAttempts || 0}/5
                      </span>
                    </div>
                    <Input
                      required
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      disabled={isLockedOut15m}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                      className="h-12 font-mono text-center text-xl font-extrabold tracking-[0.5em]"
                    />
                  </div>
                )}

                {authError && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {authError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setAuthError(null);
                    }}
                    className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu? (Khôi phục PIN qua OTP)
                  </button>
                  <Button
                    type="submit"
                    loading={authBusy}
                    disabled={isLockedOut15m || pinInput.length !== 6}
                  >
                    <Unlock className="h-4 w-4" />
                    Xác minh PIN &amp; Mở kho
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  const quickAccessLinks: Array<{
    id: VaultViewSection;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    { id: "DASHBOARD", label: "Tổng quan kho", icon: <HardDrive className="h-4 w-4" /> },
    {
      id: "ALL_DATA",
      label: "Tất cả dữ liệu",
      icon: <Database className="h-4 w-4" />,
      count: overview?.stats.totalItems,
    },
    {
      id: "DOCUMENTS",
      label: "Tài liệu",
      icon: <FileText className="h-4 w-4" />,
      count: overview?.stats.documentsCount,
    },
    {
      id: "POSTS",
      label: "Bài đăng cộng đồng",
      icon: <MessageSquare className="h-4 w-4" />,
      count: overview?.stats.communityPostsCount,
    },
    {
      id: "COMMENTS",
      label: "Bình luận cộng đồng",
      icon: <MessageSquare className="h-4 w-4" />,
      count: overview?.stats.communityCommentsCount,
    },
    {
      id: "UPLOADED_FILES",
      label: "Tệp tải lên (BLOB)",
      icon: <FolderArchive className="h-4 w-4" />,
      count: overview?.stats.uploadedFilesCount,
    },
    {
      id: "VERSIONS",
      label: "Lịch sử phiên bản",
      icon: <History className="h-4 w-4" />,
      count: overview?.stats.totalVersionsCount,
    },
    {
      id: "TRASH",
      label: "Thùng rác",
      icon: <Trash2 className="h-4 w-4" />,
      count: overview?.stats.trashItemsCount,
    },
    {
      id: "AUDIT_LOGS",
      label: "Nhật ký hoạt động",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "SECURITY_SETTINGS",
      label: "Cài đặt bảo mật & Sao lưu",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      id: "SYNC_STATUS",
      label: "Tình trạng đồng bộ dữ liệu",
      icon: <RefreshCw className="h-4 w-4" />,
      count: overview?.stats.activeOrPendingTasksCount,
    },
    {
      id: "VOCATIONAL_TAXONOMY",
      label: "Đối tượng & Chuyên ngành nghề",
      icon: <GraduationCap className="h-4 w-4" />,
    },
  ];

  const isDataTableSection = [
    "ALL_DATA",
    "DOCUMENTS",
    "POSTS",
    "COMMENTS",
    "UPLOADED_FILES",
    "VERSIONS",
    "TRASH",
  ].includes(section);

  return (
    <div
      className={cn(
        "bg-[#f6f3ea] bg-paper-grid text-[var(--foreground)] dark:bg-[#0c130e]",
        standalonePage ? "min-h-screen p-4 sm:p-6 lg:p-8" : "space-y-6"
      )}
    >
      <div className={cn(standalonePage ? "mx-auto max-w-7xl space-y-6" : "space-y-6")}>
        <div className="rounded-[24px] border-2 border-[#1b2d1c] bg-[#0f241b] p-5 sm:p-6 text-white shadow-[4px_4px_0_#1b2d1c]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ee56f] px-3 py-0.5 text-[11px] font-black text-[#0f241b]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  WORD BRIDGE SOURCE STORAGE
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                  SQLite BLOB Độc lập · Không dùng R2/D1
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                  Phiên PIN hết hạn: {formatShortDateTime(access.sessionExpiresAt)}
                </span>
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
                Quản trị → Lưu trữ mã nguồn (/luu-tru-ma-nguon)
              </h1>
              <p className="text-xs text-white/75">
                Tự động thu thập học liệu, bài đăng, bình luận, quản lý tệp tải lên (≤15 MB/tệp),
                phiên bản, thùng rác và khôi phục độc lập với vòng đời deploy website.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                className="bg-[#9ee56f] text-[#0f241b] hover:bg-[#b1f085] font-extrabold"
              >
                <Upload className="h-4 w-4" />
                Tải tệp lên kho (≤15 MB)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void loadOverview();
                  void loadItems(pagination.page);
                }}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingOverview && "animate-spin")} />
                Làm mới
              </Button>
              {standalonePage ? (
                <Link
                  href="/admin"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Admin Studio
                </Link>
              ) : (
                <Link
                  href="/luu-tru-ma-nguon"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20"
                >
                  Mở toàn màn hình (/luu-tru-ma-nguon)
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleLogoutVault()}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/20 px-3 text-xs font-bold text-rose-100 hover:bg-rose-500/30 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Khóa phiên PIN
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/15 pt-4">
            {quickAccessLinks.map((lnk) => {
              const active = section === lnk.id;
              return (
                <button
                  key={lnk.id}
                  type="button"
                  onClick={() => handleSelectQuickSection(lnk.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                    active
                      ? "bg-[#9ee56f] text-[#0f241b] shadow-xs"
                      : "bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"
                  )}
                >
                  {lnk.icon}
                  <span>{lnk.label}</span>
                  {lnk.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 font-mono text-[10px] font-extrabold",
                        active ? "bg-[#0f241b]/15 text-[#0f241b]" : "bg-white/15 text-white"
                      )}
                    >
                      {lnk.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {section === "DASHBOARD" && overview && (
          <div className="space-y-6">
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="p-4">
                <p className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
                  Tổng dữ liệu đã lưu
                </p>
                <p className="mt-1 font-mono-num text-2xl font-black text-[var(--heading)]">
                  {formatViNumber(overview.stats.totalItems)}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-[#9ee56f]">
                  {formatViNumber(overview.stats.totalVersionsCount)} phiên bản lịch sử
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
                  Tài liệu học tập
                </p>
                <p className="mt-1 font-mono-num text-2xl font-black text-[var(--heading)]">
                  {formatViNumber(overview.stats.documentsCount)}
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectQuickSection("DOCUMENTS")}
                  className="mt-1 text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Xem danh sách tài liệu &rarr;
                </button>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
                  Bài đăng &amp; Bình luận
                </p>
                <p className="mt-1 font-mono-num text-2xl font-black text-[var(--heading)]">
                  {formatViNumber(overview.stats.communityPostsCount)} /{" "}
                  {formatViNumber(overview.stats.communityCommentsCount)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Bài viết / Bình luận cộng đồng
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
                  Tệp tải lên (SQLite BLOB)
                </p>
                <p className="mt-1 font-mono-num text-2xl font-black text-[var(--heading)]">
                  {formatViNumber(overview.stats.uploadedFilesCount)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Dung lượng BLOB: {formatBytes(overview.stats.blobBytes)}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
                  Thùng rác &amp; Tác vụ
                </p>
                <p className="mt-1 font-mono-num text-2xl font-black text-[var(--heading)]">
                  {overview.stats.trashItemsCount} mục rác
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Tác vụ đang chạy/chờ: {overview.stats.activeOrPendingTasksCount}
                </p>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-[var(--primary)]" />
                    Dung lượng thực tế từ dịch vụ lưu trữ độc lập
                  </h2>
                  <Badge variant="green">Số liệu vật lý thực tế</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                    <p className="text-[var(--muted-foreground)]">Dung lượng DB SQLite + WAL</p>
                    <p className="mt-0.5 font-mono text-base font-black text-[var(--heading)]">
                      {formatBytes(overview.stats.databaseFileSizeBytes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                    <p className="text-[var(--muted-foreground)]">Tổng dung lượng dữ liệu kho</p>
                    <p className="mt-0.5 font-mono text-base font-black text-[var(--heading)]">
                      {formatBytes(overview.stats.logicalUsedBytes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                    <p className="text-[var(--muted-foreground)]">Dung lượng vật lý còn trống</p>
                    <p className="mt-0.5 font-mono text-base font-black text-emerald-700 dark:text-[#9ee56f]">
                      {formatBytes(overview.stats.physicalDiskFreeBytes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                    <p className="text-[var(--muted-foreground)]">Giới hạn mỗi tệp tải lên</p>
                    <p className="mt-0.5 font-mono text-base font-black text-[var(--heading)]">
                      15.00 MB / tệp
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Chính sách sản phẩm: Giới hạn 15 MB áp dụng cho từng tệp tải lên; không đặt trần GB
                  cố định cho tổng kho ở cấp sản phẩm (theo dõi theo dung lượng ổ đĩa vật lý thực tế).
                </p>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--primary)]" />
                    Trạng thái hệ thống lưu trữ
                  </h2>
                  <Badge
                    variant={overview.systemStatus.vaultState === "OPEN" ? "green" : "gold"}
                  >
                    {overview.systemStatus.vaultState === "OPEN" ? "KHO ĐANG MỞ" : "KHO ĐANG KHÓA"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5">
                    <span className="text-[var(--muted-foreground)]">Kết nối Storage API:</span>
                    <p className="font-bold text-emerald-700 dark:text-[#9ee56f]">
                      Đã kết nối (HTTPS/Token)
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5">
                    <span className="text-[var(--muted-foreground)]">Cơ sở dữ liệu SQLite:</span>
                    <p className="font-bold text-[var(--heading)]">
                      {overview.systemStatus.sqliteStatus}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5">
                    <span className="text-[var(--muted-foreground)]">Trạng thái tự động lưu:</span>
                    <p className="font-bold text-emerald-700 dark:text-[#9ee56f]">
                      Đang bật (Event Queue)
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5">
                    <span className="text-[var(--muted-foreground)]">Nhập dữ liệu cũ lần đầu:</span>
                    <p className="font-bold text-[var(--heading)]">
                      {overview.systemStatus.initialImportState?.status} (
                      {overview.systemStatus.initialImportState?.lastBatchCode || "Hoàn tất"})
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Sao lưu gần nhất: </span>
                    {overview.systemStatus.lastBackup ? (
                      <b>
                        {overview.systemStatus.lastBackup.fileName} (
                        {formatBytes(overview.systemStatus.lastBackup.sizeBytes)})
                      </b>
                    ) : (
                      <span>Chưa có bản sao lưu thủ công</span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void handleCreateBackup()}>
                    Sao lưu ngay
                  </Button>
                </div>

                {overview.systemStatus.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
                    {overview.systemStatus.warnings.map((w, i) => (
                      <p key={i} className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>{w}</span>
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {(section === "DASHBOARD" || isDataTableSection) && (
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                  {section === "TRASH"
                    ? "Thùng rác kho lưu trữ (Xóa mềm & Khôi phục)"
                    : section === "DOCUMENTS"
                    ? "Kho lưu trữ Tài liệu học tập"
                    : section === "POSTS"
                    ? "Kho lưu trữ Bài đăng cộng đồng"
                    : section === "COMMENTS"
                    ? "Kho lưu trữ Bình luận cộng đồng"
                    : section === "UPLOADED_FILES"
                    ? "Kho lưu trữ Tệp tải lên trực tiếp (SQLite BLOB)"
                    : "Danh sách dữ liệu & Lịch sử phiên bản trong kho"}
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hỗ trợ tìm kiếm phân trang không tải toàn bộ BLOB về trình duyệt, kết hợp nhiều bộ
                  lọc, xem trước mã nguồn văn bản an toàn và kiểm tra SHA-256.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.length > 0 &&
                  (statusFilter === "TRASHED" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => void handleRestoreFromTrash(selectedIds)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Khôi phục ({selectedIds.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-700"
                        onClick={() => {
                          setPermDeleteTargets(selectedIds);
                          setPermDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa vĩnh viễn ({selectedIds.length})
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-700"
                      onClick={() => void handleMoveToTrash(selectedIds)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Đưa vào thùng rác ({selectedIds.length})
                    </Button>
                  ))}
                <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                  <Upload className="h-3.5 w-3.5" />
                  Tải tệp lên kho
                </Button>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6 text-xs">
              <div className="sm:col-span-2 relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void loadItems(1);
                  }}
                  placeholder="Tìm theo tên tài liệu, bài đăng, nội dung, bình luận, tên tệp, mã bản ghi..."
                  className="pl-9"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-semibold"
              >
                <option value="ALL">Loại: Tất cả nhóm dữ liệu</option>
                <option value="DOCUMENT">Tài liệu</option>
                <option value="COMMUNITY_POST">Bài đăng cộng đồng</option>
                <option value="COMMUNITY_COMMENT">Bình luận cộng đồng</option>
                <option value="UPLOADED_FILE">Tệp tải lên (BLOB)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-semibold"
              >
                <option value="ACTIVE">Trạng thái: Đang hoạt động</option>
                <option value="QUARANTINED">Khu vực cách ly (.env/key)</option>
                <option value="TRASHED">Trong thùng rác</option>
                <option value="ALL">Tất cả (Trừ thùng rác)</option>
              </select>

              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-semibold"
              >
                <option value="ALL">Định dạng: Tất cả</option>
                <option value="PDF">PDF</option>
                <option value="ZIP">ZIP</option>
                <option value="MD">MD</option>
                <option value="TXT">TXT</option>
                <option value="JSON">JSON</option>
                <option value="HTML">HTML</option>
                <option value="CSS">CSS</option>
                <option value="JS">JS</option>
                <option value="TS">TS</option>
                <option value="TSX">TSX</option>
                <option value="SQL">SQL</option>
                <option value="PRISMA">PRISMA</option>
                <option value="TEXT">TEXT</option>
              </select>

              <div className="flex gap-1.5">
                <Input
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  placeholder="Tác giả / Người tải..."
                />
                <Button size="sm" onClick={() => void loadItems(1)} className="shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                  Lọc
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted-foreground)]">Từ ngày:</span>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted-foreground)]">Đến ngày:</span>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted-foreground)]">Phiên bản số:</span>
                <input
                  type="number"
                  min={1}
                  value={versionFilter}
                  onChange={(e) => setVersionFilter(e.target.value)}
                  placeholder="VD: 1, 2..."
                  className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("ALL");
                  setStatusFilter("ACTIVE");
                  setFormatFilter("ALL");
                  setCreatorFilter("");
                  setVersionFilter("");
                  setDateFromFilter("");
                  setDateToFilter("");
                  void loadItems(1, "ALL", "ACTIVE");
                }}
                className="text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>

            {loadingItems ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                Đang truy vấn danh sách từ cơ sở dữ liệu SQLite...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center space-y-2">
                <Archive className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="text-sm font-bold text-[var(--heading)]">
                  Không có mục dữ liệu nào khớp bộ lọc hiện tại
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Bạn có thể thử từ khóa khác, chuyển bộ lọc hoặc tải tệp mới trực tiếp vào kho.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-extrabold uppercase text-[var(--muted-foreground)]">
                    <tr>
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === items.length && items.length > 0}
                          onChange={(e) =>
                            setSelectedIds(e.target.checked ? items.map((x) => x.id) : [])
                          }
                        />
                      </th>
                      <th className="p-3">Tên mục / Mã bản ghi</th>
                      <th className="p-3">Phân loại &amp; Định dạng</th>
                      <th className="p-3">Tác giả / Người tải</th>
                      <th className="p-3">Kích thước &amp; Checksum</th>
                      <th className="p-3">Phiên bản</th>
                      <th className="p-3">Thời điểm lưu</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {items.map((item) => {
                      const checked = selectedIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[var(--surface-alt)]/60 transition"
                        >
                          <td className="p-3 align-top">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setSelectedIds((prev) =>
                                  e.target.checked
                                    ? [...prev, item.id]
                                    : prev.filter((id) => id !== item.id)
                                )
                              }
                            />
                          </td>
                          <td className="p-3 align-top max-w-xs">
                            <p className="font-bold text-[var(--heading)] line-clamp-1">
                              {item.title || item.id}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] line-clamp-1">
                              {item.preview_text}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                              <span>ID: {item.id}</span>
                              {item.source_id && <span>· Nguồn: {item.source_id}</span>}
                            </div>
                            {Boolean(item.is_quarantined) && (
                              <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                <AlertTriangle className="h-3 w-3" />
                                Cách ly: {item.quarantine_reason}
                              </p>
                            )}
                            {item.external_url && (
                              <p className="mt-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 truncate">
                                Liên kết ngoài: {item.external_url}
                              </p>
                            )}
                          </td>
                          <td className="p-3 align-top">
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                variant={
                                  item.item_type === "UPLOADED_FILE"
                                    ? "gold"
                                    : item.item_type === "DOCUMENT"
                                    ? "green"
                                    : "neutral"
                                }
                              >
                                {item.item_type === "DOCUMENT"
                                  ? "Tài liệu"
                                  : item.item_type === "COMMUNITY_POST"
                                  ? "Bài cộng đồng"
                                  : item.item_type === "COMMUNITY_COMMENT"
                                  ? "Bình luận"
                                  : "Tệp tải lên"}
                              </Badge>
                              <Badge variant="neutral">{item.file_format || "TEXT"}</Badge>
                            </div>
                            <p className="mt-1 font-mono text-[10px] text-[var(--muted-foreground)] truncate max-w-[150px]">
                              {item.storage_path}
                            </p>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-semibold text-[var(--heading)]">
                              {item.author_name || item.creator_name || "Hệ thống"}
                            </p>
                            {item.editor_name && (
                              <p className="text-[10px] text-[var(--muted-foreground)]">
                                Sửa bởi: {item.editor_name}
                              </p>
                            )}
                          </td>
                          <td className="p-3 align-top font-mono text-[11px]">
                            <p className="font-bold">{formatBytes(item.file_size_bytes)}</p>
                            <p
                              className="text-[10px] text-[var(--muted-foreground)]"
                              title={item.checksum_sha256}
                            >
                              SHA256: {item.checksum_sha256.slice(0, 12)}...
                            </p>
                          </td>
                          <td className="p-3 align-top">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-xs font-black text-emerald-950 dark:bg-emerald-950 dark:text-[#9ee56f]">
                              v{item.current_version}
                            </span>
                          </td>
                          <td className="p-3 align-top text-[11px] text-[var(--muted-foreground)]">
                            <p>{formatShortDateTime(item.updated_at)}</p>
                            {item.imported_batch_code && (
                              <p className="font-mono text-[10px] text-emerald-700 dark:text-[#9ee56f]">
                                {item.imported_batch_code}
                              </p>
                            )}
                          </td>
                          <td className="p-3 align-top text-right">
                            <div className="inline-flex flex-wrap justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void openItemDetailAndPreview(item)}
                                title="Xem trước an toàn & Lịch sử phiên bản"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Xem / Phiên bản
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadItem(item.id, item.current_version)}
                                title="Tải xuống bản lưu"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              {item.storage_status === "TRASHED" ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => void handleRestoreFromTrash([item.id])}
                                    title="Khôi phục từ thùng rác"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setPermDeleteTargets([item.id]);
                                      setPermDeleteModalOpen(true);
                                    }}
                                    title="Xóa vĩnh viễn"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void handleMoveToTrash([item.id])}
                                  title="Đưa vào thùng rác"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[var(--muted-foreground)]">
              <span>
                Hiển thị trang <b>{pagination.page}</b> / {pagination.totalPages} (Tổng{" "}
                <b>{pagination.total}</b> bản ghi)
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => void loadItems(pagination.page - 1)}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => void loadItems(pagination.page + 1)}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </Card>
        )}

        {section === "AUDIT_LOGS" && (
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[var(--primary)]" />
                  Nhật ký truy cập và hoạt động (Chống chỉnh sửa / Chuỗi băm SHA-256)
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Ghi nhận đầy đủ 25 nhóm sự kiện bảo mật và dữ liệu. Không ghi PIN, OTP, mật khẩu
                  hay token. Admin không được phép xóa nhật ký hoạt động của chính mình.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Input
                  value={auditActorFilter}
                  onChange={(e) => setAuditActorFilter(e.target.value)}
                  placeholder="Lọc theo người thực hiện..."
                  className="w-48"
                />
                <select
                  value={auditEventFilter}
                  onChange={(e) => setAuditEventFilter(e.target.value)}
                  className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-semibold"
                >
                  <option value="ALL">Tất cả hành động</option>
                  <option value="ADMIN_OPEN_VAULT">Mở kho</option>
                  <option value="ADMIN_CLOSE_VAULT">Đóng kho</option>
                  <option value="PIN_VERIFY_SUCCESS">Nhập PIN thành công</option>
                  <option value="PIN_VERIFY_FAILED">Nhập PIN thất bại</option>
                  <option value="PIN_LOCKED_OUT">Khóa PIN 15 phút</option>
                  <option value="PIN_SETUP">Thiết lập PIN</option>
                  <option value="PIN_CHANGE">Thay đổi PIN</option>
                  <option value="FORGOT_PIN_REQUEST">Quên PIN / Yêu cầu OTP</option>
                  <option value="OTP_VERIFY">Xác minh OTP &amp; Khôi phục PIN</option>
                  <option value="SYSTEM_VAULT_LOCK">Khóa kho toàn hệ thống</option>
                  <option value="SYSTEM_VAULT_UNLOCK">Mở khóa kho</option>
                  <option value="FILE_UPLOAD">Tải tệp lên (BLOB)</option>
                  <option value="FILE_DOWNLOAD">Tải tệp xuống</option>
                  <option value="PREVIEW_CONTENT">Xem trước nội dung</option>
                  <option value="SEARCH_DATA">Tìm kiếm dữ liệu</option>
                  <option value="AUTO_ARCHIVE">Tự động lưu</option>
                  <option value="CREATE_VERSION">Tạo phiên bản</option>
                  <option value="RESTORE_VERSION">Khôi phục phiên bản</option>
                  <option value="MOVE_TO_TRASH">Đưa vào thùng rác</option>
                  <option value="RESTORE_FROM_TRASH">Khôi phục từ thùng rác</option>
                  <option value="PERMANENT_DELETE">Xóa vĩnh viễn</option>
                  <option value="INITIAL_DATA_IMPORT">Nhập dữ liệu cũ</option>
                  <option value="CREATE_BACKUP">Sao lưu</option>
                  <option value="RESTORE_BACKUP">Khôi phục bản sao lưu</option>
                  <option value="PERMISSION_CHANGE">Thay đổi phân quyền</option>
                  <option value="ACCOUNT_DELETION_CLEANUP">Xử lý xóa tài khoản</option>
                </select>
                <Button size="sm" onClick={() => void loadAuditLogs(1)}>
                  Truy vấn
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-extrabold uppercase text-[var(--muted-foreground)]">
                  <tr>
                    <th className="p-3">Thời điểm</th>
                    <th className="p-3">Sự kiện</th>
                    <th className="p-3">Tài khoản &amp; Vai trò</th>
                    <th className="p-3">Hành động &amp; Mục liên quan</th>
                    <th className="p-3">IP &amp; Thiết bị</th>
                    <th className="p-3">Trạng thái &amp; Mã toàn vẹn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--surface-alt)]/50">
                      <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                        {formatShortDateTime(log.created_at)}
                      </td>
                      <td className="p-3">
                        <Badge variant="neutral">{log.event_code}</Badge>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-[var(--heading)]">
                          {log.actor_name || "Hệ thống"}
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {log.actor_email || log.actor_id} · {log.actor_role}
                        </p>
                      </td>
                      <td className="p-3 max-w-md">
                        <p className="font-semibold text-[var(--heading)]">{log.action_label}</p>
                        {log.target_label && (
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            Mục: {log.target_label} ({log.target_type})
                          </p>
                        )}
                        {log.error_reason && (
                          <p className="text-[11px] font-semibold text-rose-600">
                            Lý do lỗi: {log.error_reason}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-[var(--muted-foreground)]">
                        <p className="font-mono">{log.ip_address}</p>
                        <p className="truncate max-w-[140px]" title={log.user_agent || ""}>
                          {log.user_agent}
                        </p>
                      </td>
                      <td className="p-3">
                        <Badge variant={log.status === "SUCCESS" ? "green" : "gold"}>
                          {log.status}
                        </Badge>
                        <p
                          className="mt-1 font-mono text-[10px] text-[var(--muted-foreground)]"
                          title={log.integrity_hash}
                        >
                          Chain: {log.integrity_hash.slice(0, 12)}...
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>
                Trang {auditPage} / {auditTotalPages}
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={auditPage <= 1}
                  onClick={() => void loadAuditLogs(auditPage - 1)}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => void loadAuditLogs(auditPage + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </Card>
        )}

        {section === "SYNC_STATUS" && (
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                    Nhập dữ liệu cũ theo lô (Checkpoint) &amp; Hàng đợi tự động lưu
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Chỉ nhập dữ liệu thực tế tồn tại trong cơ sở dữ liệu hiện tại, đối chiếu theo
                    (Loại dữ liệu + ID nguồn) chống trùng lặp, có checkpoint tiếp tục sau gián đoạn.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminRequest("/api/admin/storage/import", {
                        method: "POST",
                        body: JSON.stringify({ action: "RETRY_ARCHIVE_EVENTS" }),
                      });
                      notify("Đã thử lại các sự kiện tự động lưu đang chờ!", "success");
                      await loadImportStatus();
                      await loadOverview();
                    }}
                  >
                    Thử lại sự kiện chờ
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await adminRequest("/api/admin/storage/import", {
                        method: "POST",
                        body: JSON.stringify({ action: "RUN_IMPORT" }),
                      });
                      notify(
                        "Đã chạy đối chiếu & đồng bộ phần dữ liệu còn thiếu (chống trùng lặp)!",
                        "success"
                      );
                      await loadImportStatus();
                      await loadOverview();
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Đồng bộ / Kiểm tra dữ liệu nguồn
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-[var(--muted-foreground)]">
                  Lịch sử các lô nhập dữ liệu cũ (Import Jobs &amp; Checkpoints)
                </h3>
                {importData?.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 text-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[var(--heading)]">
                          {job.batch_code}
                        </span>
                        <Badge variant={job.status === "COMPLETED" ? "green" : "gold"}>
                          {job.status}
                        </Badge>
                        <span className="text-[var(--muted-foreground)]">
                          Kích hoạt bởi: {job.triggered_by_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {formatShortDateTime(job.started_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-xl bg-[var(--surface)] p-2.5 border border-[var(--border)]">
                        <span className="text-[var(--muted-foreground)]">Tổng phát hiện:</span>
                        <p className="font-mono text-base font-black">{job.total_discovered}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--surface)] p-2.5 border border-[var(--border)]">
                        <span className="text-[var(--muted-foreground)]">Nhập mới thành công:</span>
                        <p className="font-mono text-base font-black text-emerald-700">
                          {job.success_count}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[var(--surface)] p-2.5 border border-[var(--border)]">
                        <span className="text-[var(--muted-foreground)]">Bỏ qua trùng lặp:</span>
                        <p className="font-mono text-base font-black text-sky-700">
                          {job.skipped_duplicate_count}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[var(--surface)] p-2.5 border border-[var(--border)]">
                        <span className="text-[var(--muted-foreground)]">Bản ghi lỗi:</span>
                        <p className="font-mono text-base font-black text-rose-600">
                          {job.failed_count}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {job.checkpoints.map((chk) => (
                        <span
                          key={chk.entity_type}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px]"
                        >
                          Checkpoint {chk.entity_type}: {chk.processed_count} mục (Cuối:{" "}
                          {chk.last_source_id || "—"}) · {chk.status}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {section === "SECURITY_SETTINGS" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 space-y-4">
              <h2 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[var(--primary)]" />
                Đổi mã PIN 6 chữ số (Argon2id + Salt riêng)
              </h2>
              <form onSubmit={handleChangePin} className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-bold">Mã PIN hiện tại (6 chữ số)</label>
                  <Input
                    required
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    value={changeCurPin}
                    onChange={(e) => setChangeCurPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="font-mono tracking-[0.3em]"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold">Mã PIN mới (6 chữ số 0–9)</label>
                    <Input
                      required
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      value={changeNewPin}
                      onChange={(e) =>
                        setChangeNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="••••••"
                      className="font-mono tracking-[0.3em]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold">Xác nhận mã PIN mới</label>
                    <Input
                      required
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      value={changeConfirmPin}
                      onChange={(e) =>
                        setChangeConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="••••••"
                      className="font-mono tracking-[0.3em]"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm">
                  Lưu PIN mới &amp; Thu hồi phiên cũ
                </Button>
              </form>

              <div className="border-t border-[var(--border)] pt-4 space-y-3 text-xs">
                <h3 className="font-heading text-sm font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  Khóa kho lưu trữ toàn hệ thống
                </h3>
                <p className="text-[var(--muted-foreground)]">
                  Khi khóa toàn hệ thống: Chặn mở phiên mới, thu hồi tất cả phiên kho đang hoạt động,
                  chặn đọc/tải lên/tải xuống/khôi phục nhưng giữ nguyên toàn bộ dữ liệu hiện có.
                </p>
                <Input
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  placeholder="Nhập lý do khóa kho toàn hệ thống..."
                />
                <Button
                  type="button"
                  size="sm"
                  className="bg-rose-700 text-white hover:bg-rose-800"
                  onClick={() => void handleToggleSystemLock(true)}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Khóa kho toàn hệ thống ngay
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-5 space-y-4">
                <h2 className="font-heading text-base font-extrabold text-[var(--heading)] flex items-center gap-2">
                  <Database className="h-4 w-4 text-[var(--primary)]" />
                  Sao lưu &amp; Khôi phục nhất quán SQLite BLOB
                </h2>
                <div className="flex gap-2 text-xs">
                  <Input
                    value={backupLabelInput}
                    onChange={(e) => setBackupLabelInput(e.target.value)}
                    placeholder="Ghi chú bản sao lưu (VD: Trước khi nâng cấp...)"
                  />
                  <Button size="sm" onClick={() => void handleCreateBackup()} className="shrink-0">
                    Tạo bản sao lưu
                  </Button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {overview?.backups.map((bk) => (
                    <div
                      key={bk.backupId}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-mono font-bold text-[var(--heading)]">{bk.fileName}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {bk.label} · {formatBytes(bk.sizeBytes)} ·{" "}
                          {formatShortDateTime(bk.createdAt)}
                        </p>
                        <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
                          SHA256: {bk.checksumSha256.slice(0, 20)}...
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRestoreBackup(bk.backupId)}
                      >
                        Khôi phục DB
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h2 className="font-heading text-base font-extrabold text-[var(--heading)]">
                  Quản lý quyền truy cập kho của các tài khoản Admin
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Cấp/thu hồi quyền sử dụng kho, yêu cầu đặt lại PIN hoặc khóa tài khoản kho (Không
                  hiển thị lại PIN cũ).
                </p>
                <div className="space-y-2 text-xs">
                  {access.adminAccounts.map((acc) => (
                    <div
                      key={acc.account_id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-[var(--heading)]">
                          {acc.name} ({acc.email})
                        </p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          PIN: {acc.hasPinSetup ? "Đã thiết lập" : "Chưa thiết lập"} · Cập nhật:{" "}
                          {formatShortDateTime(acc.pin_updated_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await adminRequest("/api/admin/storage/access", {
                              method: "POST",
                              body: JSON.stringify({
                                action: "ADMIN_PERMISSION",
                                targetAccountId: acc.account_id,
                                targetEmail: acc.email,
                                targetName: acc.name,
                                permissionAction: "REQUIRE_PIN_RESET",
                              }),
                            });
                            notify(`Đã yêu cầu ${acc.email} thiết lập lại mã PIN.`, "info");
                            await loadAccessStatus();
                          }}
                        >
                          Yêu cầu đặt lại PIN
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const nextAct = acc.is_locked ? "UNLOCK_ACCOUNT" : "LOCK_ACCOUNT";
                            await adminRequest("/api/admin/storage/access", {
                              method: "POST",
                              body: JSON.stringify({
                                action: "ADMIN_PERMISSION",
                                targetAccountId: acc.account_id,
                                targetEmail: acc.email,
                                targetName: acc.name,
                                permissionAction: nextAct,
                              }),
                            });
                            notify("Đã cập nhật trạng thái tài khoản kho.", "success");
                            await loadAccessStatus();
                          }}
                        >
                          {acc.is_locked ? "Mở khóa TK kho" : "Khóa TK kho"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {section === "VOCATIONAL_TAXONOMY" && (
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h2 className="font-heading text-lg font-extrabold text-[var(--heading)] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[var(--primary)]" />
                Định vị 5 Nhóm đối tượng người học &amp; 7 Loại hình cơ sở đào tạo (Phần II)
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                WORD BRIDGE hướng đến người học rèn luyện tiếng Anh gắn với chuyên ngành đang theo
                học, nghề nghiệp đang đào tạo hoặc công việc chuyên môn. Phân loại hồ sơ học tập độc
                lập, không biến hệ thống thành phần mềm quản lý trường học hay tự cấp chứng chỉ.
              </p>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-xs">
                {LEARNER_TARGET_GROUPS.map((g) => (
                  <div
                    key={g.code}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="green">{g.code}</Badge>
                      <span className="text-[11px] font-bold text-[var(--primary)]">
                        {g.institutionType}
                      </span>
                    </div>
                    <h3 className="font-heading text-sm font-extrabold text-[var(--heading)]">
                      {g.name}
                    </h3>
                    <p className="text-[11px] text-[var(--muted-foreground)]">{g.description}</p>
                    <ul className="space-y-1 pt-1 text-[11px] list-disc pl-4">
                      {g.needs.slice(0, 4).map((n, idx) => (
                        <li key={idx}>{n}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {TRAINING_INSTITUTION_TYPES.map((inst) => (
                  <span
                    key={inst.code}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-bold"
                  >
                    {inst.order}. {inst.name}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-[var(--heading)]">
                    Danh mục Lĩnh vực &amp; Chuyên ngành mở rộng được ({taxonomyFields.length} lĩnh vực)
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Cấu trúc: Lĩnh vực &rarr; Nhóm ngành &rarr; Ngành &rarr; Chuyên ngành &rarr; Tình
                    huống nghề nghiệp &rarr; Bài học &rarr; Bài thực hành. Admin có thể thêm/mở rộng
                    ngay tại đây mà không cần sửa code.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 text-xs">
                <form
                  onSubmit={handleAddVocationalField}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-2.5"
                >
                  <p className="font-bold text-[var(--heading)]">
                    + Thêm Lĩnh vực đào tạo mới (Mở rộng động)
                  </p>
                  <div className="flex gap-2">
                    <Input
                      required
                      value={newFieldCode}
                      onChange={(e) => setNewFieldCode(e.target.value.toUpperCase())}
                      placeholder="Mã (VD: Q)"
                      className="w-24 font-mono"
                    />
                    <Input
                      required
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Tên lĩnh vực mới..."
                      className="flex-1"
                    />
                    <Button type="submit" size="sm">
                      <Plus className="h-4 w-4" />
                      Thêm
                    </Button>
                  </div>
                </form>

                <form
                  onSubmit={handleAddVocationalSpecialty}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 space-y-2.5"
                >
                  <p className="font-bold text-[var(--heading)]">
                    + Thêm Chuyên ngành nghề nghiệp vào Lĩnh vực
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={newSpecFieldId}
                      onChange={(e) => setNewSpecFieldId(e.target.value)}
                      className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 font-semibold"
                    >
                      {taxonomyFields.map((f) => (
                        <option key={f.id} value={f.code}>
                          {f.code}. {f.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      required
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                      placeholder="Tên chuyên ngành mới..."
                      className="flex-1"
                    />
                    <Button type="submit" size="sm">
                      <Plus className="h-4 w-4" />
                      Thêm
                    </Button>
                  </div>
                </form>
              </div>

              <div className="grid gap-3.5 md:grid-cols-2">
                {taxonomyFields.map((field) => (
                  <div
                    key={field.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm font-extrabold text-[var(--heading)]">
                        Lĩnh vực {field.code}. {field.name}
                      </span>
                      <Badge variant="neutral">{field.specialties?.length || 0} chuyên ngành</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {field.specialties?.map((sp) => (
                        <span
                          key={sp.id}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold"
                        >
                          {sp.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal
        open={uploadModalOpen}
        onClose={() => {
          if (!uploading) setUploadModalOpen(false);
        }}
        title="Tải tệp trực tiếp vào Kho lưu trữ SQLite BLOB (Tối đa 15 MB/tệp)"
      >
        <form onSubmit={handleStartUpload} className="space-y-4 text-xs">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 space-y-1">
            <p className="font-bold text-[var(--heading)]">
              Định dạng hỗ trợ: ZIP, PDF, TXT, MD, JSON, HTML, CSS, JS, TS, JSX, TSX, SQL, Prisma
              schema và tệp cấu hình kỹ thuật.
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Hệ thống không thực thi tệp tải lên. Tệp chứa khóa bí mật (.env, private key, token)
              sẽ được tự động cảnh báo và đưa vào khu vực cách ly. Tải lại tệp trùng tên/vị trí sẽ
              tạo phiên bản mới, không ghi đè bản cũ.
            </p>
          </div>

          <div>
            <label className="mb-1 block font-bold">Chọn một hoặc nhiều tệp (≤ 15 MB/tệp)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs"
            />
            {uploadFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-[var(--surface-alt)] px-2.5 py-1 font-mono text-[11px]"
                  >
                    <span className="truncate max-w-xs">{f.name}</span>
                    <span
                      className={cn(
                        "font-bold",
                        f.size > 15 * 1024 * 1024 ? "text-rose-600" : "text-emerald-700"
                      )}
                    >
                      {formatBytes(f.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold">Vị trí logic trong kho (tùy chọn)</label>
              <Input
                value={uploadLogicalPath}
                onChange={(e) => setUploadLogicalPath(e.target.value)}
                placeholder="VD: /vault/files/schema.prisma"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold">Ghi chú phiên bản</label>
              <Input
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Mô tả thay đổi hoặc mục đích lưu..."
              />
            </div>
          </div>

          {uploading && (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>{uploadStatusMsg}</span>
                <span>{uploadProgressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200">
                <div
                  className="h-full bg-[#19462b] transition-all"
                  style={{ width: `${uploadProgressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {uploading ? (
              <Button type="button" variant="outline" onClick={handleCancelActiveUpload}>
                <XCircle className="h-4 w-4 text-rose-600" />
                Hủy tác vụ đang tải
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                Đóng
              </Button>
            )}
            <Button type="submit" loading={uploading}>
              <Upload className="h-4 w-4" />
              Lưu BLOB &amp; Xác minh Checksum
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Chi tiết lưu trữ & Lịch sử phiên bản: ${selectedItem?.title || selectedItem?.id || ""}`}
      >
        {loadingDetail || !selectedItem ? (
          <div className="py-10 text-center text-xs text-[var(--muted-foreground)]">
            Đang tải nội dung xem trước an toàn và lịch sử phiên bản...
          </div>
        ) : (
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
              <div>
                <span className="text-[var(--muted-foreground)]">Loại dữ liệu:</span>
                <p className="font-bold">{selectedItem.item_type}</p>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Định dạng:</span>
                <p className="font-bold">{selectedItem.file_format}</p>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Phiên bản hiện tại:</span>
                <p className="font-mono font-black text-emerald-700">
                  v{selectedItem.current_version}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Kích thước:</span>
                <p className="font-mono font-bold">{formatBytes(selectedItem.file_size_bytes)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 font-mono text-[11px]">
              <p>
                <b>Checksum SHA-256:</b> {previewData?.checksumSha256 || selectedItem.checksum_sha256}
              </p>
              <p>
                <b>Vị trí trong kho:</b> {selectedItem.storage_path}
              </p>
              {selectedItem.external_url && (
                <div className="mt-2 rounded-lg border border-sky-300 bg-sky-50 p-2 text-sky-950 font-sans">
                  <p className="font-bold">Đường dẫn nguồn bên ngoài (externalUrl):</p>
                  <p className="font-mono break-all">{selectedItem.external_url}</p>
                  <p className="mt-1 text-[11px]">{selectedItem.external_source_note}</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--heading)] flex items-center gap-1.5">
                  <FileCode2 className="h-4 w-4 text-[var(--primary)]" />
                  Khung xem trước an toàn (Phiên bản #{previewData?.versionNumber})
                </span>
                <Badge variant="neutral">Không thực thi mã (No-Exec)</Badge>
              </div>
              {previewData?.canPreviewText ? (
                <pre className="max-h-64 overflow-auto rounded-xl border border-[#1b2d1c] bg-[#0f1912] p-3.5 font-mono text-[11px] leading-relaxed text-emerald-100 whitespace-pre-wrap">
                  {previewData.safeSourceText || "(Nội dung trống)"}
                </pre>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center space-y-2">
                  <p className="font-bold">
                    Định dạng nhị phân ({selectedItem.file_format}) không hiển thị trực tiếp văn bản.
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleDownloadItem(selectedItem.id, previewData?.versionNumber)
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    Tải xuống tệp BLOB để xem
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              <h3 className="font-heading text-sm font-extrabold text-[var(--heading)]">
                Lịch sử phiên bản ({selectedVersions.length} phiên bản – Không ghi đè bản cũ)
              </h3>
              <div className="space-y-2">
                {selectedVersions.map((ver) => (
                  <div
                    key={ver.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#19462b] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                          Phiên bản #{ver.version_number}
                        </span>
                        <span className="font-bold text-[var(--heading)]">
                          {ver.change_summary || "Bản lưu"}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          {formatShortDateTime(ver.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        Thực hiện bởi: <b>{ver.actor_name || "Hệ thống"}</b> ·{" "}
                        {formatBytes(ver.file_size_bytes)} · SHA256:{" "}
                        <span className="font-mono">{ver.checksum_sha256.slice(0, 14)}...</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void openItemDetailAndPreview(selectedItem, ver.version_number)
                        }
                      >
                        Xem bản này
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadItem(selectedItem.id, ver.version_number)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Tải về
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          void handleRestoreVersion(selectedItem.id, ver.version_number, false)
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Khôi phục trong kho
                      </Button>
                      {(selectedItem.item_type === "DOCUMENT" ||
                        selectedItem.item_type === "COMMUNITY_POST") &&
                        selectedItem.source_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void handleRestoreVersion(selectedItem.id, ver.version_number, true)
                            }
                          >
                            Đồng bộ về Website gốc
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={permDeleteModalOpen}
        onClose={() => setPermDeleteModalOpen(false)}
        title="Xác nhận xóa vĩnh viễn dữ liệu khỏi Kho lưu trữ (Nhiều bước)"
      >
        <form onSubmit={handleConfirmPermanentDelete} className="space-y-4 text-xs">
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-rose-950 space-y-1">
            <p className="font-extrabold text-sm">
              Cảnh báo: Thao tác này sẽ xóa vĩnh viễn {permDeleteTargets.length} mục đã chọn khỏi
              SQLite BLOB và không thể khôi phục!
            </p>
            <p>
              Danh sách mã mục bị xóa: <span className="font-mono">{permDeleteTargets.join(", ")}</span>
            </p>
          </div>
          <div>
            <label className="mb-1 block font-bold">
              Nhập chính xác cụm từ <code className="text-rose-600">XOA VINH VIEN</code> để xác nhận:
            </label>
            <Input
              required
              value={permDeletePhrase}
              onChange={(e) => setPermDeletePhrase(e.target.value)}
              placeholder="XOA VINH VIEN"
              className="font-mono font-bold uppercase"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPermDeleteModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={permDeletePhrase.trim().toUpperCase() !== "XOA VINH VIEN"}
              className="bg-rose-700 text-white hover:bg-rose-800"
            >
              <Trash2 className="h-4 w-4" />
              Xác nhận xóa vĩnh viễn
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
