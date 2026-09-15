"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapDatabaseError, type ActionResponse } from "./error-map";

/**
 * Generate a single-use, 10-minute student device pairing code.
 * Allowed for owner or admin.
 */
export async function createStudentPairingCodeAction(
  studentId: string
): Promise<ActionResponse<{ code: string; expiresAt: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("create_student_pairing_code", {
      p_student_id: studentId,
    });

    if (error) {
      const mapped = mapDatabaseError(error);
      return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
    }

    const res = data?.[0];
    if (!res) {
      return {
        success: false,
        errorCode: "PAIR_CODE_GENERATION_FAILED",
        errorMessage: "Eşleştirme kodu üretilemedi.",
      };
    }

    return {
      success: true,
      data: {
        code: res.code,
        expiresAt: res.expires_at,
      },
    };
  } catch (err: any) {
    const mapped = mapDatabaseError(err);
    return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
  }
}

/**
 * Revoke a paired student device.
 * Immediately terminates student device access via RLS.
 */
export async function revokeStudentDeviceAction(deviceId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("revoke_student_device", {
      p_device_id: deviceId,
    });

    if (error) {
      const mapped = mapDatabaseError(error);
      return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
    }

    revalidatePath("/ayarlar");
    return { success: true };
  } catch (err: any) {
    const mapped = mapDatabaseError(err);
    return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
  }
}

/**
 * Transfer family ownership to another adult member.
 * Allowed ONLY for current owner.
 */
export async function transferOwnershipAction(
  familyId: string,
  newOwnerAuthUserId: string
): Promise<ActionResponse<{ resultStatus: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("transfer_family_ownership", {
      p_family_id: familyId,
      p_new_owner_auth_user_id: newOwnerAuthUserId,
    });

    if (error) {
      const mapped = mapDatabaseError(error);
      return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
    }

    const res = data?.[0];
    revalidatePath("/ayarlar");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        resultStatus: res?.result_status ?? "transferred",
      },
    };
  } catch (err: any) {
    const mapped = mapDatabaseError(err);
    return { success: false, errorCode: mapped.code, errorMessage: mapped.message };
  }
}
