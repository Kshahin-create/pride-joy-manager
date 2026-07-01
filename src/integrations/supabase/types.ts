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
      ac_contract_attachments: {
        Row: {
          category: string | null
          contract_id: string
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          property_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          contract_id: string
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          property_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          contract_id?: string
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          property_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ac_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_contract_attachments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_contracts: {
        Row: {
          alert_thresholds_days: number[] | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          contract_name: string
          contract_number: string | null
          contract_type: string
          contract_value: number | null
          covered_ac_unit_ids: string[] | null
          created_at: string
          created_by: string | null
          duration_months: number | null
          end_date: string | null
          first_party_name: string | null
          id: string
          includes_corrective: boolean | null
          includes_emergency: boolean | null
          includes_preventive: boolean | null
          notes: string | null
          notice_period_days: number | null
          payment_frequency: string | null
          payment_method: string | null
          pm_frequency: string | null
          property_id: string | null
          sla_critical_response_hours: number | null
          sla_normal_response_hours: number | null
          spare_parts_included: boolean | null
          spare_parts_notes: string | null
          start_date: string | null
          status: string
          tax_included: boolean | null
          tax_percentage: number | null
          updated_at: string
          vendor_contact_name: string | null
          vendor_cr: string | null
          vendor_email: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_phone: string | null
          vendor_tax_number: string | null
        }
        Insert: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          contract_name: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          covered_ac_unit_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          first_party_name?: string | null
          id?: string
          includes_corrective?: boolean | null
          includes_emergency?: boolean | null
          includes_preventive?: boolean | null
          notes?: string | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          payment_method?: string | null
          pm_frequency?: string | null
          property_id?: string | null
          sla_critical_response_hours?: number | null
          sla_normal_response_hours?: number | null
          spare_parts_included?: boolean | null
          spare_parts_notes?: string | null
          start_date?: string | null
          status?: string
          tax_included?: boolean | null
          tax_percentage?: number | null
          updated_at?: string
          vendor_contact_name?: string | null
          vendor_cr?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_tax_number?: string | null
        }
        Update: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          contract_name?: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          covered_ac_unit_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          first_party_name?: string | null
          id?: string
          includes_corrective?: boolean | null
          includes_emergency?: boolean | null
          includes_preventive?: boolean | null
          notes?: string | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          payment_method?: string | null
          pm_frequency?: string | null
          property_id?: string | null
          sla_critical_response_hours?: number | null
          sla_normal_response_hours?: number | null
          spare_parts_included?: boolean | null
          spare_parts_notes?: string | null
          start_date?: string | null
          status?: string
          tax_included?: boolean | null
          tax_percentage?: number | null
          updated_at?: string
          vendor_contact_name?: string | null
          vendor_cr?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_tax_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
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
          property_id: string
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
          property_id?: string
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
          property_id?: string
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
          {
            foreignKeyName: "ac_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_permissions: {
        Row: {
          action: string
          description: string | null
          key: string
          label: string
          module: string
          module_label: string
          sort_order: number
        }
        Insert: {
          action: string
          description?: string | null
          key: string
          label: string
          module: string
          module_label: string
          sort_order?: number
        }
        Update: {
          action?: string
          description?: string | null
          key?: string
          label?: string
          module?: string
          module_label?: string
          sort_order?: number
        }
        Relationships: []
      }
      app_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_attachments: {
        Row: {
          asset_id: string
          attachment_name: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          asset_id: string
          attachment_name?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          asset_id?: string
          attachment_name?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_attachments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_types: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          asset_code: string
          asset_name: string
          asset_type: string | null
          capacity: string | null
          created_at: string
          created_by: string | null
          criticality: Database["public"]["Enums"]["asset_criticality"]
          current_status: Database["public"]["Enums"]["asset_current_status"]
          custom_frequency_days: number | null
          expected_lifespan_years: number | null
          id: string
          install_date: string | null
          last_maintenance_date: string | null
          location: string | null
          location_type:
            | Database["public"]["Enums"]["asset_location_type"]
            | null
          maintenance_company: string | null
          maintenance_company_phone: string | null
          maintenance_contract_id: string | null
          maintenance_contract_type: string | null
          maintenance_frequency:
            | Database["public"]["Enums"]["asset_maintenance_frequency"]
            | null
          manufacturer: string | null
          next_maintenance_date: string | null
          notes: string | null
          office_id: string | null
          photo_urls: string[]
          property_id: string
          responsible_person: string | null
          serial_number: string | null
          space_id: string | null
          specs: Json
          supplier: string | null
          supplier_vendor_id: string | null
          updated_at: string
          warranty_end_date: string | null
          warranty_start_date: string | null
          warranty_status: Database["public"]["Enums"]["warranty_status"] | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          asset_code: string
          asset_name: string
          asset_type?: string | null
          capacity?: string | null
          created_at?: string
          created_by?: string | null
          criticality?: Database["public"]["Enums"]["asset_criticality"]
          current_status?: Database["public"]["Enums"]["asset_current_status"]
          custom_frequency_days?: number | null
          expected_lifespan_years?: number | null
          id?: string
          install_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          location_type?:
            | Database["public"]["Enums"]["asset_location_type"]
            | null
          maintenance_company?: string | null
          maintenance_company_phone?: string | null
          maintenance_contract_id?: string | null
          maintenance_contract_type?: string | null
          maintenance_frequency?:
            | Database["public"]["Enums"]["asset_maintenance_frequency"]
            | null
          manufacturer?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          office_id?: string | null
          photo_urls?: string[]
          property_id?: string
          responsible_person?: string | null
          serial_number?: string | null
          space_id?: string | null
          specs?: Json
          supplier?: string | null
          supplier_vendor_id?: string | null
          updated_at?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
          warranty_status?:
            | Database["public"]["Enums"]["warranty_status"]
            | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          asset_code?: string
          asset_name?: string
          asset_type?: string | null
          capacity?: string | null
          created_at?: string
          created_by?: string | null
          criticality?: Database["public"]["Enums"]["asset_criticality"]
          current_status?: Database["public"]["Enums"]["asset_current_status"]
          custom_frequency_days?: number | null
          expected_lifespan_years?: number | null
          id?: string
          install_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          location_type?:
            | Database["public"]["Enums"]["asset_location_type"]
            | null
          maintenance_company?: string | null
          maintenance_company_phone?: string | null
          maintenance_contract_id?: string | null
          maintenance_contract_type?: string | null
          maintenance_frequency?:
            | Database["public"]["Enums"]["asset_maintenance_frequency"]
            | null
          manufacturer?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          office_id?: string | null
          photo_urls?: string[]
          property_id?: string
          responsible_person?: string | null
          serial_number?: string | null
          space_id?: string | null
          specs?: Json
          supplier?: string | null
          supplier_vendor_id?: string | null
          updated_at?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
          warranty_status?:
            | Database["public"]["Enums"]["warranty_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_supplier_vendor_id_fkey"
            columns: ["supplier_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
        }
        Relationships: []
      }
      building_identity: {
        Row: {
          address: string | null
          building_name: string
          city: string | null
          country: string | null
          cr_number: string | null
          created_at: string
          email: string | null
          id: boolean
          legal_name: string | null
          logo_url: string | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          total_floors: number | null
          total_offices: number | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          building_name?: string
          city?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string
          email?: string | null
          id?: boolean
          legal_name?: string | null
          logo_url?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          total_floors?: number | null
          total_offices?: number | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          building_name?: string
          city?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string
          email?: string | null
          id?: boolean
          legal_name?: string | null
          logo_url?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          total_floors?: number | null
          total_offices?: number | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
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
          property_id: string
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
          property_id?: string
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
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          archived_at: string | null
          archived_by: string | null
          camera_number: string
          camera_type: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string
          next_maintenance_date: string | null
          notes: string | null
          property_id: string
          status: Database["public"]["Enums"]["camera_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          camera_number: string
          camera_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location: string
          next_maintenance_date?: string | null
          notes?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          camera_number?: string
          camera_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string
          next_maintenance_date?: string | null
          notes?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cameras_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_contract_attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["cleaning_contract_attachment_type"]
          cleaning_contract_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          attachment_type?: Database["public"]["Enums"]["cleaning_contract_attachment_type"]
          cleaning_contract_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["cleaning_contract_attachment_type"]
          cleaning_contract_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_contract_attachments_cleaning_contract_id_fkey"
            columns: ["cleaning_contract_id"]
            isOneToOne: false
            referencedRelation: "cleaning_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_contracts: {
        Row: {
          alert_thresholds_days: number[] | null
          annual_value: number | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          cleaning_supplies: string[] | null
          cleaning_type: Database["public"]["Enums"]["cleaning_contract_type"]
          contract_number: string | null
          contract_value: number | null
          created_at: string
          created_by: string | null
          day_workers: number | null
          duration_months: number | null
          end_date: string | null
          first_party_name: string | null
          hours_per_day: number | null
          id: string
          materials_responsibility:
            | Database["public"]["Enums"]["materials_responsibility"]
            | null
          monthly_value: number | null
          night_workers: number | null
          notes: string | null
          notice_period_days: number | null
          payment_frequency:
            | Database["public"]["Enums"]["cleaning_payment_frequency"]
            | null
          payment_method: string | null
          property_id: string
          restroom_supplies: string[] | null
          scope_areas: string[] | null
          shift_end: string | null
          shift_start: string | null
          sla_quality_pct_target: number | null
          sla_response_emergency_hours: number | null
          sla_response_normal_hours: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          supervisors: number | null
          tax_inclusive: boolean | null
          tax_pct: number | null
          taxable: boolean | null
          updated_at: string
          vendor_contact_name: string | null
          vendor_cr: string | null
          vendor_email: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_phone: string | null
          vendor_tax_number: string | null
        }
        Insert: {
          alert_thresholds_days?: number[] | null
          annual_value?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          cleaning_supplies?: string[] | null
          cleaning_type?: Database["public"]["Enums"]["cleaning_contract_type"]
          contract_number?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          day_workers?: number | null
          duration_months?: number | null
          end_date?: string | null
          first_party_name?: string | null
          hours_per_day?: number | null
          id?: string
          materials_responsibility?:
            | Database["public"]["Enums"]["materials_responsibility"]
            | null
          monthly_value?: number | null
          night_workers?: number | null
          notes?: string | null
          notice_period_days?: number | null
          payment_frequency?:
            | Database["public"]["Enums"]["cleaning_payment_frequency"]
            | null
          payment_method?: string | null
          property_id?: string
          restroom_supplies?: string[] | null
          scope_areas?: string[] | null
          shift_end?: string | null
          shift_start?: string | null
          sla_quality_pct_target?: number | null
          sla_response_emergency_hours?: number | null
          sla_response_normal_hours?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          supervisors?: number | null
          tax_inclusive?: boolean | null
          tax_pct?: number | null
          taxable?: boolean | null
          updated_at?: string
          vendor_contact_name?: string | null
          vendor_cr?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_tax_number?: string | null
        }
        Update: {
          alert_thresholds_days?: number[] | null
          annual_value?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          cleaning_supplies?: string[] | null
          cleaning_type?: Database["public"]["Enums"]["cleaning_contract_type"]
          contract_number?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          day_workers?: number | null
          duration_months?: number | null
          end_date?: string | null
          first_party_name?: string | null
          hours_per_day?: number | null
          id?: string
          materials_responsibility?:
            | Database["public"]["Enums"]["materials_responsibility"]
            | null
          monthly_value?: number | null
          night_workers?: number | null
          notes?: string | null
          notice_period_days?: number | null
          payment_frequency?:
            | Database["public"]["Enums"]["cleaning_payment_frequency"]
            | null
          payment_method?: string | null
          property_id?: string
          restroom_supplies?: string[] | null
          scope_areas?: string[] | null
          shift_end?: string | null
          shift_start?: string | null
          sla_quality_pct_target?: number | null
          sla_response_emergency_hours?: number | null
          sla_response_normal_hours?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          supervisors?: number | null
          tax_inclusive?: boolean | null
          tax_pct?: number | null
          taxable?: boolean | null
          updated_at?: string
          vendor_contact_name?: string | null
          vendor_cr?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_tax_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
          space_id: string | null
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
          space_id?: string | null
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
          space_id?: string | null
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
          {
            foreignKeyName: "cleaning_logs_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_plans: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          area: string
          contractor_company: string | null
          created_at: string
          created_by: string | null
          frequency: Database["public"]["Enums"]["cleaning_frequency"]
          id: string
          notes: string | null
          property_id: string
          supervisor: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          area: string
          contractor_company?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["cleaning_frequency"]
          id?: string
          notes?: string | null
          property_id?: string
          supervisor?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          area?: string
          contractor_company?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["cleaning_frequency"]
          id?: string
          notes?: string | null
          property_id?: string
          supervisor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          commercial_register: string | null
          company_name: string
          created_at: string
          created_by: string | null
          delegate_name: string | null
          id: string
          notes: string | null
          phone: string | null
          property_id: string
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          activity?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          commercial_register?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          delegate_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["client_status"]
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          activity?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          commercial_register?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          delegate_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["client_status"]
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      company_attachments: {
        Row: {
          attachment_type: string
          company_id: string
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
          attachment_type?: string
          company_id: string
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
          attachment_type?: string
          company_id?: string
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
            foreignKeyName: "company_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      contract_delegates: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_delegates_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_deposit_deductions: {
        Row: {
          amount: number
          attachment_path: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          deduction_date: string
          id: string
          reason: string
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_path?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          deduction_date?: string
          id?: string
          reason: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_path?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          deduction_date?: string
          id?: string
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_deposit_deductions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_offices: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          is_primary: boolean
          notes: string | null
          office_id: string
          rent_share: number | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          office_id: string
          rent_share?: number | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          office_id?: string
          rent_share?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_offices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_offices_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_parking_spots: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          notes: string | null
          parking_spot_id: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          notes?: string | null
          parking_spot_id: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          parking_spot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_parking_spots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parking_spots_parking_spot_id_fkey"
            columns: ["parking_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payment_schedule: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          installment_number: number
          invoice_id: string | null
          notes: string | null
          paid_date: string | null
          status: Database["public"]["Enums"]["payment_schedule_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          invoice_id?: string | null
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_schedule_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          invoice_id?: string | null
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_schedule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_payment_schedule_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payment_schedule_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          alert_thresholds_days: number[]
          annual_increase_pct: number | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          auto_renew: boolean
          company_id: string
          contract_name: string | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string | null
          deposit_amount: number
          deposit_notes: string | null
          deposit_refund_amount: number | null
          deposit_refund_date: string | null
          deposit_status: Database["public"]["Enums"]["deposit_status"] | null
          discount_amount: number | null
          discount_notes: string | null
          end_date: string
          evacuation_date: string | null
          id: string
          lessor_cr: string | null
          lessor_id_number: string | null
          lessor_name: string | null
          notes: string | null
          notice_period_days: number | null
          office_id: string
          operating_fees: number | null
          property_id: string
          renewed_from_id: string | null
          rent_amount: number
          service_fees: number
          service_fees_breakdown: Json | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          vat_inclusive: boolean | null
          vat_percentage: number | null
        }
        Insert: {
          alert_thresholds_days?: number[]
          annual_increase_pct?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          auto_renew?: boolean
          company_id: string
          contract_name?: string | null
          contract_number: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          deposit_notes?: string | null
          deposit_refund_amount?: number | null
          deposit_refund_date?: string | null
          deposit_status?: Database["public"]["Enums"]["deposit_status"] | null
          discount_amount?: number | null
          discount_notes?: string | null
          end_date: string
          evacuation_date?: string | null
          id?: string
          lessor_cr?: string | null
          lessor_id_number?: string | null
          lessor_name?: string | null
          notes?: string | null
          notice_period_days?: number | null
          office_id: string
          operating_fees?: number | null
          property_id?: string
          renewed_from_id?: string | null
          rent_amount?: number
          service_fees?: number
          service_fees_breakdown?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          vat_inclusive?: boolean | null
          vat_percentage?: number | null
        }
        Update: {
          alert_thresholds_days?: number[]
          annual_increase_pct?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          auto_renew?: boolean
          company_id?: string
          contract_name?: string | null
          contract_number?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          deposit_notes?: string | null
          deposit_refund_amount?: number | null
          deposit_refund_date?: string | null
          deposit_status?: Database["public"]["Enums"]["deposit_status"] | null
          discount_amount?: number | null
          discount_notes?: string | null
          end_date?: string
          evacuation_date?: string | null
          id?: string
          lessor_cr?: string | null
          lessor_id_number?: string | null
          lessor_name?: string | null
          notes?: string | null
          notice_period_days?: number | null
          office_id?: string
          operating_fees?: number | null
          property_id?: string
          renewed_from_id?: string | null
          rent_amount?: number
          service_fees?: number
          service_fees_breakdown?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          vat_inclusive?: boolean | null
          vat_percentage?: number | null
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
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
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
          property_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          property_id: string
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
          property_id?: string
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
          property_id?: string
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
          {
            foreignKeyName: "electricity_meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      elevator_contract_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          elevator_contract_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          attachment_type: string
          created_at?: string
          elevator_contract_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          attachment_type?: string
          created_at?: string
          elevator_contract_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elevator_contract_attachments_elevator_contract_id_fkey"
            columns: ["elevator_contract_id"]
            isOneToOne: false
            referencedRelation: "elevator_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      elevator_contracts: {
        Row: {
          alert_thresholds_days: number[] | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          contract_name: string
          contract_number: string | null
          contract_type: string
          contract_value: number | null
          covered_elevator_ids: string[] | null
          created_at: string
          created_by: string | null
          duration_months: number | null
          end_date: string | null
          first_party_name: string | null
          id: string
          includes_corrective: boolean | null
          includes_emergency: boolean | null
          includes_preventive: boolean | null
          notes: string | null
          notice_period_days: number | null
          payment_frequency: string | null
          payment_method: string | null
          pm_frequency: string | null
          property_id: string
          sla_critical_response_hours: number | null
          sla_normal_response_hours: number | null
          spare_parts_included: boolean | null
          spare_parts_notes: string | null
          start_date: string | null
          status: string
          tax_included: boolean | null
          tax_percentage: number | null
          updated_at: string
          vendor_contact_name: string | null
          vendor_cr: string | null
          vendor_email: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_phone: string | null
          vendor_tax_number: string | null
        }
        Insert: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          contract_name: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          covered_elevator_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          first_party_name?: string | null
          id?: string
          includes_corrective?: boolean | null
          includes_emergency?: boolean | null
          includes_preventive?: boolean | null
          notes?: string | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          payment_method?: string | null
          pm_frequency?: string | null
          property_id: string
          sla_critical_response_hours?: number | null
          sla_normal_response_hours?: number | null
          spare_parts_included?: boolean | null
          spare_parts_notes?: string | null
          start_date?: string | null
          status?: string
          tax_included?: boolean | null
          tax_percentage?: number | null
          updated_at?: string
          vendor_contact_name?: string | null
          vendor_cr?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_tax_number?: string | null
        }
        Update: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          contract_name?: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          covered_elevator_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          first_party_name?: string | null
          id?: string
          includes_corrective?: boolean | null
          includes_emergency?: boolean | null
          includes_preventive?: boolean | null
          notes?: string | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          payment_method?: string | null
          pm_frequency?: string | null
          property_id?: string
          sla_critical_response_hours?: number | null
          sla_normal_response_hours?: number | null
          spare_parts_included?: boolean | null
          spare_parts_notes?: string | null
          start_date?: string | null
          status?: string
          tax_included?: boolean | null
          tax_percentage?: number | null
          updated_at?: string
          vendor_contact_name?: string | null
          vendor_cr?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          vendor_tax_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elevator_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elevator_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          description: string | null
          employee_id: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          role_on_entity: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          description?: string | null
          employee_id: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          role_on_entity?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          role_on_entity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_departments: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      employee_employers: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          department: string | null
          employer: string
          full_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          mobile: string | null
          national_id: string | null
          nationality: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          employer: string
          full_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          mobile?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          employer?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          mobile?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_attachments: {
        Row: {
          created_at: string
          created_by: string | null
          expense_id: string
          file_name: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expense_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expense_id?: string
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
            foreignKeyName: "expense_attachments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          asset_id: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          expense_number: string | null
          id: string
          invoice_attachment_url: string | null
          maintenance_request_id: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          property_id: string
          rejection_reason: string | null
          space_id: string | null
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          asset_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          expense_number?: string | null
          id?: string
          invoice_attachment_url?: string | null
          maintenance_request_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          property_id?: string
          rejection_reason?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          asset_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_number?: string | null
          id?: string
          invoice_attachment_url?: string | null
          maintenance_request_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          property_id?: string
          rejection_reason?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      fire_contract_attachments: {
        Row: {
          category: string | null
          contract_id: string
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          contract_id: string
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          contract_id?: string
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fire_contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "fire_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      fire_contracts: {
        Row: {
          alert_thresholds_days: number[] | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          certification_expiry_date: string | null
          commercial_register: string | null
          company_name: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contract_name: string
          contract_number: string | null
          contract_type: string
          contract_value: number | null
          covered_asset_ids: string[] | null
          covers_alarm_panels: boolean
          covers_extinguishers: boolean
          covers_fire_cabinets: boolean
          covers_fire_hoses: boolean
          covers_fire_pumps: boolean
          covers_smoke_detectors: boolean
          covers_sprinklers: boolean
          created_at: string
          created_by: string | null
          duration_months: number | null
          end_date: string | null
          first_party: string | null
          id: string
          includes_certification_reports: boolean
          includes_corrective: boolean
          includes_periodic_tests: boolean
          includes_preventive: boolean
          includes_spare_parts: boolean
          notes: string | null
          payment_frequency: string | null
          preventive_frequency: string | null
          property_id: string | null
          resolution_time_hours: number | null
          response_time_hours: number | null
          start_date: string | null
          status: string
          tax_included: boolean
          tax_number: string | null
          tax_rate: number | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          certification_expiry_date?: string | null
          commercial_register?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_name: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          covered_asset_ids?: string[] | null
          covers_alarm_panels?: boolean
          covers_extinguishers?: boolean
          covers_fire_cabinets?: boolean
          covers_fire_hoses?: boolean
          covers_fire_pumps?: boolean
          covers_smoke_detectors?: boolean
          covers_sprinklers?: boolean
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          first_party?: string | null
          id?: string
          includes_certification_reports?: boolean
          includes_corrective?: boolean
          includes_periodic_tests?: boolean
          includes_preventive?: boolean
          includes_spare_parts?: boolean
          notes?: string | null
          payment_frequency?: string | null
          preventive_frequency?: string | null
          property_id?: string | null
          resolution_time_hours?: number | null
          response_time_hours?: number | null
          start_date?: string | null
          status?: string
          tax_included?: boolean
          tax_number?: string | null
          tax_rate?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          certification_expiry_date?: string | null
          commercial_register?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_name?: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          covered_asset_ids?: string[] | null
          covers_alarm_panels?: boolean
          covers_extinguishers?: boolean
          covers_fire_cabinets?: boolean
          covers_fire_hoses?: boolean
          covers_fire_pumps?: boolean
          covers_smoke_detectors?: boolean
          covers_sprinklers?: boolean
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          first_party?: string | null
          id?: string
          includes_certification_reports?: boolean
          includes_corrective?: boolean
          includes_periodic_tests?: boolean
          includes_preventive?: boolean
          includes_spare_parts?: boolean
          notes?: string | null
          payment_frequency?: string | null
          preventive_frequency?: string | null
          property_id?: string | null
          resolution_time_hours?: number | null
          response_time_hours?: number | null
          start_date?: string | null
          status?: string
          tax_included?: boolean
          tax_number?: string | null
          tax_rate?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fire_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fire_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          archived_at: string | null
          archived_by: string | null
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
          property_id: string
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
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
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
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          salary?: number | null
          security_company?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_date?: string | null
          updated_at?: string
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guards_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          property_id: string
          template_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          frequency: Database["public"]["Enums"]["inspection_frequency"]
          id?: string
          items?: Json
          property_id?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          frequency?: Database["public"]["Enums"]["inspection_frequency"]
          id?: string
          items?: Json
          property_id?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_templates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          property_id: string
          space_id: string | null
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
          property_id?: string
          space_id?: string | null
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
          property_id?: string
          space_id?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
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
          property_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
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
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_request_attachments: {
        Row: {
          attachment_kind: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          request_id: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          attachment_kind?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          request_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          attachment_kind?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          request_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          after_photo_url: string | null
          approved_at: string | null
          approved_by: string | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          asset_id: string | null
          assigned_technician: string | null
          assigned_vendor_id: string | null
          before_photo_url: string | null
          closed_at: string | null
          closed_by: string | null
          completed_at: string | null
          completion_due_at: string | null
          cost: number | null
          created_at: string
          description: string | null
          hold_reason: string | null
          id: string
          inspection_id: string | null
          is_overdue: boolean
          labor_cost: number
          labor_hours: number | null
          location: string | null
          materials_used: Json
          notes: string | null
          office_id: string | null
          parts_cost: number
          pm_plan_id: string | null
          priority: Database["public"]["Enums"]["wo_priority"]
          property_id: string
          reported_by: string | null
          reporter_name: string | null
          request_date: string
          request_number: string | null
          request_source:
            | Database["public"]["Enums"]["wo_request_source"]
            | null
          request_type: string | null
          responded_at: string | null
          response_due_at: string | null
          sla_completion_hours: number | null
          sla_response_hours: number | null
          space_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["maintenance_request_status"]
          updated_at: string
          work_order_type: Database["public"]["Enums"]["work_order_type"]
        }
        Insert: {
          after_photo_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          asset_id?: string | null
          assigned_technician?: string | null
          assigned_vendor_id?: string | null
          before_photo_url?: string | null
          closed_at?: string | null
          closed_by?: string | null
          completed_at?: string | null
          completion_due_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          hold_reason?: string | null
          id?: string
          inspection_id?: string | null
          is_overdue?: boolean
          labor_cost?: number
          labor_hours?: number | null
          location?: string | null
          materials_used?: Json
          notes?: string | null
          office_id?: string | null
          parts_cost?: number
          pm_plan_id?: string | null
          priority?: Database["public"]["Enums"]["wo_priority"]
          property_id?: string
          reported_by?: string | null
          reporter_name?: string | null
          request_date?: string
          request_number?: string | null
          request_source?:
            | Database["public"]["Enums"]["wo_request_source"]
            | null
          request_type?: string | null
          responded_at?: string | null
          response_due_at?: string | null
          sla_completion_hours?: number | null
          sla_response_hours?: number | null
          space_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          updated_at?: string
          work_order_type?: Database["public"]["Enums"]["work_order_type"]
        }
        Update: {
          after_photo_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          asset_id?: string | null
          assigned_technician?: string | null
          assigned_vendor_id?: string | null
          before_photo_url?: string | null
          closed_at?: string | null
          closed_by?: string | null
          completed_at?: string | null
          completion_due_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          hold_reason?: string | null
          id?: string
          inspection_id?: string | null
          is_overdue?: boolean
          labor_cost?: number
          labor_hours?: number | null
          location?: string | null
          materials_used?: Json
          notes?: string | null
          office_id?: string | null
          parts_cost?: number
          pm_plan_id?: string | null
          priority?: Database["public"]["Enums"]["wo_priority"]
          property_id?: string
          reported_by?: string | null
          reporter_name?: string | null
          request_date?: string
          request_number?: string | null
          request_source?:
            | Database["public"]["Enums"]["wo_request_source"]
            | null
          request_type?: string | null
          responded_at?: string | null
          response_due_at?: string | null
          sla_completion_hours?: number | null
          sla_response_hours?: number | null
          space_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          updated_at?: string
          work_order_type?: Database["public"]["Enums"]["work_order_type"]
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
            foreignKeyName: "maintenance_requests_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
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
          property_id: string
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
          property_id?: string
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
          property_id?: string
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
          {
            foreignKeyName: "network_points_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          dedupe_key: string | null
          dismissed_at: string | null
          entity_id: string | null
          entity_type: string | null
          escalated_at: string | null
          escalated_from: string | null
          group_key: string | null
          id: string
          is_read: boolean
          link: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          dedupe_key?: string | null
          dismissed_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          escalated_at?: string | null
          escalated_from?: string | null
          group_key?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          dedupe_key?: string | null
          dismissed_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          escalated_at?: string | null
          escalated_from?: string | null
          group_key?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          priority?: Database["public"]["Enums"]["notification_priority"]
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
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
          property_id: string
          space_id: string | null
          status: Database["public"]["Enums"]["office_status"]
          updated_at: string
          view_type: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          space_id?: string | null
          status?: Database["public"]["Enums"]["office_status"]
          updated_at?: string
          view_type?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          space_id?: string | null
          status?: Database["public"]["Enums"]["office_status"]
          updated_at?: string
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_cleaning_logs: {
        Row: {
          after_photo_url: string | null
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          camera_id: string | null
          coverage_notes: string | null
          created_at: string
          floor: string
          id: string
          location_description: string | null
          notes: string | null
          office_id: string | null
          property_id: string
          space_id: string | null
          spot_number: string
          spot_type: Database["public"]["Enums"]["parking_spot_type"]
          status: Database["public"]["Enums"]["parking_spot_status"]
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          camera_id?: string | null
          coverage_notes?: string | null
          created_at?: string
          floor: string
          id?: string
          location_description?: string | null
          notes?: string | null
          office_id?: string | null
          property_id?: string
          space_id?: string | null
          spot_number: string
          spot_type?: Database["public"]["Enums"]["parking_spot_type"]
          status?: Database["public"]["Enums"]["parking_spot_status"]
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          camera_id?: string | null
          coverage_notes?: string | null
          created_at?: string
          floor?: string
          id?: string
          location_description?: string | null
          notes?: string | null
          office_id?: string | null
          property_id?: string
          space_id?: string | null
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
          {
            foreignKeyName: "parking_spots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_spots_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_violations: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          property_id: string
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
          property_id?: string
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
          property_id?: string
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
          {
            foreignKeyName: "patrol_checkpoints_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      patrols: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          guard_id: string | null
          id: string
          notes: string | null
          patrol_number: string
          property_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          guard_id?: string | null
          id?: string
          notes?: string | null
          patrol_number: string
          property_id?: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          guard_id?: string | null
          id?: string
          notes?: string | null
          patrol_number?: string
          property_id?: string
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
          {
            foreignKeyName: "patrols_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
          property_id: string
          receipt_file_url: string | null
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
          property_id?: string
          receipt_file_url?: string | null
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
          property_id?: string
          receipt_file_url?: string | null
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
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_plans: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          asset_id: string | null
          assigned_to: string | null
          checklist_items: string[]
          created_at: string
          created_by: string | null
          default_priority: Database["public"]["Enums"]["wo_priority"]
          frequency: Database["public"]["Enums"]["pm_frequency"]
          id: string
          is_active: boolean
          last_executed_at: string | null
          next_due_at: string
          notes: string | null
          plan_name: string
          property_id: string
          space_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          asset_id?: string | null
          assigned_to?: string | null
          checklist_items?: string[]
          created_at?: string
          created_by?: string | null
          default_priority?: Database["public"]["Enums"]["wo_priority"]
          frequency: Database["public"]["Enums"]["pm_frequency"]
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          next_due_at?: string
          notes?: string | null
          plan_name: string
          property_id?: string
          space_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          asset_id?: string | null
          assigned_to?: string | null
          checklist_items?: string[]
          created_at?: string
          created_by?: string | null
          default_priority?: Database["public"]["Enums"]["wo_priority"]
          frequency?: Database["public"]["Enums"]["pm_frequency"]
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          next_due_at?: string
          notes?: string | null
          plan_name?: string
          property_id?: string
          space_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_plans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_plans_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
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
      properties: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          cr_number: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          management_company: string | null
          management_start_date: string | null
          name: string
          notes: string | null
          owner_name: string | null
          phone: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["property_status"]
          total_area: number | null
          total_floors: number | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          management_company?: string | null
          management_start_date?: string | null
          name: string
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          total_area?: number | null
          total_floors?: number | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          management_company?: string | null
          management_start_date?: string | null
          name?: string
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          total_area?: number | null
          total_floors?: number | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_key: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_key: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          actions_taken: string | null
          archived_at: string | null
          archived_by: string | null
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
          property_id: string
          space_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          actions_taken?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          space_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          actions_taken?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          space_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          area_sqm: number | null
          created_at: string
          created_by: string | null
          floor: number | null
          id: string
          notes: string | null
          parent_space_id: string | null
          property_id: string
          space_code: string
          space_name: string
          space_type: Database["public"]["Enums"]["space_type"]
          status: Database["public"]["Enums"]["space_status"]
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          area_sqm?: number | null
          created_at?: string
          created_by?: string | null
          floor?: number | null
          id?: string
          notes?: string | null
          parent_space_id?: string | null
          property_id?: string
          space_code: string
          space_name: string
          space_type: Database["public"]["Enums"]["space_type"]
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          area_sqm?: number | null
          created_at?: string
          created_by?: string | null
          floor?: number | null
          id?: string
          notes?: string | null
          parent_space_id?: string | null
          property_id?: string
          space_code?: string
          space_name?: string
          space_type?: Database["public"]["Enums"]["space_type"]
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_parent_space_id_fkey"
            columns: ["parent_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_contract_attachments: {
        Row: {
          attachment_type: string
          contract_id: string
          created_at: string
          file_name: string | null
          file_url: string
          id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          attachment_type?: string
          contract_id: string
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          attachment_type?: string
          contract_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "supply_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_contracts: {
        Row: {
          alert_thresholds_days: number[] | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          contract_name: string
          contract_number: string | null
          contract_type: string
          contract_value: number | null
          created_at: string
          created_by: string | null
          delivery_delay_alert_days: number | null
          duration_months: number | null
          end_date: string | null
          first_party: string | null
          id: string
          notes: string | null
          payment_frequency: string | null
          payment_method: string | null
          property_id: string | null
          start_date: string | null
          status: string
          supply_categories: string[] | null
          supply_items: Json | null
          supply_schedule: string | null
          tax_included: boolean | null
          tax_rate: number | null
          updated_at: string
          vendor_commercial_registration: string | null
          vendor_company_name: string | null
          vendor_contact_person: string | null
          vendor_email: string | null
          vendor_id: string | null
          vendor_mobile: string | null
          vendor_tax_number: string | null
        }
        Insert: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          contract_name: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          delivery_delay_alert_days?: number | null
          duration_months?: number | null
          end_date?: string | null
          first_party?: string | null
          id?: string
          notes?: string | null
          payment_frequency?: string | null
          payment_method?: string | null
          property_id?: string | null
          start_date?: string | null
          status?: string
          supply_categories?: string[] | null
          supply_items?: Json | null
          supply_schedule?: string | null
          tax_included?: boolean | null
          tax_rate?: number | null
          updated_at?: string
          vendor_commercial_registration?: string | null
          vendor_company_name?: string | null
          vendor_contact_person?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_mobile?: string | null
          vendor_tax_number?: string | null
        }
        Update: {
          alert_thresholds_days?: number[] | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          contract_name?: string
          contract_number?: string | null
          contract_type?: string
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          delivery_delay_alert_days?: number | null
          duration_months?: number | null
          end_date?: string | null
          first_party?: string | null
          id?: string
          notes?: string | null
          payment_frequency?: string | null
          payment_method?: string | null
          property_id?: string | null
          start_date?: string | null
          status?: string
          supply_categories?: string[] | null
          supply_items?: Json | null
          supply_schedule?: string | null
          tax_included?: boolean | null
          tax_rate?: number | null
          updated_at?: string
          vendor_commercial_registration?: string | null
          vendor_company_name?: string | null
          vendor_contact_person?: string | null
          vendor_email?: string | null
          vendor_id?: string | null
          vendor_mobile?: string | null
          vendor_tax_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_subscribers: {
        Row: {
          chat_id: number
          created_at: string
          enabled: boolean
          id: string
          last_seen_at: string | null
          linked_at: string
          quiet_hours: boolean
          tg_first_name: string | null
          tg_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          enabled?: boolean
          id?: string
          last_seen_at?: string | null
          linked_at?: string
          quiet_hours?: boolean
          tg_first_name?: string | null
          tg_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          enabled?: boolean
          id?: string
          last_seen_at?: string | null
          linked_at?: string
          quiet_hours?: boolean
          tg_first_name?: string | null
          tg_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
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
          property_id: string
          resolution_notes: string | null
          space_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          resolution_notes?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          property_id?: string
          resolution_notes?: string | null
          space_id?: string | null
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
          {
            foreignKeyName: "tickets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_properties: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
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
          property_id: string
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
          property_id?: string
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
          property_id?: string
          start_date?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
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
      vendor_payments: {
        Row: {
          amount: number
          attachment_url: string | null
          created_at: string
          created_by: string | null
          expense_id: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_number: string | null
          property_id: string
          reference_number: string | null
          updated_at: string
          vendor_contract_id: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string | null
          property_id?: string
          reference_number?: string | null
          updated_at?: string
          vendor_contract_id?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string | null
          property_id?: string
          reference_number?: string | null
          updated_at?: string
          vendor_contract_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
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
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
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
      visitors: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          badge_number: string | null
          check_in_at: string
          check_out_at: string | null
          company_id: string | null
          company_visiting: string | null
          created_at: string
          created_by: string | null
          expected_duration_minutes: number | null
          full_name: string
          host_name: string | null
          id: string
          id_photo_url: string | null
          national_id: string | null
          notes: string | null
          office_id: string | null
          phone: string | null
          property_id: string
          purpose: string | null
          received_by_guard_id: string | null
          space_id: string | null
          status: Database["public"]["Enums"]["visitor_status"]
          updated_at: string
          vehicle_plate: string | null
          visitor_number: string | null
          visitor_type: Database["public"]["Enums"]["visitor_type"]
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          badge_number?: string | null
          check_in_at?: string
          check_out_at?: string | null
          company_id?: string | null
          company_visiting?: string | null
          created_at?: string
          created_by?: string | null
          expected_duration_minutes?: number | null
          full_name: string
          host_name?: string | null
          id?: string
          id_photo_url?: string | null
          national_id?: string | null
          notes?: string | null
          office_id?: string | null
          phone?: string | null
          property_id?: string
          purpose?: string | null
          received_by_guard_id?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["visitor_status"]
          updated_at?: string
          vehicle_plate?: string | null
          visitor_number?: string | null
          visitor_type?: Database["public"]["Enums"]["visitor_type"]
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          badge_number?: string | null
          check_in_at?: string
          check_out_at?: string | null
          company_id?: string | null
          company_visiting?: string | null
          created_at?: string
          created_by?: string | null
          expected_duration_minutes?: number | null
          full_name?: string
          host_name?: string | null
          id?: string
          id_photo_url?: string | null
          national_id?: string | null
          notes?: string | null
          office_id?: string | null
          phone?: string | null
          property_id?: string
          purpose?: string | null
          received_by_guard_id?: string | null
          space_id?: string | null
          status?: Database["public"]["Enums"]["visitor_status"]
          updated_at?: string
          vehicle_plate?: string | null
          visitor_number?: string | null
          visitor_type?: Database["public"]["Enums"]["visitor_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visitors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_received_by_guard_id_fkey"
            columns: ["received_by_guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_received_by_guard_id_fkey"
            columns: ["received_by_guard_id"]
            isOneToOne: false
            referencedRelation: "guards_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
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
      _entity_display_name: {
        Args: { _id: string; _table: string }
        Returns: string
      }
      _is_archivable_table: { Args: { _table: string }; Returns: boolean }
      archive_record: {
        Args: { _id: string; _reason?: string; _table: string }
        Returns: undefined
      }
      can_manage_security: { Args: { _uid: string }; Returns: boolean }
      create_telegram_link_code: { Args: never; Returns: string }
      delete_record: {
        Args: { _id: string; _reason?: string; _table: string }
        Returns: undefined
      }
      escalate_critical_notifications: { Args: never; Returns: undefined }
      generate_daily_notifications: { Args: never; Returns: undefined }
      generate_due_pm_work_orders: { Args: never; Returns: number }
      get_daily_report: { Args: { _date?: string }; Returns: Json }
      get_my_permissions: { Args: never; Returns: string[] }
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_notification_groups: {
        Args: { _only_unread?: boolean }
        Returns: {
          category: Database["public"]["Enums"]["notification_category"]
          count: number
          group_key: string
          latest_body: string
          latest_created_at: string
          latest_link: string
          latest_title: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority: Database["public"]["Enums"]["notification_priority"]
          unread_count: number
        }[]
      }
      get_user_default_property: { Args: { _user_id: string }; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
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
      notify_v2: {
        Args: {
          _body: string
          _category?: Database["public"]["Enums"]["notification_category"]
          _dedupe: string
          _entity_id: string
          _entity_type: string
          _group_key?: string
          _link: string
          _priority?: Database["public"]["Enums"]["notification_priority"]
          _role: Database["public"]["Enums"]["app_role"]
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      pm_frequency_interval: {
        Args: { _f: Database["public"]["Enums"]["pm_frequency"] }
        Returns: string
      }
      recalc_invoice_status: {
        Args: { _invoice_id: string }
        Returns: undefined
      }
      recompute_wo_overdue: { Args: never; Returns: number }
      renew_contract: {
        Args: {
          _contract_id: string
          _new_end: string
          _new_rent?: number
          _new_start: string
        }
        Returns: string
      }
      restore_record: {
        Args: { _id: string; _table: string }
        Returns: undefined
      }
      user_has_property: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      verify_api_key: {
        Args: { _key: string }
        Returns: {
          key_id: string
          user_id: string
        }[]
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
      asset_current_status:
        | "يعمل"
        | "يعمل مع ملاحظات"
        | "يحتاج صيانة"
        | "تحت الصيانة"
        | "معطل"
        | "مستبدل"
        | "خارج الخدمة"
      asset_location_type: "مكتب" | "مرفق مشترك" | "البرج"
      asset_maintenance_frequency:
        | "شهري"
        | "كل 3 أشهر"
        | "كل 6 أشهر"
        | "سنوي"
        | "مدة مخصصة"
      camera_status: "تعمل" | "معطلة" | "تحت الصيانة"
      cleaning_contract_attachment_type:
        | "نسخة العقد"
        | "السجل التجاري"
        | "شهادات العمالة"
        | "التأمينات"
        | "شهادات السلامة"
        | "أخرى"
      cleaning_contract_type:
        | "عقد خدمات نظافة"
        | "عقد تشغيل نظافة متكامل"
        | "عقد توريد عمالة نظافة"
      cleaning_frequency: "يومي" | "أسبوعي" | "شهري"
      cleaning_payment_frequency: "شهري" | "ربع سنوي" | "نصف سنوي" | "سنوي"
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
        | "التفويض"
        | "السندات"
        | "الشيكات"
        | "الفواتير"
        | "الملاحق"
      contract_status:
        | "ساري"
        | "منتهي"
        | "مجدد"
        | "ملغي"
        | "مسودة"
        | "قيد المراجعة"
        | "بانتظار المستندات"
        | "بانتظار الاعتماد"
        | "موقوف"
        | "متعثر"
        | "تحت التجديد"
        | "مخلى"
      contract_type:
        | "عقد إيجار مكتب"
        | "عقد إيجار عدة مكاتب"
        | "عقد حجز"
        | "عقد تجديد"
        | "ملحق عقد"
      deposit_status: "محتجز" | "مسترد جزئياً" | "مسترد كلياً" | "مخصوم"
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
        | "مخطط"
        | "شهادة"
        | "صورة"
        | "تقرير"
        | "أمر عمل"
        | "محضر"
        | "عرض سعر"
        | "مستند قانوني"
        | "مستند مالي"
      doc_entity_type: "tenant" | "contract" | "asset" | "vendor" | "building"
      evaluation_type: "شهري" | "ربع سنوي"
      expense_category:
        | "صيانة"
        | "نظافة"
        | "أمن"
        | "كهرباء"
        | "مياه"
        | "مكتبية"
        | "مرافق"
        | "مقاولين"
        | "رواتب"
        | "تأمين"
        | "ضرائب ورسوم"
        | "أخرى"
      expense_status: "معلّق" | "معتمد" | "مرفوض" | "مدفوع"
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
        | "معلّق للتعيين"
        | "معلّق"
        | "مكتمل مبدئياً"
      materials_responsibility: "على شركة النظافة" | "على مالك البرج" | "مشتركة"
      notification_category:
        | "financial"
        | "maintenance"
        | "security"
        | "contracts"
        | "operations"
        | "general"
      notification_priority: "critical" | "high" | "medium" | "low"
      notification_type:
        | "contract_expiring"
        | "invoice_overdue"
        | "document_expiring"
        | "training_expiring"
        | "ticket_emergency"
        | "asset_critical_failure"
        | "generic"
        | "work_order_overdue"
        | "pm_due"
      office_status: "متاح" | "محجوز" | "مؤجر" | "تحت الصيانة" | "غير متاح"
      parking_check_status: "سليم" | "يحتاج صيانة"
      parking_spot_status: "متاح" | "مخصص" | "مشغول" | "صيانة"
      parking_spot_type: "عادي" | "VIP" | "ذوي احتياجات"
      parking_violation_status: "مفتوحة" | "محلولة"
      payment_method: "نقدي" | "تحويل بنكي" | "شيك"
      payment_schedule_status: "مجدول" | "مستحق" | "مدفوع" | "متأخر" | "ملغي"
      penalty_reward_type: "مخالفة" | "إنذار" | "مكافأة"
      pm_frequency: "أسبوعي" | "شهري" | "ربع سنوي" | "نصف سنوي" | "سنوي"
      property_status: "نشط" | "غير نشط" | "أرشيف"
      property_type:
        | "برج"
        | "مجمع تجاري"
        | "مركز تجاري"
        | "مدينة صناعية"
        | "مجمع إداري"
        | "مجمع سكني"
        | "عقار آخر"
      shift_type: "صباحي" | "مسائي" | "ليلي"
      space_status: "نشط" | "تحت الصيانة" | "مغلق"
      space_type:
        | "مكتب"
        | "موقف سيارة"
        | "لوبي"
        | "مكتب مدير البرج"
        | "غرفة كاميرات"
        | "مخزن"
        | "دورة مياه"
        | "ممر"
        | "مصعد"
        | "سلم"
        | "غرفة كهرباء"
        | "سطح"
        | "أخرى"
      ticket_priority: "منخفضة" | "متوسطة" | "عالية" | "طارئة"
      ticket_status: "جديد" | "جاري المعالجة" | "مغلق"
      ticket_type: "شكوى" | "صيانة" | "نظافة" | "أمن" | "استفسار"
      training_type: "أمن" | "سلامة" | "إسعافات أولية"
      visitor_status: "داخل" | "خرج" | "ملغي"
      visitor_type:
        | "زائر"
        | "مقاول"
        | "موظف توصيل"
        | "صيانة خارجية"
        | "ضيف VIP"
        | "أخرى"
      warranty_status:
        | "ساري"
        | "على وشك الانتهاء"
        | "منتهي"
        | "لا يوجد ضمان"
        | "غير معروف"
      wo_priority: "طارئة" | "عالية" | "متوسطة" | "منخفضة"
      wo_request_source:
        | "مستأجر"
        | "صيانة وقائية"
        | "جولة تفتيش"
        | "حادث أمني"
        | "إدارة"
      work_order_type: "تصحيحي" | "وقائي" | "طارئ"
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
      asset_current_status: [
        "يعمل",
        "يعمل مع ملاحظات",
        "يحتاج صيانة",
        "تحت الصيانة",
        "معطل",
        "مستبدل",
        "خارج الخدمة",
      ],
      asset_location_type: ["مكتب", "مرفق مشترك", "البرج"],
      asset_maintenance_frequency: [
        "شهري",
        "كل 3 أشهر",
        "كل 6 أشهر",
        "سنوي",
        "مدة مخصصة",
      ],
      camera_status: ["تعمل", "معطلة", "تحت الصيانة"],
      cleaning_contract_attachment_type: [
        "نسخة العقد",
        "السجل التجاري",
        "شهادات العمالة",
        "التأمينات",
        "شهادات السلامة",
        "أخرى",
      ],
      cleaning_contract_type: [
        "عقد خدمات نظافة",
        "عقد تشغيل نظافة متكامل",
        "عقد توريد عمالة نظافة",
      ],
      cleaning_frequency: ["يومي", "أسبوعي", "شهري"],
      cleaning_payment_frequency: ["شهري", "ربع سنوي", "نصف سنوي", "سنوي"],
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
        "التفويض",
        "السندات",
        "الشيكات",
        "الفواتير",
        "الملاحق",
      ],
      contract_status: [
        "ساري",
        "منتهي",
        "مجدد",
        "ملغي",
        "مسودة",
        "قيد المراجعة",
        "بانتظار المستندات",
        "بانتظار الاعتماد",
        "موقوف",
        "متعثر",
        "تحت التجديد",
        "مخلى",
      ],
      contract_type: [
        "عقد إيجار مكتب",
        "عقد إيجار عدة مكاتب",
        "عقد حجز",
        "عقد تجديد",
        "ملحق عقد",
      ],
      deposit_status: ["محتجز", "مسترد جزئياً", "مسترد كلياً", "مخصوم"],
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
        "مخطط",
        "شهادة",
        "صورة",
        "تقرير",
        "أمر عمل",
        "محضر",
        "عرض سعر",
        "مستند قانوني",
        "مستند مالي",
      ],
      doc_entity_type: ["tenant", "contract", "asset", "vendor", "building"],
      evaluation_type: ["شهري", "ربع سنوي"],
      expense_category: [
        "صيانة",
        "نظافة",
        "أمن",
        "كهرباء",
        "مياه",
        "مكتبية",
        "مرافق",
        "مقاولين",
        "رواتب",
        "تأمين",
        "ضرائب ورسوم",
        "أخرى",
      ],
      expense_status: ["معلّق", "معتمد", "مرفوض", "مدفوع"],
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
        "معلّق للتعيين",
        "معلّق",
        "مكتمل مبدئياً",
      ],
      materials_responsibility: [
        "على شركة النظافة",
        "على مالك البرج",
        "مشتركة",
      ],
      notification_category: [
        "financial",
        "maintenance",
        "security",
        "contracts",
        "operations",
        "general",
      ],
      notification_priority: ["critical", "high", "medium", "low"],
      notification_type: [
        "contract_expiring",
        "invoice_overdue",
        "document_expiring",
        "training_expiring",
        "ticket_emergency",
        "asset_critical_failure",
        "generic",
        "work_order_overdue",
        "pm_due",
      ],
      office_status: ["متاح", "محجوز", "مؤجر", "تحت الصيانة", "غير متاح"],
      parking_check_status: ["سليم", "يحتاج صيانة"],
      parking_spot_status: ["متاح", "مخصص", "مشغول", "صيانة"],
      parking_spot_type: ["عادي", "VIP", "ذوي احتياجات"],
      parking_violation_status: ["مفتوحة", "محلولة"],
      payment_method: ["نقدي", "تحويل بنكي", "شيك"],
      payment_schedule_status: ["مجدول", "مستحق", "مدفوع", "متأخر", "ملغي"],
      penalty_reward_type: ["مخالفة", "إنذار", "مكافأة"],
      pm_frequency: ["أسبوعي", "شهري", "ربع سنوي", "نصف سنوي", "سنوي"],
      property_status: ["نشط", "غير نشط", "أرشيف"],
      property_type: [
        "برج",
        "مجمع تجاري",
        "مركز تجاري",
        "مدينة صناعية",
        "مجمع إداري",
        "مجمع سكني",
        "عقار آخر",
      ],
      shift_type: ["صباحي", "مسائي", "ليلي"],
      space_status: ["نشط", "تحت الصيانة", "مغلق"],
      space_type: [
        "مكتب",
        "موقف سيارة",
        "لوبي",
        "مكتب مدير البرج",
        "غرفة كاميرات",
        "مخزن",
        "دورة مياه",
        "ممر",
        "مصعد",
        "سلم",
        "غرفة كهرباء",
        "سطح",
        "أخرى",
      ],
      ticket_priority: ["منخفضة", "متوسطة", "عالية", "طارئة"],
      ticket_status: ["جديد", "جاري المعالجة", "مغلق"],
      ticket_type: ["شكوى", "صيانة", "نظافة", "أمن", "استفسار"],
      training_type: ["أمن", "سلامة", "إسعافات أولية"],
      visitor_status: ["داخل", "خرج", "ملغي"],
      visitor_type: [
        "زائر",
        "مقاول",
        "موظف توصيل",
        "صيانة خارجية",
        "ضيف VIP",
        "أخرى",
      ],
      warranty_status: [
        "ساري",
        "على وشك الانتهاء",
        "منتهي",
        "لا يوجد ضمان",
        "غير معروف",
      ],
      wo_priority: ["طارئة", "عالية", "متوسطة", "منخفضة"],
      wo_request_source: [
        "مستأجر",
        "صيانة وقائية",
        "جولة تفتيش",
        "حادث أمني",
        "إدارة",
      ],
      work_order_type: ["تصحيحي", "وقائي", "طارئ"],
    },
  },
} as const
