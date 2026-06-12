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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ac_maintenance_logs: {
        Row: {
          ac_unit_id: string
          created_at: string
          created_by: string | null
          id: string
          maintenance_date: string
          next_maintenance_date: string | null
          notes: string | null
          technician: string | null
          updated_at: string
        }
        Insert: {
          ac_unit_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          maintenance_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          technician?: string | null
          updated_at?: string
        }
        Update: {
          ac_unit_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          maintenance_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          technician?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_maintenance_logs_ac_unit_id_fkey"
            columns: ["ac_unit_id"]
            isOneToOne: false
            referencedRelation: "ac_units"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_units: {
        Row: {
          ac_type: string | null
          capacity: string | null
          created_at: string
          created_by: string | null
          current_status: string
          id: string
          install_date: string | null
          maintenance_company: string | null
          manufacturer: string | null
          notes: string | null
          office_id: string
          unit_number: string
          updated_at: string
          warranty_end_date: string | null
        }
        Insert: {
          ac_type?: string | null
          capacity?: string | null
          created_at?: string
          created_by?: string | null
          current_status?: string
          id?: string
          install_date?: string | null
          maintenance_company?: string | null
          manufacturer?: string | null
          notes?: string | null
          office_id: string
          unit_number: string
          updated_at?: string
          warranty_end_date?: string | null
        }
        Update: {
          ac_type?: string | null
          capacity?: string | null
          created_at?: string
          created_by?: string | null
          current_status?: string
          id?: string
          install_date?: string | null
          maintenance_company?: string | null
          manufacturer?: string | null
          notes?: string | null
          office_id?: string
          unit_number?: string
          updated_at?: string
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_units_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      building_log: {
        Row: {
          actor_id: string | null
          created_at: string
          created_by: string | null
          description: string
          entity_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          module: string
          updated_at: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          entity_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          module: string
          updated_at?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          entity_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          module?: string
          updated_at?: string
        }
        Relationships: []
      }
      electricity_meters: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_independent: boolean
          meter_number: string
          meter_status: string
          notes: string | null
          office_id: string
          updated_at: string
          utility_account_number: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_independent?: boolean
          meter_number: string
          meter_status?: string
          notes?: string | null
          office_id: string
          updated_at?: string
          utility_account_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_independent?: boolean
          meter_number?: string
          meter_status?: string
          notes?: string | null
          office_id?: string
          updated_at?: string
          utility_account_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "electricity_meters_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      electricity_readings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          meter_id: string
          notes: string | null
          reading_date: string
          reading_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          meter_id: string
          notes?: string | null
          reading_date?: string
          reading_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          meter_id?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "electricity_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "electricity_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      network_points: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          network_point: string | null
          notes: string | null
          office_id: string
          phone_point: string | null
          service_provider: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          network_point?: string | null
          notes?: string | null
          office_id: string
          phone_point?: string | null
          service_provider?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          network_point?: string | null
          notes?: string | null
          office_id?: string
          phone_point?: string | null
          service_provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_points_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_files: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          id: string
          mime_type: string | null
          notes: string | null
          office_id: string
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          office_id: string
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          office_id?: string
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_files_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          area_sqm: number | null
          code: string
          created_at: string
          created_by: string | null
          floor: number
          id: string
          management_entity: string | null
          notes: string | null
          office_number: string
          parking_count: number
          status: Database["public"]["Enums"]["office_status"]
          updated_at: string
          view_type: string | null
        }
        Insert: {
          area_sqm?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          floor: number
          id?: string
          management_entity?: string | null
          notes?: string | null
          office_number: string
          parking_count?: number
          status?: Database["public"]["Enums"]["office_status"]
          updated_at?: string
          view_type?: string | null
        }
        Update: {
          area_sqm?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          floor?: number
          id?: string
          management_entity?: string | null
          notes?: string | null
          office_number?: string
          parking_count?: number
          status?: Database["public"]["Enums"]["office_status"]
          updated_at?: string
          view_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "accountant"
        | "security_supervisor"
        | "maintenance_supervisor"
        | "receptionist"
        | "owner"
      office_status: "متاح" | "محجوز" | "مؤجر" | "تحت الصيانة" | "غير متاح"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "accountant",
        "security_supervisor",
        "maintenance_supervisor",
        "receptionist",
        "owner",
      ],
      office_status: ["متاح", "محجوز", "مؤجر", "تحت الصيانة", "غير متاح"],
    },
  },
} as const
