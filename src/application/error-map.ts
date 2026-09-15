/**
 * Error mapping helper for database and RPC exceptions.
 * Kept outside of "use server" action files to satisfy Next.js compiler rules.
 */

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Maps database/RPC error messages to stable user-friendly Turkish messages.
 */
export function mapDatabaseError(error: any): { code: string; message: string } {
  const raw = error?.message ?? String(error);

  if (raw.includes("active student device required") || raw.includes("auth")) {
    return { code: "AUTH_REQUIRED", message: "Öğrenci cihazı eşleştirmesi gereklidir." };
  }
  if (raw.includes("no new required benchmark may start after 21:50") || raw.includes("21:50")) {
    return {
      code: "CUTOFF_EXCEEDED",
      message: "Saat 21:50 sonrasında yeni zorunlu çalışma başlatılamaz.",
    };
  }
  if (raw.includes("an active timer already exists")) {
    return { code: "ACTIVE_TIMER_EXISTS", message: "Zaten devam eden bir zamanlayıcınız var." };
  }
  if (raw.includes("benchmark result must total exactly 20")) {
    return {
      code: "BENCHMARK_MUST_TOTAL_20",
      message: "Benchmark sonucu tam olarak 20 soru olmalıdır.",
    };
  }
  if (raw.includes("reading is locked until all required study tasks")) {
    return {
      code: "READING_LOCKED",
      message: "Kitap okuma, günün zorunlu çalışmaları tamamlanınca açılır.",
    };
  }
  if (raw.includes("rate limit")) {
    return {
      code: "PAIR_RATE_LIMITED",
      message: "Çok fazla deneme yapıldı. Lütfen biraz bekleyin.",
    };
  }
  if (raw.includes("invalid") || raw.includes("expired")) {
    return {
      code: "PAIR_CODE_INVALID_OR_EXPIRED",
      message: "Eşleştirme kodu geçersiz veya süresi dolmuş.",
    };
  }
  if (raw.includes("device limit")) {
    return {
      code: "PAIR_DEVICE_LIMIT_REACHED",
      message: "Öğrenci için aktif cihaz limitine ulaşıldı.",
    };
  }
  if (raw.includes("completed task cannot be rescheduled")) {
    return {
      code: "TASK_ALREADY_COMPLETED",
      message: "Tamamlanmış bir görev ertelenemez.",
    };
  }
  if (raw.includes("cancelled task cannot be rescheduled")) {
    return {
      code: "TASK_CANCELLED",
      message: "İptal edilmiş bir görev ertelenemez.",
    };
  }
  if (raw.includes("permanent adult auth required")) {
    return {
      code: "ADULT_AUTH_REQUIRED",
      message: "Bu işlem için veli (yönetici) hesabı ile oturum açılmalıdır.",
    };
  }

  return { code: "INTERNAL_ERROR", message: "İşlem sırasında beklenmedik bir hata oluştu." };
}
