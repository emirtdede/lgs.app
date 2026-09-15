export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FamilyRole = "owner" | "admin" | "viewer";
export type DeviceStatus = "active" | "revoked";
export type PlanStatus = "draft" | "active" | "archived";
export type TaskStatus =
  "pending" | "in_progress" | "completed" | "overdue" | "rescheduled" | "cancelled";
export type SessionStatus = "active" | "completed" | "cancelled" | "flagged";
export type RoutineType = "math" | "paragraph";
export type QuestionBlockKind = "benchmark_20" | "extra" | "topic" | "mixed" | "meb" | "mock";
export type TaskType =
  | "topic_video"
  | "topic_review"
  | "topic_questions"
  | "mixed_questions"
  | "meb_questions"
  | "daily_math_benchmark"
  | "daily_math_extra"
  | "daily_paragraph_benchmark"
  | "daily_paragraph_extra"
  | "paragraph_routine"
  | "spaced_review"
  | "extra_science_video"
  | "extra_science_questions"
  | "source_catchup"
  | "full_mock_verbal"
  | "mock_break"
  | "full_mock_numerical"
  | "mock_remediation"
  | "exam_prep"
  | "mistake_review"
  | "weekly_review"
  | "progress_review"
  | "branch_mock"
  | "full_mock"
  | "mock_analysis"
  | "reading"
  | "break"
  | "meal"
  | "sleep_prep";
export type ResourceType = "youtube_playlist" | "youtube_video" | "book" | "meb" | "other";
export type MistakeReason =
  "knowledge_gap" | "calculation_error" | "misread" | "attention" | "strategy" | "unknown";
export type ReviewStatus = "open" | "reviewed" | "resolved";
export type PlanMutationType = "import" | "reschedule" | "cancel" | "restore" | "override";
export type ImportStatus = "dry_run" | "committed" | "failed";

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type AddTableDefaults<T> = {
  [K in keyof T]: {
    Row: T[K] extends { Row: infer R } ? R : Record<string, any>;
    Insert: T[K] extends { Insert: infer I } ? I : Record<string, any>;
    Update: T[K] extends { Update: infer U } ? U : Record<string, any>;
    Relationships: GenericRelationship[];
  };
} & Record<string, GenericTable>;

export type Database = {
  public: {
    Tables: AddTableDefaults<{
      [key: string]: any;
      families: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          timezone?: string;
          created_at?: string;
        };
      };
      family_members: {
        Row: {
          family_id: string;
          auth_user_id: string;
          role: FamilyRole;
          created_at: string;
        };
        Insert: {
          family_id: string;
          auth_user_id: string;
          role: FamilyRole;
          created_at?: string;
        };
        Update: {
          family_id?: string;
          auth_user_id?: string;
          role?: FamilyRole;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          family_id: string;
          display_name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          display_name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          display_name?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      student_devices: {
        Row: {
          id: string;
          student_id: string;
          auth_user_id: string;
          label: string;
          status: DeviceStatus;
          paired_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          auth_user_id: string;
          label?: string;
          status?: DeviceStatus;
          paired_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          auth_user_id?: string;
          label?: string;
          status?: DeviceStatus;
          paired_at?: string;
          revoked_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          plan_day_id: string;
          current_plan_day_id: string;
          external_task_id: string;
          task_group_key: string;
          subject_id: number | null;
          topic_id: string | null;
          task_type: TaskType;
          title: string;
          planned_start: string | null;
          planned_end: string | null;
          planned_question_count: number | null;
          required: boolean;
          counts_toward_topic_completion: boolean;
          sort_order: number;
          resource_id: string | null;
          resource_item_id: string | null;
          is_timed: boolean;
          timed_question_target: number | null;
          general_playlist_url: string | null;
          resource_label: string | null;
          source_sheet: string;
          source_row: number;
          source_row_hash: string;
          metadata: Json;
          created_at: string;
        };
      };
      task_completions: {
        Row: {
          id: string;
          task_id: string;
          student_id: string;
          status: TaskStatus;
          completed_at: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
      };
      timer_sessions: {
        Row: {
          id: string;
          student_id: string;
          task_id: string | null;
          status: SessionStatus;
          started_at: string;
          finished_at: string | null;
          duration_seconds: number | null;
          created_at: string;
        };
      };
      question_sessions: {
        Row: {
          id: string;
          student_id: string;
          task_id: string | null;
          timer_session_id: string | null;
          plan_date: string;
          routine: RoutineType | null;
          block_kind: QuestionBlockKind;
          question_count: number;
          correct_count: number;
          wrong_count: number;
          blank_count: number;
          duration_seconds: number | null;
          created_at: string;
        };
      };
      mistakes: {
        Row: {
          id: string;
          student_id: string;
          question_session_id: string | null;
          subject_id: number | null;
          topic_id: string | null;
          reason: MistakeReason;
          note: string | null;
          topic_name: string | null;
          correct_solution: string | null;
          image_data: string | null;
          status: ReviewStatus;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          question_session_id?: string | null;
          subject_id?: number | null;
          topic_id?: string | null;
          reason: MistakeReason;
          note?: string | null;
          topic_name?: string | null;
          correct_solution?: string | null;
          image_data?: string | null;
          status?: ReviewStatus;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          question_session_id?: string | null;
          subject_id?: number | null;
          topic_id?: string | null;
          reason?: MistakeReason;
          note?: string | null;
          topic_name?: string | null;
          correct_solution?: string | null;
          image_data?: string | null;
          status?: ReviewStatus;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
      student_notes: {
        Row: {
          id: string;
          student_id: string;
          category: string;
          title: string;
          content: string;
          target_date: string | null;
          is_resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          category?: string;
          title: string;
          content: string;
          target_date?: string | null;
          is_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          category?: string;
          title?: string;
          content?: string;
          target_date?: string | null;
          is_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_sessions: {
        Row: {
          id: string;
          student_id: string;
          plan_date: string;
          title: string | null;
          started_at: string;
          finished_at: string | null;
          duration_seconds: number | null;
          pages_read: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          plan_date: string;
          title?: string | null;
          started_at?: string;
          finished_at?: string | null;
          duration_seconds?: number | null;
          pages_read?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          plan_date?: string;
          title?: string | null;
          started_at?: string;
          finished_at?: string | null;
          duration_seconds?: number | null;
          pages_read?: number | null;
          created_at?: string;
        };
      };
      resources: {
        Row: {
          id: string;
          family_id: string;
          subject_id: number | null;
          resource_type: ResourceType;
          label: string;
          url: string | null;
          fixed_by_owner: boolean;
          metadata: Json;
          created_at: string;
        };
      };
      resource_items: {
        Row: {
          id: string;
          resource_id: string;
          external_key: string;
          label: string;
          url: string;
          position: number;
          duration_seconds: number | null;
          metadata: Json;
          created_at: string;
        };
      };
      study_plans: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          starts_on: string;
          planning_anchor_end: string | null;
          status: PlanStatus;
          source_workbook_sha256: string | null;
          source_resource_inventory_sha256: string | null;
          source_calendar_overrides_sha256: string | null;
          created_at: string;
        };
      };
      plan_days: {
        Row: {
          id: string;
          study_plan_id: string;
          plan_date: string;
          day_number: number;
          week_number: number;
          phase: string;
        };
      };
      plan_mutations: {
        Row: {
          id: string;
          study_plan_id: string;
          task_id: string;
          mutation_type: PlanMutationType;
          from_date: string | null;
          to_date: string | null;
          reason: string;
          actor_auth_user_id: string;
          created_at: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          family_id: string | null;
          actor_auth_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };

      import_runs: {
        Row: {
          id: string;
          family_id: string;
          status: ImportStatus;
          workbook_sha256: string;
          resource_inventory_sha256: string;
          calendar_overrides_sha256: string;
          report: Json;
          created_by: string;
          created_at: string;
        };
      };
    }>;
    Views: Record<string, any>;
    Functions: {
      [key: string]: any;
      create_family_with_owner: {
        Args: { p_name: string };
        Returns: string;
      };
      transfer_family_ownership: {
        Args: { p_family_id: string; p_new_owner_auth_user_id: string };
        Returns: {
          result_status: string;
          previous_owner_auth_user_id: string;
          new_owner_auth_user_id: string;
        }[];
      };
      create_student_pairing_code: {
        Args: { p_student_id: string };
        Returns: { code: string; expires_at: string }[];
      };
      claim_student_pairing_code: {
        Args: { p_code: string; p_device_label?: string };
        Returns: { result_status: string; student_id: string | null }[];
      };
      revoke_student_device: {
        Args: { p_device_id: string };
        Returns: void;
      };
      start_task_timer: {
        Args: { p_task_id: string };
        Returns: { session_id: string; started_at: string }[];
      };
      finish_benchmark_20: {
        Args: { p_session_id: string; p_correct: number; p_wrong: number; p_blank: number };
        Returns: {
          result_status: string;
          question_session_id: string | null;
          duration_seconds: number;
        }[];
      };
      cancel_task_timer: {
        Args: { p_session_id: string };
        Returns: void;
      };
      record_question_task_result: {
        Args: { p_task_id: string; p_correct: number; p_wrong: number; p_blank: number };
        Returns: { result_status: string; question_session_id: string; question_count: number }[];
      };
      complete_non_question_task: {
        Args: { p_task_id: string };
        Returns: { result_status: string; completion_id: string }[];
      };
      start_reading_session: {
        Args: { p_book_title?: string };
        Returns: { session_id: string; started_at: string }[];
      };
      finish_reading_session: {
        Args: { p_session_id: string; p_pages_read?: number };
        Returns: { session_id: string; duration_seconds: number }[];
      };
      add_mistake: {
        Args: {
          p_question_session_id?: string | null;
          p_subject_id?: number | null;
          p_topic_id?: string | null;
          p_reason: MistakeReason;
          p_note?: string | null;
        };
        Returns: string;
      };
      set_mistake_review_status: {
        Args: { p_mistake_id: string; p_status: ReviewStatus };
        Returns: void;
      };
      reschedule_task: {
        Args: { p_task_id: string; p_new_date: string; p_reason: string };
        Returns: {
          result_status: string;
          original_date: string;
          previous_date: string;
          current_date: string;
        }[];
      };
      cancel_plan_task: {
        Args: { p_task_id: string; p_reason: string };
        Returns: { result_status: string; plan_date: string }[];
      };
    };
    Enums: {
      family_role: FamilyRole;
      device_status: DeviceStatus;
      plan_status: PlanStatus;
      task_status: TaskStatus;
      session_status: SessionStatus;
      routine_type: RoutineType;
      question_block_kind: QuestionBlockKind;
      task_type: TaskType;
      resource_type: ResourceType;
      mistake_reason: MistakeReason;
      review_status: ReviewStatus;
      plan_mutation_type: PlanMutationType;
      import_status: ImportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
