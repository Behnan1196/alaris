export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "17.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client_profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          goals: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          goals?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          goals?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_domains: {
        Row: {
          coach_id: string
          domain_key: string
        }
        Insert: {
          coach_id: string
          domain_key: string
        }
        Update: {
          coach_id?: string
          domain_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_domains_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coach_domains_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["key"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          bio: string | null
          created_at: string
          photo_path: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          photo_path?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          photo_path?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_domains: {
        Row: {
          coaching_id: string
          domain_key: string
        }
        Insert: {
          coaching_id: string
          domain_key: string
        }
        Update: {
          coaching_id?: string
          domain_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_domains_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_domains_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["key"]
          },
        ]
      }
      coaching_notes: {
        Row: {
          body: string
          coaching_id: string
          updated_at: string
        }
        Insert: {
          body?: string
          coaching_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          coaching_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_notes_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: true
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
        ]
      }
      coachings: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["coaching_status"]
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["coaching_status"]
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["coaching_status"]
        }
        Relationships: [
          {
            foreignKeyName: "coachings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coachings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      consents: {
        Row: {
          client_id: string
          coaching_id: string | null
          granted_at: string
          grantee_coach_id: string | null
          id: string
          revoked_at: string | null
          source_coaching_id: string | null
          text_version: string
          type: Database["public"]["Enums"]["consent_type"]
        }
        Insert: {
          client_id: string
          coaching_id?: string | null
          granted_at?: string
          grantee_coach_id?: string | null
          id?: string
          revoked_at?: string | null
          source_coaching_id?: string | null
          text_version: string
          type: Database["public"]["Enums"]["consent_type"]
        }
        Update: {
          client_id?: string
          coaching_id?: string | null
          granted_at?: string
          grantee_coach_id?: string | null
          id?: string
          revoked_at?: string | null
          source_coaching_id?: string | null
          text_version?: string
          type?: Database["public"]["Enums"]["consent_type"]
        }
        Relationships: [
          {
            foreignKeyName: "consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_grantee_coach_id_fkey"
            columns: ["grantee_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "consents_source_coaching_id_fkey"
            columns: ["source_coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_task_types: {
        Row: {
          domain_key: string
          task_type_key: string
        }
        Insert: {
          domain_key: string
          task_type_key: string
        }
        Update: {
          domain_key?: string
          task_type_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_task_types_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "domain_task_types_task_type_key_fkey"
            columns: ["task_type_key"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["key"]
          },
        ]
      }
      domains: {
        Row: {
          color: string
          enabled: boolean
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          color: string
          enabled?: boolean
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          enabled?: boolean
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          equipment: string | null
          id: string
          muscles: string[]
          name: string
          owner_coach_id: string | null
          steps: string[]
          video_paths: Json
        }
        Insert: {
          created_at?: string
          equipment?: string | null
          id?: string
          muscles?: string[]
          name: string
          owner_coach_id?: string | null
          steps?: string[]
          video_paths?: Json
        }
        Update: {
          created_at?: string
          equipment?: string | null
          id?: string
          muscles?: string[]
          name?: string
          owner_coach_id?: string | null
          steps?: string[]
          video_paths?: Json
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      foods: {
        Row: {
          carb_g: number | null
          created_at: string
          fat_g: number | null
          id: string
          kcal: number | null
          name: string
          owner_coach_id: string | null
          portion: string | null
          protein_g: number | null
        }
        Insert: {
          carb_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          kcal?: number | null
          name: string
          owner_coach_id?: string | null
          portion?: string | null
          protein_g?: number | null
        }
        Update: {
          carb_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          kcal?: number | null
          name?: string
          owner_coach_id?: string | null
          portion?: string | null
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foods_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          date: string
          habit_id: string
          updated_at: string
          value: number
        }
        Insert: {
          date: string
          habit_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          date?: string
          habit_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          client_can_edit_target: boolean
          client_id: string
          coaching_id: string | null
          created_at: string
          domain_key: string | null
          frequency: Database["public"]["Enums"]["habit_frequency"]
          id: string
          program_id: string | null
          reminder_time: string | null
          show_streak: boolean
          target: number | null
          title: string
          unit: string | null
          visible_to_coaches: boolean
        }
        Insert: {
          active?: boolean
          client_can_edit_target?: boolean
          client_id: string
          coaching_id?: string | null
          created_at?: string
          domain_key?: string | null
          frequency?: Database["public"]["Enums"]["habit_frequency"]
          id?: string
          program_id?: string | null
          reminder_time?: string | null
          show_streak?: boolean
          target?: number | null
          title: string
          unit?: string | null
          visible_to_coaches?: boolean
        }
        Update: {
          active?: boolean
          client_can_edit_target?: boolean
          client_id?: string
          coaching_id?: string | null
          created_at?: string
          domain_key?: string | null
          frequency?: Database["public"]["Enums"]["habit_frequency"]
          id?: string
          program_id?: string | null
          reminder_time?: string | null
          show_streak?: boolean
          target?: number | null
          title?: string
          unit?: string | null
          visible_to_coaches?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "habits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "habits_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          coach_id: string
          coaching_id: string | null
          code: string
          created_at: string
          domain_keys: string[]
          expires_at: string
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          coach_id: string
          coaching_id?: string | null
          code: string
          created_at?: string
          domain_keys: string[]
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          coach_id?: string
          coaching_id?: string | null
          code?: string
          created_at?: string
          domain_keys?: string[]
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invites_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          client_id: string
          coaching_id: string | null
          created_at: string
          id: string
          measured_on: string
          metric: Database["public"]["Enums"]["measurement_metric"]
          task_instance_id: string | null
          value: number
        }
        Insert: {
          client_id: string
          coaching_id?: string | null
          created_at?: string
          id?: string
          measured_on?: string
          metric: Database["public"]["Enums"]["measurement_metric"]
          task_instance_id?: string | null
          value: number
        }
        Update: {
          client_id?: string
          coaching_id?: string | null
          created_at?: string
          id?: string
          measured_on?: string
          metric?: Database["public"]["Enums"]["measurement_metric"]
          task_instance_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_task_instance_id_fkey"
            columns: ["task_instance_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          read_at: string | null
          related_task_instance_id: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_task_instance_id?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_task_instance_id?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_related_task_instance_id_fkey"
            columns: ["related_task_instance_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          locale: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          locale?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          locale?: string
          phone?: string | null
        }
        Relationships: []
      }
      program_tasks: {
        Row: {
          client_note: string | null
          created_at: string
          day_of_week: number
          id: string
          options: Json
          payload: Json
          program_id: string
          sort_order: number
          task_type_key: string
          title: string
          week_no: number
        }
        Insert: {
          client_note?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          options?: Json
          payload?: Json
          program_id: string
          sort_order?: number
          task_type_key: string
          title: string
          week_no?: number
        }
        Update: {
          client_note?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          options?: Json
          payload?: Json
          program_id?: string
          sort_order?: number
          task_type_key?: string
          title?: string
          week_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_tasks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_tasks_task_type_key_fkey"
            columns: ["task_type_key"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["key"]
          },
        ]
      }
      programs: {
        Row: {
          coach_id: string
          coaching_id: string | null
          created_at: string
          domain_key: string
          id: string
          is_template: boolean
          name: string
          repeat: Database["public"]["Enums"]["program_repeat"]
          start_date: string | null
          status: Database["public"]["Enums"]["program_status"]
          updated_at: string
          weeks: number
        }
        Insert: {
          coach_id: string
          coaching_id?: string | null
          created_at?: string
          domain_key: string
          id?: string
          is_template?: boolean
          name: string
          repeat?: Database["public"]["Enums"]["program_repeat"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          updated_at?: string
          weeks?: number
        }
        Update: {
          coach_id?: string
          coaching_id?: string | null
          created_at?: string
          domain_key?: string
          id?: string
          is_template?: boolean
          name?: string
          repeat?: Database["public"]["Enums"]["program_repeat"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          updated_at?: string
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "programs_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["key"]
          },
        ]
      }
      subscriptions: {
        Row: {
          coach_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          coach_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider?: string | null
          provider_ref?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          coach_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      task_instances: {
        Row: {
          client_id: string
          coaching_id: string
          completed_at: string | null
          created_at: string
          date: string
          domain_key: string
          id: string
          payload: Json
          program_id: string | null
          program_task_id: string | null
          progress: Json
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type_key: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          coaching_id: string
          completed_at?: string | null
          created_at?: string
          date: string
          domain_key: string
          id?: string
          payload?: Json
          program_id?: string | null
          program_task_id?: string | null
          progress?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type_key: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          coaching_id?: string
          completed_at?: string | null
          created_at?: string
          date?: string
          domain_key?: string
          id?: string
          payload?: Json
          program_id?: string | null
          program_task_id?: string | null
          progress?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coachings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "task_instances_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_program_task_id_fkey"
            columns: ["program_task_id"]
            isOneToOne: false
            referencedRelation: "program_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_task_type_key_fkey"
            columns: ["task_type_key"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["key"]
          },
        ]
      }
      task_logs: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          task_instance_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: string
          task_instance_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          task_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_instance_id_fkey"
            columns: ["task_instance_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          is_habit: boolean
          key: string
          name: string
          schema: Json
        }
        Insert: {
          is_habit?: boolean
          key: string
          name: string
          schema?: Json
        }
        Update: {
          is_habit?: boolean
          key?: string
          name?: string
          schema?: Json
        }
        Relationships: []
      }
      threads: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      become_coach: {
        Args: { p_domain_keys: string[]; p_title: string }
        Returns: undefined
      }
      client_other_domains: {
        Args: { p_client_id: string }
        Returns: {
          domain_key: string
        }[]
      }
      create_invite: { Args: { p_domain_keys: string[] }; Returns: string }
      mark_thread_read: { Args: { p_thread_id: string }; Returns: number }
      invite_preview: {
        Args: { p_code: string }
        Returns: {
          coach_name: string
          coach_title: string
          domain_keys: string[]
          expires_at: string
        }[]
      }
      redeem_invite: {
        Args: { p_code: string; p_consent_version: string }
        Returns: string
      }
      set_habit_target: {
        Args: { p_habit_id: string; p_target: number }
        Returns: undefined
      }
    }
    Enums: {
      coaching_status: "invited" | "active" | "paused" | "ended"
      consent_type:
        | "kvkk"
        | "health_data"
        | "share_with_coach"
        | "cross_coach_share"
        | "marketing"
      habit_frequency: "daily" | "weekdays" | "three_per_week"
      measurement_metric: "weight" | "waist" | "hip" | "body_fat"
      program_repeat: "once" | "four_weeks" | "until_end"
      program_status: "draft" | "active" | "completed" | "archived"
      subscription_plan: "monthly" | "yearly"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      task_status: "pending" | "in_progress" | "done" | "missed" | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      coaching_status: ["invited", "active", "paused", "ended"],
      consent_type: [
        "kvkk",
        "health_data",
        "share_with_coach",
        "cross_coach_share",
        "marketing",
      ],
      habit_frequency: ["daily", "weekdays", "three_per_week"],
      measurement_metric: ["weight", "waist", "hip", "body_fat"],
      program_repeat: ["once", "four_weeks", "until_end"],
      program_status: ["draft", "active", "completed", "archived"],
      subscription_plan: ["monthly", "yearly"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
      task_status: ["pending", "in_progress", "done", "missed", "skipped"],
    },
  },
} as const
