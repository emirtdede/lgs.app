"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateReschedule, type RescheduleTaskInput } from "@/domain/plan-reschedule";
import { mapDatabaseError, type ActionResponse } from "./error-map";

/**
 * Reschedule an unfinished task to a target date.
 * Allowed ONLY for adult members with owner or admin roles.
 */
export async function rescheduleTaskAction(
  taskId: string,
  targetPlanDate: string,
  reason: string
): Promise<
  ActionResponse<{
    resultStatus: string;
    originalDate: string;
    previousDate: string;
    currentDate: string;
    warning?: string;
  }>
> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Check user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.is_anonymous) {
      return {
        success: false,
        errorCode: "UNAUTHORIZED",
        errorMessage: "Bu işlem için veli (yönetici) hesabı ile oturum açılmalıdır.",
      };
    }

    // 2. Fetch task current info to validate reschedule domain invariants
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("id, plan_day_id, current_plan_day_id, plan_days!tasks_plan_day_id_fkey(plan_date)")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError || !taskData) {
      return {
        success: false,
        errorCode: "TASK_NOT_FOUND",
        errorMessage: "Görev bulunamadı.",
      };
    }

    // Fetch current day plan date
    const { data: currentDay } = await supabase
      .from("plan_days")
      .select("plan_date")
      .eq("id", taskData.current_plan_day_id)
      .maybeSingle();

    const originalDate = (taskData.plan_days as any)?.plan_date ?? "";
    const currentPlanDate = currentDay?.plan_date ?? "";

    // 3. Check active timer
    const { count: activeTimerCount } = await supabase
      .from("timer_sessions")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .eq("status", "active");

    const input: RescheduleTaskInput = {
      taskId,
      originalPlanDate: originalDate,
      currentPlanDate,
      targetPlanDate,
      taskStatus: "pending",
      hasActiveTimer: (activeTimerCount ?? 0) > 0,
      reason,
    };

    const validation = validateReschedule(input);
    if (!validation.allowed) {
      return {
        success: false,
        errorCode: validation.errorCode ?? "VALIDATION_FAILED",
        errorMessage: validation.errorMessage ?? "Görev ertelenemedi.",
      };
    }

    // 4. Call audited reschedule_task RPC
    const { data, error } = await supabase.rpc("reschedule_task", {
      p_task_id: taskId,
      p_new_date: targetPlanDate,
      p_reason: reason.trim(),
    });

    if (error) {
      const mapped = mapDatabaseError(error);
      return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
    }

    const res = data?.[0];
    if (!res) {
      return {
        success: false,
        errorCode: "RESCHEDULE_FAILED",
        errorMessage: "Erteleme işlemi tamamlanamadı.",
      };
    }

    updateTag("plan-data");
    revalidatePath("/today");
    revalidatePath("/plan");
    revalidatePath("/takvim");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        resultStatus: res.result_status,
        originalDate: res.original_date,
        previousDate: res.previous_date,
        currentDate: res.current_date,
        warning: validation.destinationWarning,
      },
    };
  } catch (err: any) {
    const mapped = mapDatabaseError(err);
    return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
  }
}

/**
 * Cancel an unfinished plan task.
 * Allowed ONLY for adult members with owner or admin roles.
 */
export async function cancelPlanTaskAction(
  taskId: string,
  reason: string
): Promise<ActionResponse<{ resultStatus: string; planDate: string }>> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.is_anonymous) {
      return {
        success: false,
        errorCode: "UNAUTHORIZED",
        errorMessage: "Bu işlem için veli (yönetici) hesabı ile oturum açılmalıdır.",
      };
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return {
        success: false,
        errorCode: "REASON_REQUIRED",
        errorMessage: "İptal gerekçesi belirtilmelidir.",
      };
    }

    const { data, error } = await supabase.rpc("cancel_plan_task", {
      p_task_id: taskId,
      p_reason: trimmedReason,
    });

    if (error) {
      const mapped = mapDatabaseError(error);
      return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
    }

    const res = data?.[0];
    if (!res) {
      return {
        success: false,
        errorCode: "CANCEL_FAILED",
        errorMessage: "İptal işlemi tamamlanamadı.",
      };
    }

    updateTag("plan-data");
    revalidatePath("/today");
    revalidatePath("/plan");
    revalidatePath("/takvim");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        resultStatus: res.result_status,
        planDate: res.plan_date,
      },
    };
  } catch (err: any) {
    const mapped = mapDatabaseError(err);
    return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
  }
}
