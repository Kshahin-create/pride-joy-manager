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
      assets: {
        Row: {
          asset_code: string
          asset_name: string
          created_at: string
          created_by: string | null
          criticality: Database["public"]["Enums"]["asset_criticality"]
          expected_lifespan_years: number | null
          id: string
          install_date: string | null
          location: string | null
          manufacturer: string | null
          notes: string | null
          responsible_person: string | null
          serial_number: string | null
          supplier: string | null
          updated_at: string
          warranty_end_date: string | null
        }
        Insert: {
          asset_code: string
          asset_name: string
          created_at?: string
          created_by?: string | null
          criticality?: Database["public"]["Enums"]["asset_criticality"]
          expected_lifespan_years?: number | null
          id?: string
          install_date?: string | null
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          responsible_person?: string | null
          serial_number?: string | null
          supplier?: string | null
          updated_at?: string
          warranty_end_date?: string | null
        }
        Update: {
          asset_code?: string
          asset_name?: string
          created_at?: string
          created_by?: string | null
          criticality?: Database["public"]["Enums"]["asset_criticality"]
          expected_lifespan_years?: number | null
          id?: string
          install_date?: string | null
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          responsible_person?: string | null
          serial_number?: string | null
          supplier?: string | null
          updated_at?: string
          warranty_end_date?: string | null
        }
        Relationships: []
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
          location: string | null
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
          location?: string | null
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
          location?: string | null
          metadata?: Json | null
          module?: string
          updated_at?: string
        }
        Relationships: []
      }
      camera_maintenance_logs: {
        Row: {
          camera_id: string
          created_at: string
          created_by: string | null
          id: string
          issue_description: string | null
          maintenance_date: string
          next_maintenance_date: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          camera_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          issue_description?: string | null
          maintenance_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          camera_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          issue_description?: string | null
          maintenance_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "camera_maintenance_logs_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          camera_number: string
          camera_type: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string
          next_maintenance_date: string | null
          notes: string | null
          status: Database["public"]["Enums"]["camera_status"]
          updated_at: string
        }
        Insert: {
          camera_number: string
          camera_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location: string
          next_maintenance_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Update: {
          camera_number?: string
          camera_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string
          next_maintenance_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Relationships: []
      }
      cleaning_logs: {
        Row: {
          after_photo_path: string | null
          before_photo_path: string | null
          created_at: string
          created_by: string | null
          executed_by: string | null
          execution_date: string
          id: string
          notes: string | null
          plan_id: string
          updated_at: string
        }
        Insert: {
          after_photo_path?: string | null
          before_photo_path?: string | null
          created_at?: string
          created_by?: string | null
          executed_by?: string | null
          execution_date?: string
          id?: string
          notes?: string | null
          plan_id: string
          updated_at?: string
        }
        Update: {
          after_photo_path?: string | null
          before_photo_path?: string | null
          created_at?: string
          created_by?: string | null
          executed_by?: string | null
          execution_date?: string
          id?: string
          notes?: string | null
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cleaning_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_plans: {
        Row: {
          area: string
          contractor_company: string | null
          created_at: string
          created_by: string | null
          frequency: Database["public"]["Enums"]["cleaning_frequency"]
          id: string
          notes: string | null
          supervisor: string | null
          updated_at: string
        }
        Insert: {
          area: string
          contractor_company?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["cleaning_frequency"]
          id?: string
          notes?: string | null
          supervisor?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          contractor_company?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["cleaning_frequency"]
          id?: string
          notes?: string | null
          supervisor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_interactions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          details: string | null
          id: string
          interaction_date: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          interaction_date?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_unit_views: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          office_id: string
          updated_at: string
          view_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          office_id: string
          updated_at?: string
          view_date?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          office_id?: string
          updated_at?: string
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_unit_views_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_unit_views_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          activity: string | null
          commercial_register: string | null
          company_name: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          activity?: string | null
          commercial_register?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          activity?: string | null
          commercial_register?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_persons: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          mobile: string | null
          name: string
          notes: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mobile?: string | null
          name: string
          notes?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string
          notes?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_persons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["contract_attachment_type"]
          contract_id: string
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          attachment_type: Database["public"]["Enums"]["contract_attachment_type"]
          contract_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["contract_attachment_type"]
          contract_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          company_id: string
          contract_number: string
          created_at: string
          created_by: string | null
          deposit_amount: number
          end_date: string
          id: string
          notes: string | null
          office_id: string
          renewed_from_id: string | null
          rent_amount: number
          service_fees: number
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_number: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          end_date: string
          id?: string
          notes?: string | null
          office_id: string
          renewed_from_id?: string | null
          rent_amount?: number
          service_fees?: number
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_number?: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          end_date?: string
          id?: string
          notes?: string | null
          office_id?: string
          renewed_from_id?: string | null
          rent_amount?: number
          service_fees?: number
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_renewed_from_id_fkey"
            columns: ["renewed_from_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["doc_category"]
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["doc_entity_type"]
          expiry_date: string | null
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          issue_date: string | null
          mime_type: string | null
          notes: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["doc_category"]
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["doc_entity_type"]
          expiry_date?: string | null
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          issue_date?: string | null
          mime_type?: string | null
          notes?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["doc_category"]
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["doc_entity_type"]
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          issue_date?: string | null
          mime_type?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
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
      guard_attendance: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_out: string | null
          created_at: string
          created_by: string | null
          guard_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          created_by?: string | null
          guard_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          created_by?: string | null
          guard_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guard_attendance_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_attendance_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_evaluations: {
        Row: {
          created_at: string
          created_by: string | null
          evaluation_date: string
          evaluation_type: Database["public"]["Enums"]["evaluation_type"]
          guard_id: string
          id: string
          notes: string | null
          score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evaluation_date?: string
          evaluation_type: Database["public"]["Enums"]["evaluation_type"]
          guard_id: string
          id?: string
          notes?: string | null
          score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evaluation_date?: string
          evaluation_type?: Database["public"]["Enums"]["evaluation_type"]
          guard_id?: string
          id?: string
          notes?: string | null
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guard_evaluations_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_evaluations_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_leaves: {
        Row: {
          created_at: string
          created_by: string | null
          from_date: string
          guard_id: string
          id: string
          leave_type: string
          notes: string | null
          status: Database["public"]["Enums"]["leave_status"]
          to_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_date: string
          guard_id: string
          id?: string
          leave_type: string
          notes?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          to_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_date?: string
          guard_id?: string
          id?: string
          leave_type?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guard_leaves_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_leaves_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_penalties_rewards: {
        Row: {
          created_at: string
          created_by: string | null
          details: string | null
          guard_id: string
          id: string
          pr_date: string
          pr_type: Database["public"]["Enums"]["penalty_reward_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: string | null
          guard_id: string
          id?: string
          pr_date?: string
          pr_type: Database["public"]["Enums"]["penalty_reward_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: string | null
          guard_id?: string
          id?: string
          pr_date?: string
          pr_type?: Database["public"]["Enums"]["penalty_reward_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guard_penalties_rewards_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_penalties_rewards_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_trainings: {
        Row: {
          created_at: string
          created_by: string | null
          expiry_date: string | null
          guard_id: string
          id: string
          issue_date: string | null
          notes: string | null
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          guard_id: string
          id?: string
          issue_date?: string | null
          notes?: string | null
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          guard_id?: string
          id?: string
          issue_date?: string | null
          notes?: string | null
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guard_trainings_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_trainings_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      guards: {
        Row: {
          address: string | null
          birth_date: string | null
          contract_end_date: string | null
          created_at: string
          created_by: string | null
          direct_supervisor: string | null
          employee_number: string | null
          full_name: string
          id: string
          job_title: string | null
          mobile: string | null
          national_id: string | null
          nationality: string | null
          notes: string | null
          photo_url: string | null
          salary: number | null
          security_company: string | null
          shift_type: Database["public"]["Enums"]["shift_type"] | null
          start_date: string | null
          updated_at: string
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          contract_end_date?: string | null
          created_at?: string
          created_by?: string | null
          direct_supervisor?: string | null
          employee_number?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          mobile?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          salary?: number | null
          security_company?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_date?: string | null
          updated_at?: string
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          contract_end_date?: string | null
          created_at?: string
          created_by?: string | null
          direct_supervisor?: string | null
          employee_number?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          mobile?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          salary?: number | null
          security_company?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_date?: string | null
          updated_at?: string
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      inspection_results: {
        Row: {
          corrective_action: string | null
          created_at: string
          id: string
          inspection_id: string
          item_name: string
          maintenance_request_id: string | null
          notes: string | null
          photo_urls: string[] | null
          result: Database["public"]["Enums"]["inspection_item_result"]
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          id?: string
          inspection_id: string
          item_name: string
          maintenance_request_id?: string | null
          notes?: string | null
          photo_urls?: string[] | null
          result?: Database["public"]["Enums"]["inspection_item_result"]
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          id?: string
          inspection_id?: string
          item_name?: string
          maintenance_request_id?: string | null
          notes?: string | null
          photo_urls?: string[] | null
          result?: Database["public"]["Enums"]["inspection_item_result"]
        }
        Relationships: [
          {
            foreignKeyName: "inspection_results_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_results_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          active: boolean
          created_at: string
          frequency: Database["public"]["Enums"]["inspection_frequency"]
          id: string
          items: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          frequency: Database["public"]["Enums"]["inspection_frequency"]
          id?: string
          items?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          frequency?: Database["public"]["Enums"]["inspection_frequency"]
          id?: string
          items?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          created_at: string
          id: string
          inspection_date: string
          inspector_id: string | null
          inspector_name: string | null
          notes: string | null
          overall_result: Database["public"]["Enums"]["inspection_overall"]
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          inspector_name?: string | null
          notes?: string | null
          overall_result?: Database["public"]["Enums"]["inspection_overall"]
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          inspector_name?: string | null
          notes?: string | null
          overall_result?: Database["public"]["Enums"]["inspection_overall"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          company_id: string
          contract_id: string | null
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          issue_date: string
          notes: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          company_id: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          company_id?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          after_photo_url: string | null
          asset_id: string | null
          assigned_technician: string | null
          before_photo_url: string | null
          closed_at: string | null
          closed_by: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          inspection_id: string | null
          location: string | null
          notes: string | null
          office_id: string | null
          reported_by: string | null
          reporter_name: string | null
          request_date: string
          request_number: string | null
          request_type: string | null
          status: Database["public"]["Enums"]["maintenance_request_status"]
          updated_at: string
        }
        Insert: {
          after_photo_url?: string | null
          asset_id?: string | null
          assigned_technician?: string | null
          before_photo_url?: string | null
          closed_at?: string | null
          closed_by?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          inspection_id?: string | null
          location?: string | null
          notes?: string | null
          office_id?: string | null
          reported_by?: string | null
          reporter_name?: string | null
          request_date?: string
          request_number?: string | null
          request_type?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          updated_at?: string
        }
        Update: {
          after_photo_url?: string | null
          asset_id?: string | null
          assigned_technician?: string | null
          before_photo_url?: string | null
          closed_at?: string | null
          closed_by?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          inspection_id?: string | null
          location?: string | null
          notes?: string | null
          office_id?: string | null
          reported_by?: string | null
          reporter_name?: string | null
          request_date?: string
          request_number?: string | null
          request_type?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          link: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
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
      parking_cleaning_logs: {
        Row: {
          after_photo_url: string | null
          before_photo_url: string | null
          cleaning_date: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          responsible: string | null
          updated_at: string
        }
        Insert: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          cleaning_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          cleaning_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parking_maintenance_checks: {
        Row: {
          bumpers_status: Database["public"]["Enums"]["parking_check_status"]
          check_date: string
          created_at: string
          created_by: string | null
          fire_hoses_status: Database["public"]["Enums"]["parking_check_status"]
          fire_pipes_status: Database["public"]["Enums"]["parking_check_status"]
          floors_status: Database["public"]["Enums"]["parking_check_status"]
          gates_status: Database["public"]["Enums"]["parking_check_status"]
          id: string
          next_check_date: string | null
          notes: string | null
          paint_status: Database["public"]["Enums"]["parking_check_status"]
          signage_status: Database["public"]["Enums"]["parking_check_status"]
          updated_at: string
        }
        Insert: {
          bumpers_status?: Database["public"]["Enums"]["parking_check_status"]
          check_date?: string
          created_at?: string
          created_by?: string | null
          fire_hoses_status?: Database["public"]["Enums"]["parking_check_status"]
          fire_pipes_status?: Database["public"]["Enums"]["parking_check_status"]
          floors_status?: Database["public"]["Enums"]["parking_check_status"]
          gates_status?: Database["public"]["Enums"]["parking_check_status"]
          id?: string
          next_check_date?: string | null
          notes?: string | null
          paint_status?: Database["public"]["Enums"]["parking_check_status"]
          signage_status?: Database["public"]["Enums"]["parking_check_status"]
          updated_at?: string
        }
        Update: {
          bumpers_status?: Database["public"]["Enums"]["parking_check_status"]
          check_date?: string
          created_at?: string
          created_by?: string | null
          fire_hoses_status?: Database["public"]["Enums"]["parking_check_status"]
          fire_pipes_status?: Database["public"]["Enums"]["parking_check_status"]
          floors_status?: Database["public"]["Enums"]["parking_check_status"]
          gates_status?: Database["public"]["Enums"]["parking_check_status"]
          id?: string
          next_check_date?: string | null
          notes?: string | null
          paint_status?: Database["public"]["Enums"]["parking_check_status"]
          signage_status?: Database["public"]["Enums"]["parking_check_status"]
          updated_at?: string
        }
        Relationships: []
      }
      parking_spots: {
        Row: {
          camera_id: string | null
          coverage_notes: string | null
          created_at: string
          floor: string
          id: string
          location_description: string | null
          notes: string | null
          office_id: string | null
          spot_number: string
          spot_type: Database["public"]["Enums"]["parking_spot_type"]
          status: Database["public"]["Enums"]["parking_spot_status"]
          updated_at: string
        }
        Insert: {
          camera_id?: string | null
          coverage_notes?: string | null
          created_at?: string
          floor: string
          id?: string
          location_description?: string | null
          notes?: string | null
          office_id?: string | null
          spot_number: string
          spot_type?: Database["public"]["Enums"]["parking_spot_type"]
          status?: Database["public"]["Enums"]["parking_spot_status"]
          updated_at?: string
        }
        Update: {
          camera_id?: string | null
          coverage_notes?: string | null
          created_at?: string
          floor?: string
          id?: string
          location_description?: string | null
          notes?: string | null
          office_id?: string | null
          spot_number?: string
          spot_type?: Database["public"]["Enums"]["parking_spot_type"]
          status?: Database["public"]["Enums"]["parking_spot_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_spots_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_spots_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_violations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          photo_urls: string[] | null
          resolved_at: string | null
          spot_id: string | null
          status: Database["public"]["Enums"]["parking_violation_status"]
          updated_at: string
          violation_date: string
          violation_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          photo_urls?: string[] | null
          resolved_at?: string | null
          spot_id?: string | null
          status?: Database["public"]["Enums"]["parking_violation_status"]
          updated_at?: string
          violation_date?: string
          violation_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          photo_urls?: string[] | null
          resolved_at?: string | null
          spot_id?: string | null
          status?: Database["public"]["Enums"]["parking_violation_status"]
          updated_at?: string
          violation_date?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_violations_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_checkpoints: {
        Row: {
          checkpoint_name: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patrol_id: string
          photo_path: string | null
          visit_time: string
        }
        Insert: {
          checkpoint_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patrol_id: string
          photo_path?: string | null
          visit_time?: string
        }
        Update: {
          checkpoint_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patrol_id?: string
          photo_path?: string | null
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrol_checkpoints_patrol_id_fkey"
            columns: ["patrol_id"]
            isOneToOne: false
            referencedRelation: "patrols"
            referencedColumns: ["id"]
          },
        ]
      }
      patrols: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string | null
          guard_id: string | null
          id: string
          notes: string | null
          patrol_number: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          guard_id?: string | null
          id?: string
          notes?: string | null
          patrol_number: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          guard_id?: string | null
          id?: string
          notes?: string | null
          patrol_number?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrols_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrols_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_number: string
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_number: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
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
      security_incidents: {
        Row: {
          actions_taken: string | null
          closed_at: string | null
          closed_by: string | null
          closure_report: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          incident_date: string
          incident_number: string
          incident_type: string
          location: string
          photos: Json
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          actions_taken?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closure_report?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          incident_date?: string
          incident_number: string
          incident_type: string
          location: string
          photos?: Json
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          actions_taken?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closure_report?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          incident_date?: string
          incident_number?: string
          incident_type?: string
          location?: string
          photos?: Json
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          closed_by: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          maintenance_request_id: string | null
          office_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_notes: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          maintenance_request_id?: string | null
          office_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          maintenance_request_id?: string | null
          office_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
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
      vendor_contracts: {
        Row: {
          attachment_url: string | null
          contract_number: string
          contract_value: number
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          notes: string | null
          start_date: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          attachment_url?: string | null
          contract_number: string
          contract_value?: number
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          attachment_url?: string | null
          contract_number?: string
          contract_value?: number
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_evaluations: {
        Row: {
          commitment_score: number
          created_at: string
          created_by: string | null
          evaluation_date: string
          id: string
          notes: string | null
          quality_score: number
          speed_score: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          commitment_score: number
          created_at?: string
          created_by?: string | null
          evaluation_date?: string
          id?: string
          notes?: string | null
          quality_score: number
          speed_score: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          commitment_score?: number
          created_at?: string
          created_by?: string | null
          evaluation_date?: string
          id?: string
          notes?: string | null
          quality_score?: number
          speed_score?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_evaluations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          activity: string | null
          address: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          mobile: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          activity?: string | null
          address?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mobile?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          activity?: string | null
          address?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mobile?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          collected_this_month: number | null
          contracts_active: number | null
          contracts_expired: number | null
          contracts_expiring: number | null
          critical_failures: number | null
          guards_count: number | null
          incidents_open: number | null
          offices_available: number | null
          offices_maintenance: number | null
          offices_rented: number | null
          offices_reserved: number | null
          offices_total: number | null
          overdue_total: number | null
          parking_available: number | null
          parking_occupied: number | null
          patrols_week: number | null
          revenue_ytd: number | null
          scheduled_week: number | null
          tickets_closed: number | null
          tickets_emergency: number | null
          tickets_open: number | null
          violations_open: number | null
        }
        Relationships: []
      }
      guards_safe: {
        Row: {
          address: string | null
          birth_date: string | null
          contract_end_date: string | null
          created_at: string | null
          direct_supervisor: string | null
          employee_number: string | null
          full_name: string | null
          id: string | null
          job_title: string | null
          mobile: string | null
          national_id: string | null
          nationality: string | null
          notes: string | null
          photo_url: string | null
          security_company: string | null
          shift_type: Database["public"]["Enums"]["shift_type"] | null
          start_date: string | null
          updated_at: string | null
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          contract_end_date?: string | null
          created_at?: string | null
          direct_supervisor?: string | null
          employee_number?: string | null
          full_name?: string | null
          id?: string | null
          job_title?: string | null
          mobile?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          security_company?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_date?: string | null
          updated_at?: string | null
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          contract_end_date?: string | null
          created_at?: string | null
          direct_supervisor?: string | null
          employee_number?: string | null
          full_name?: string | null
          id?: string | null
          job_title?: string | null
          mobile?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          security_company?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_date?: string | null
          updated_at?: string | null
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          month: string | null
          revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_security: { Args: { _uid: string }; Returns: boolean }
      generate_daily_notifications: { Args: never; Returns: undefined }
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
      mark_overdue_invoices: { Args: never; Returns: undefined }
      notify: {
        Args: {
          _body: string
          _dedupe: string
          _entity_id: string
          _entity_type: string
          _link: string
          _role: Database["public"]["Enums"]["app_role"]
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      recalc_invoice_status: {
        Args: { _invoice_id: string }
        Returns: undefined
      }
      renew_contract: {
        Args: {
          _contract_id: string
          _new_end: string
          _new_rent?: number
          _new_start: string
        }
        Returns: string
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
      asset_criticality: "حرج" | "عادي"
      camera_status: "تعمل" | "معطلة" | "تحت الصيانة"
      cleaning_frequency: "يومي" | "أسبوعي" | "شهري"
      cleaning_photo_kind: "قبل" | "بعد"
      client_status:
        | "استفسار"
        | "مهتم"
        | "معاينة"
        | "تفاوض"
        | "حجز"
        | "تعاقد"
        | "غير مهتم"
      contract_attachment_type:
        | "نسخة العقد"
        | "الهوية"
        | "السجل التجاري"
        | "سند دفع"
      contract_status: "ساري" | "منتهي" | "مجدد" | "ملغي"
      doc_category:
        | "عقد"
        | "هوية"
        | "سجل تجاري"
        | "فاتورة"
        | "سند"
        | "عقد مورد"
        | "عقد صيانة"
        | "مخطط البرج"
        | "شهادة دفاع مدني"
        | "شهادة مصعد"
        | "عقد أمن"
        | "شهادة نظام حريق"
        | "تقرير صيانة سنوي"
        | "أخرى"
      doc_entity_type: "tenant" | "contract" | "asset" | "vendor" | "building"
      evaluation_type: "شهري" | "ربع سنوي"
      incident_status: "مفتوح" | "مغلق"
      inspection_frequency: "يومي" | "أسبوعي" | "شهري"
      inspection_item_result: "سليم" | "يحتاج إجراء"
      inspection_overall: "مطابق" | "ملاحظات" | "غير مطابق"
      interaction_type: "مكالمة" | "زيارة" | "ملاحظة"
      invoice_status: "مستحق" | "مدفوع جزئي" | "مدفوع" | "متأخر"
      invoice_type: "إيجار" | "تأمين" | "رسوم تشغيل" | "رسوم خدمات" | "غرامات"
      leave_status: "قيد المراجعة" | "معتمدة" | "مرفوضة"
      maintenance_request_status:
        | "جديد"
        | "جاري التنفيذ"
        | "بانتظار قطع غيار"
        | "مغلق"
      notification_type:
        | "contract_expiring"
        | "invoice_overdue"
        | "document_expiring"
        | "training_expiring"
        | "ticket_emergency"
        | "asset_critical_failure"
        | "generic"
      office_status: "متاح" | "محجوز" | "مؤجر" | "تحت الصيانة" | "غير متاح"
      parking_check_status: "سليم" | "يحتاج صيانة"
      parking_spot_status: "متاح" | "مخصص" | "مشغول" | "صيانة"
      parking_spot_type: "عادي" | "VIP" | "ذوي احتياجات"
      parking_violation_status: "مفتوحة" | "محلولة"
      payment_method: "نقدي" | "تحويل بنكي" | "شيك"
      penalty_reward_type: "مخالفة" | "إنذار" | "مكافأة"
      shift_type: "صباحي" | "مسائي" | "ليلي"
      ticket_priority: "منخفضة" | "متوسطة" | "عالية" | "طارئة"
      ticket_status: "جديد" | "جاري المعالجة" | "مغلق"
      ticket_type: "شكوى" | "صيانة" | "نظافة" | "أمن" | "استفسار"
      training_type: "أمن" | "سلامة" | "إسعافات أولية"
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
      asset_criticality: ["حرج", "عادي"],
      camera_status: ["تعمل", "معطلة", "تحت الصيانة"],
      cleaning_frequency: ["يومي", "أسبوعي", "شهري"],
      cleaning_photo_kind: ["قبل", "بعد"],
      client_status: [
        "استفسار",
        "مهتم",
        "معاينة",
        "تفاوض",
        "حجز",
        "تعاقد",
        "غير مهتم",
      ],
      contract_attachment_type: [
        "نسخة العقد",
        "الهوية",
        "السجل التجاري",
        "سند دفع",
      ],
      contract_status: ["ساري", "منتهي", "مجدد", "ملغي"],
      doc_category: [
        "عقد",
        "هوية",
        "سجل تجاري",
        "فاتورة",
        "سند",
        "عقد مورد",
        "عقد صيانة",
        "مخطط البرج",
        "شهادة دفاع مدني",
        "شهادة مصعد",
        "عقد أمن",
        "شهادة نظام حريق",
        "تقرير صيانة سنوي",
        "أخرى",
      ],
      doc_entity_type: ["tenant", "contract", "asset", "vendor", "building"],
      evaluation_type: ["شهري", "ربع سنوي"],
      incident_status: ["مفتوح", "مغلق"],
      inspection_frequency: ["يومي", "أسبوعي", "شهري"],
      inspection_item_result: ["سليم", "يحتاج إجراء"],
      inspection_overall: ["مطابق", "ملاحظات", "غير مطابق"],
      interaction_type: ["مكالمة", "زيارة", "ملاحظة"],
      invoice_status: ["مستحق", "مدفوع جزئي", "مدفوع", "متأخر"],
      invoice_type: ["إيجار", "تأمين", "رسوم تشغيل", "رسوم خدمات", "غرامات"],
      leave_status: ["قيد المراجعة", "معتمدة", "مرفوضة"],
      maintenance_request_status: [
        "جديد",
        "جاري التنفيذ",
        "بانتظار قطع غيار",
        "مغلق",
      ],
      notification_type: [
        "contract_expiring",
        "invoice_overdue",
        "document_expiring",
        "training_expiring",
        "ticket_emergency",
        "asset_critical_failure",
        "generic",
      ],
      office_status: ["متاح", "محجوز", "مؤجر", "تحت الصيانة", "غير متاح"],
      parking_check_status: ["سليم", "يحتاج صيانة"],
      parking_spot_status: ["متاح", "مخصص", "مشغول", "صيانة"],
      parking_spot_type: ["عادي", "VIP", "ذوي احتياجات"],
      parking_violation_status: ["مفتوحة", "محلولة"],
      payment_method: ["نقدي", "تحويل بنكي", "شيك"],
      penalty_reward_type: ["مخالفة", "إنذار", "مكافأة"],
      shift_type: ["صباحي", "مسائي", "ليلي"],
      ticket_priority: ["منخفضة", "متوسطة", "عالية", "طارئة"],
      ticket_status: ["جديد", "جاري المعالجة", "مغلق"],
      ticket_type: ["شكوى", "صيانة", "نظافة", "أمن", "استفسار"],
      training_type: ["أمن", "سلامة", "إسعافات أولية"],
    },
  },
} as const
