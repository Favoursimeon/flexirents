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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          provider_id: string
          provider_response: string | null
          requested_date: string
          requested_hours: number
          requested_time: string
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          provider_id: string
          provider_response?: string | null
          requested_date: string
          requested_hours?: number
          requested_time: string
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          provider_id?: string
          provider_response?: string | null
          requested_date?: string
          requested_hours?: number
          requested_time?: string
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "approved_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          id: string
          notes: string | null
          service_provider_id: string
          service_type: string
          status: string
          total_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          id?: string
          notes?: string | null
          service_provider_id: string
          service_type: string
          status?: string
          total_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_provider_id?: string
          service_type?: string
          status?: string
          total_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "approved_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_projects: {
        Row: {
          budget_ghs: number
          client_id: string | null
          created_at: string
          current_phase: number
          current_phase_name: string
          current_phase_percent: number
          estimated_completion: string | null
          id: string
          is_public: boolean
          location: string
          name: string
          neighbourhood: string
          overall_percent: number
          public_description: string | null
          spent_ghs: number
          start_date: string | null
          status: string
          total_phases: number
          type: string
          updated_at: string
        }
        Insert: {
          budget_ghs?: number
          client_id?: string | null
          created_at?: string
          current_phase?: number
          current_phase_name?: string
          current_phase_percent?: number
          estimated_completion?: string | null
          id?: string
          is_public?: boolean
          location: string
          name: string
          neighbourhood?: string
          overall_percent?: number
          public_description?: string | null
          spent_ghs?: number
          start_date?: string | null
          status?: string
          total_phases?: number
          type?: string
          updated_at?: string
        }
        Update: {
          budget_ghs?: number
          client_id?: string | null
          created_at?: string
          current_phase?: number
          current_phase_name?: string
          current_phase_percent?: number
          estimated_completion?: string | null
          id?: string
          is_public?: boolean
          location?: string
          name?: string
          neighbourhood?: string
          overall_percent?: number
          public_description?: string | null
          spent_ghs?: number
          start_date?: string | null
          status?: string
          total_phases?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          created_at: string | null
          currency_code: string
          currency_name: string
          currency_symbol: string
          id: string
          rate_to_usd: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code: string
          currency_name: string
          currency_symbol: string
          id?: string
          rate_to_usd: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          currency_name?: string
          currency_symbol?: string
          id?: string
          rate_to_usd?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      document_folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          access_count: number
          accessed_at: string | null
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          permission: string
          share_token: string
          share_type: string
          shared_by: string
          shared_with_email: string | null
          updated_at: string
        }
        Insert: {
          access_count?: number
          accessed_at?: string | null
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          permission?: string
          share_token?: string
          share_type?: string
          shared_by: string
          shared_with_email?: string | null
          updated_at?: string
        }
        Update: {
          access_count?: number
          accessed_at?: string | null
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          permission?: string
          share_token?: string
          share_type?: string
          shared_by?: string
          shared_with_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          created_by: string
          document_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_current: boolean
          notes: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          document_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_current?: boolean
          notes?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          document_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_current?: boolean
          notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          folder: string | null
          id: string
          lease_id: string | null
          owner_id: string
          property_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          folder?: string | null
          id?: string
          lease_id?: string | null
          owner_id: string
          property_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          folder?: string | null
          id?: string
          lease_id?: string | null
          owner_id?: string
          property_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "rental_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_assessments: {
        Row: {
          affordability_score: number | null
          bank_statement_url: string | null
          bank_verified: boolean | null
          behaviour_score: number | null
          created_at: string
          employer_tier: string | null
          employment_duration_months: number | null
          employment_score: number | null
          employment_verified: boolean | null
          frozen_at: string | null
          gov_id_verified: boolean | null
          guarantor_credibility: string | null
          guarantor_evidence_url: string | null
          has_prior_flexirent_history: boolean | null
          id: string
          income_category: string | null
          income_score: number | null
          income_source: string | null
          is_overridden: boolean | null
          mobile_money_consistency: boolean | null
          monthly_net_income: number | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          override_tier: string | null
          payment_behaviour: string | null
          previous_flexirent_repayment: boolean | null
          rent_burden_score: number | null
          rent_dispute_history: boolean | null
          score_frozen: boolean | null
          social_support_evidence_url: string | null
          social_support_score: number | null
          social_support_type: string | null
          target_rent: number | null
          tier: string | null
          total_score: number | null
          updated_at: string
          user_id: string
          verification_score: number | null
        }
        Insert: {
          affordability_score?: number | null
          bank_statement_url?: string | null
          bank_verified?: boolean | null
          behaviour_score?: number | null
          created_at?: string
          employer_tier?: string | null
          employment_duration_months?: number | null
          employment_score?: number | null
          employment_verified?: boolean | null
          frozen_at?: string | null
          gov_id_verified?: boolean | null
          guarantor_credibility?: string | null
          guarantor_evidence_url?: string | null
          has_prior_flexirent_history?: boolean | null
          id?: string
          income_category?: string | null
          income_score?: number | null
          income_source?: string | null
          is_overridden?: boolean | null
          mobile_money_consistency?: boolean | null
          monthly_net_income?: number | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          override_tier?: string | null
          payment_behaviour?: string | null
          previous_flexirent_repayment?: boolean | null
          rent_burden_score?: number | null
          rent_dispute_history?: boolean | null
          score_frozen?: boolean | null
          social_support_evidence_url?: string | null
          social_support_score?: number | null
          social_support_type?: string | null
          target_rent?: number | null
          tier?: string | null
          total_score?: number | null
          updated_at?: string
          user_id: string
          verification_score?: number | null
        }
        Update: {
          affordability_score?: number | null
          bank_statement_url?: string | null
          bank_verified?: boolean | null
          behaviour_score?: number | null
          created_at?: string
          employer_tier?: string | null
          employment_duration_months?: number | null
          employment_score?: number | null
          employment_verified?: boolean | null
          frozen_at?: string | null
          gov_id_verified?: boolean | null
          guarantor_credibility?: string | null
          guarantor_evidence_url?: string | null
          has_prior_flexirent_history?: boolean | null
          id?: string
          income_category?: string | null
          income_score?: number | null
          income_source?: string | null
          is_overridden?: boolean | null
          mobile_money_consistency?: boolean | null
          monthly_net_income?: number | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          override_tier?: string | null
          payment_behaviour?: string | null
          previous_flexirent_repayment?: boolean | null
          rent_burden_score?: number | null
          rent_dispute_history?: boolean | null
          score_frozen?: boolean | null
          social_support_evidence_url?: string | null
          social_support_score?: number | null
          social_support_type?: string | null
          target_rent?: number | null
          tier?: string | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
          verification_score?: number | null
        }
        Relationships: []
      }
      flexi_score_history: {
        Row: {
          created_at: string
          id: string
          income_stability_score: number | null
          payment_behaviour_score: number | null
          recorded_at: string
          rent_burden_score: number | null
          social_support_score: number | null
          tier: string | null
          total_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          income_stability_score?: number | null
          payment_behaviour_score?: number | null
          recorded_at?: string
          rent_burden_score?: number | null
          social_support_score?: number | null
          tier?: string | null
          total_score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          income_stability_score?: number | null
          payment_behaviour_score?: number | null
          recorded_at?: string
          rent_burden_score?: number | null
          social_support_score?: number | null
          tier?: string | null
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message_text: string
          read: boolean
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message_text: string
          read?: boolean
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message_text?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          status: string
          subscribed_at: string
          updated_at: string
        }
        Insert: {
          email: string
          id?: string
          status?: string
          subscribed_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          id?: string
          status?: string
          subscribed_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          ended_at: string | null
          id: string
          page_path: string
          session_id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          page_path: string
          session_id: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          page_path?: string
          session_id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          bank_name: string
          created_at: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          paystack_authorization_code: string | null
          paystack_recipient_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          bank_name: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          paystack_authorization_code?: string | null
          paystack_recipient_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          paystack_authorization_code?: string | null
          paystack_recipient_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phase_experts: {
        Row: {
          assigned_by: string
          created_at: string
          expert_id: string
          id: string
          phase_id: string
        }
        Insert: {
          assigned_by?: string
          created_at?: string
          expert_id: string
          id?: string
          phase_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          expert_id?: string
          id?: string
          phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_experts_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "project_experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_experts_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_featured: boolean
          provider_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_featured?: boolean
          provider_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean
          provider_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "approved_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_automation_events: {
        Row: {
          client_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json
          project_id: string | null
          rule_id: string | null
          success: boolean
          timestamp: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          rule_id?: string | null
          success?: boolean
          timestamp?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          rule_id?: string | null
          success?: boolean
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_automation_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_automation_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_automation_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "project_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      project_automation_rules: {
        Row: {
          category: string
          created_at: string
          description: string
          enabled: boolean
          fire_count: number
          id: string
          last_fired_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          enabled?: boolean
          fire_count?: number
          id?: string
          last_fired_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          enabled?: boolean
          fire_count?: number
          id?: string
          last_fired_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_clients: {
        Row: {
          client_type: string
          country: string
          created_at: string
          email: string
          flag: string
          id: string
          location: string
          name: string
          payment_status: string
          portal_active: boolean
          satisfaction_rating: number | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          client_type?: string
          country?: string
          created_at?: string
          email: string
          flag?: string
          id?: string
          location?: string
          name: string
          payment_status?: string
          portal_active?: boolean
          satisfaction_rating?: number | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          client_type?: string
          country?: string
          created_at?: string
          email?: string
          flag?: string
          id?: string
          location?: string
          name?: string
          payment_status?: string
          portal_active?: boolean
          satisfaction_rating?: number | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          auto_generated: boolean
          client_id: string | null
          created_at: string
          id: string
          name: string
          project_id: string
          size_kb: number
          type: string
          uploaded_at: string
          url: string
        }
        Insert: {
          auto_generated?: boolean
          client_id?: string | null
          created_at?: string
          id?: string
          name: string
          project_id: string
          size_kb?: number
          type?: string
          uploaded_at?: string
          url?: string
        }
        Update: {
          auto_generated?: boolean
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          size_kb?: number
          type?: string
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_experts: {
        Row: {
          created_at: string
          id: string
          name: string
          phase_group: string
          required: boolean
          role: string
          unit_types: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phase_group?: string
          required?: boolean
          role: string
          unit_types?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phase_group?: string
          required?: boolean
          role?: string
          unit_types?: string[]
        }
        Relationships: []
      }
      project_payments: {
        Row: {
          amount_ghs: number
          client_id: string | null
          created_at: string
          id: string
          invoice_sent_date: string | null
          paid_date: string | null
          paid_via: string | null
          payment_trigger: string | null
          phase_name: string
          project_id: string
          receipt_auto_generated: boolean
          receipt_sent_date: string | null
          status: string
          tranche_number: number
          updated_at: string
        }
        Insert: {
          amount_ghs?: number
          client_id?: string | null
          created_at?: string
          id?: string
          invoice_sent_date?: string | null
          paid_date?: string | null
          paid_via?: string | null
          payment_trigger?: string | null
          phase_name?: string
          project_id: string
          receipt_auto_generated?: boolean
          receipt_sent_date?: string | null
          status?: string
          tranche_number?: number
          updated_at?: string
        }
        Update: {
          amount_ghs?: number
          client_id?: string | null
          created_at?: string
          id?: string
          invoice_sent_date?: string | null
          paid_date?: string | null
          paid_via?: string | null
          payment_trigger?: string | null
          phase_name?: string
          project_id?: string
          receipt_auto_generated?: boolean
          receipt_sent_date?: string | null
          status?: string
          tranche_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          budget_ghs: number
          completion_date: string | null
          created_at: string
          id: string
          invoice_auto_generated: boolean
          name: string
          number: number
          payment_trigger: string | null
          percent_complete: number
          project_id: string
          sign_off_date: string | null
          signed_off_by: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_ghs?: number
          completion_date?: string | null
          created_at?: string
          id?: string
          invoice_auto_generated?: boolean
          name: string
          number: number
          payment_trigger?: string | null
          percent_complete?: number
          project_id: string
          sign_off_date?: string | null
          signed_off_by?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_ghs?: number
          completion_date?: string | null
          created_at?: string
          id?: string
          invoice_auto_generated?: boolean
          name?: string
          number?: number
          payment_trigger?: string | null
          percent_complete?: number
          project_id?: string
          sign_off_date?: string | null
          signed_off_by?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risks: {
        Row: {
          auto_alert_enabled: boolean
          created_at: string
          description: string
          id: string
          level: string
          mitigation: string
          owner: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          auto_alert_enabled?: boolean
          created_at?: string
          description?: string
          id?: string
          level?: string
          mitigation?: string
          owner?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          auto_alert_enabled?: boolean
          created_at?: string
          description?: string
          id?: string
          level?: string
          mitigation?: string
          owner?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_site_updates: {
        Row: {
          attachment_url: string | null
          author: string
          auto_generated: boolean
          body: string
          created_at: string
          id: string
          photo_urls: string[]
          project_id: string
          timestamp: string
          title: string
          type: string
        }
        Insert: {
          attachment_url?: string | null
          author?: string
          auto_generated?: boolean
          body?: string
          created_at?: string
          id?: string
          photo_urls?: string[]
          project_id: string
          timestamp?: string
          title: string
          type?: string
        }
        Update: {
          attachment_url?: string | null
          author?: string
          auto_generated?: boolean
          body?: string
          created_at?: string
          id?: string
          photo_urls?: string[]
          project_id?: string
          timestamp?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_site_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          completion_target: string | null
          created_at: string
          design_style: string | null
          expert_selections: Json
          finishes_level: string
          id: string
          land_ownership: string
          project_name: string
          special_requirements: string | null
          status: string
          unit_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          completion_target?: string | null
          created_at?: string
          design_style?: string | null
          expert_selections?: Json
          finishes_level?: string
          id?: string
          land_ownership?: string
          project_name: string
          special_requirements?: string | null
          status?: string
          unit_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          completion_target?: string | null
          created_at?: string
          design_style?: string | null
          expert_selections?: Json
          finishes_level?: string
          id?: string
          land_ownership?: string
          project_name?: string
          special_requirements?: string | null
          status?: string
          unit_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          images: string[] | null
          lease_duration_months: number[] | null
          listing_type: string
          location: string
          owner_id: string
          price: number
          property_type: string
          region: string
          sqft: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          images?: string[] | null
          lease_duration_months?: number[] | null
          listing_type: string
          location: string
          owner_id: string
          price: number
          property_type: string
          region: string
          sqft?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          images?: string[] | null
          lease_duration_months?: number[] | null
          listing_type?: string
          location?: string
          owner_id?: string
          price?: number
          property_type?: string
          region?: string
          sqft?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_available: boolean
          provider_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_available?: boolean
          provider_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          provider_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "approved_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_payment_schedules: {
        Row: {
          amount: number
          created_at: string
          day_of_month: number | null
          end_date: string | null
          frequency: string | null
          id: string
          last_payment_date: string | null
          last_payment_status: string | null
          lease_id: string | null
          next_payment_date: string
          notes: string | null
          payment_account_id: string | null
          start_date: string
          status: string | null
          total_payments_made: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_status?: string | null
          lease_id?: string | null
          next_payment_date: string
          notes?: string | null
          payment_account_id?: string | null
          start_date: string
          status?: string | null
          total_payments_made?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_status?: string | null
          lease_id?: string | null
          next_payment_date?: string
          notes?: string | null
          payment_account_id?: string | null
          start_date?: string
          status?: string | null
          total_payments_made?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_payment_schedules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "rental_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payment_schedules_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_leases: {
        Row: {
          created_at: string
          first_payment_date: string
          id: string
          landlord_id: string
          lease_duration_months: number
          lease_start_date: string
          monthly_rent: number
          notes: string | null
          property_id: string
          rent_expiration_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_payment_date: string
          id?: string
          landlord_id: string
          lease_duration_months: number
          lease_start_date: string
          monthly_rent: number
          notes?: string | null
          property_id: string
          rent_expiration_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_payment_date?: string
          id?: string
          landlord_id?: string
          lease_duration_months?: number
          lease_start_date?: string
          monthly_rent?: number
          notes?: string | null
          property_id?: string
          rent_expiration_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          due_date: string
          id: string
          installment_number: number | null
          is_first_payment: boolean | null
          landlord_id: string | null
          lease_id: string | null
          notes: string | null
          payment_date: string | null
          payment_link: string | null
          payment_method: string | null
          payment_type: string | null
          property_id: string | null
          receipt_url: string | null
          status: string
          tenant_id: string | null
          transaction_reference: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          installment_number?: number | null
          is_first_payment?: boolean | null
          landlord_id?: string | null
          lease_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_type?: string | null
          property_id?: string | null
          receipt_url?: string | null
          status?: string
          tenant_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number | null
          is_first_payment?: boolean | null
          landlord_id?: string | null
          lease_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_type?: string | null
          property_id?: string | null
          receipt_url?: string | null
          status?: string
          tenant_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "rental_leases"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          updated_at: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          updated_at?: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          updated_at?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          rating: number
          review_text: string | null
          reviewer_user_id: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          reviewer_user_id: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_user_id?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_registrations: {
        Row: {
          availability: string
          certifications: string | null
          contact_name: string
          created_at: string
          description: string
          email: string
          hourly_rate: string
          id: string
          location: string
          phone: string
          profile_image_url: string | null
          provider_name: string
          region: string
          service_category: string
          status: string
          updated_at: string
          years_experience: number
        }
        Insert: {
          availability: string
          certifications?: string | null
          contact_name: string
          created_at?: string
          description: string
          email: string
          hourly_rate: string
          id?: string
          location: string
          phone: string
          profile_image_url?: string | null
          provider_name: string
          region: string
          service_category: string
          status?: string
          updated_at?: string
          years_experience: number
        }
        Update: {
          availability?: string
          certifications?: string | null
          contact_name?: string
          created_at?: string
          description?: string
          email?: string
          hourly_rate?: string
          id?: string
          location?: string
          phone?: string
          profile_image_url?: string | null
          provider_name?: string
          region?: string
          service_category?: string
          status?: string
          updated_at?: string
          years_experience?: number
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_enquiries_per_month: number | null
          name: string
          price_ghs: number
          slug: string
          updated_at: string
          visibility_boost: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_enquiries_per_month?: number | null
          name: string
          price_ghs: number
          slug: string
          updated_at?: string
          visibility_boost?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_enquiries_per_month?: number | null
          name?: string
          price_ghs?: number
          slug?: string
          updated_at?: string
          visibility_boost?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          listing_types: string[] | null
          locations: string[] | null
          max_bathrooms: number | null
          max_bedrooms: number | null
          max_price: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_price: number | null
          property_types: string[] | null
          regions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          listing_types?: string[] | null
          locations?: string[] | null
          max_bathrooms?: number | null
          max_bedrooms?: number | null
          max_price?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          property_types?: string[] | null
          regions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          listing_types?: string[] | null
          locations?: string[] | null
          max_bathrooms?: number | null
          max_bedrooms?: number | null
          max_price?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          property_types?: string[] | null
          regions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          plan_id: string
          provider_or_vendor_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_id: string
          provider_or_vendor_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          provider_or_vendor_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verification: {
        Row: {
          birth_city: string | null
          birth_region: string | null
          birth_street: string | null
          created_at: string
          employer_name: string | null
          employment_status: string | null
          id: string
          id_back_url: string | null
          id_front_url: string | null
          id_number: string | null
          id_type: string | null
          personal_picture_url: string | null
          proof_of_work_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_city?: string | null
          birth_region?: string | null
          birth_street?: string | null
          created_at?: string
          employer_name?: string | null
          employment_status?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          id_number?: string | null
          id_type?: string | null
          personal_picture_url?: string | null
          proof_of_work_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_city?: string | null
          birth_region?: string | null
          birth_street?: string | null
          created_at?: string
          employer_name?: string | null
          employment_status?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          id_number?: string | null
          id_type?: string | null
          personal_picture_url?: string | null
          proof_of_work_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_featured: boolean | null
          name: string
          price: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          name: string
          price?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          name?: string
          price?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "approved_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_registrations: {
        Row: {
          business_category: string
          business_name: string
          contact_name: string
          created_at: string
          description: string
          email: string
          id: string
          location: string
          phone: string
          profile_image_url: string | null
          region: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          business_category: string
          business_name: string
          contact_name: string
          created_at?: string
          description: string
          email: string
          id?: string
          location: string
          phone: string
          profile_image_url?: string | null
          region: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_category?: string
          business_name?: string
          contact_name?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          location?: string
          phone?: string
          profile_image_url?: string | null
          region?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      viewing_schedules: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          property_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_schedules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          property_id: string
          property_image: string | null
          property_location: string | null
          property_price: string | null
          property_title: string
          property_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          property_image?: string | null
          property_location?: string | null
          property_price?: string | null
          property_title: string
          property_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          property_image?: string | null
          property_location?: string | null
          property_price?: string | null
          property_title?: string
          property_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      approved_service_providers: {
        Row: {
          availability: string | null
          created_at: string | null
          description: string | null
          hourly_rate: string | null
          id: string | null
          location: string | null
          provider_name: string | null
          region: string | null
          service_category: string | null
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: string | null
          id?: string | null
          location?: string | null
          provider_name?: string | null
          region?: string | null
          service_category?: string | null
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: string | null
          id?: string | null
          location?: string | null
          provider_name?: string | null
          region?: string | null
          service_category?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      approved_vendors: {
        Row: {
          business_category: string | null
          business_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          region: string | null
          website: string | null
        }
        Insert: {
          business_category?: string | null
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          region?: string | null
          website?: string | null
        }
        Update: {
          business_category?: string | null
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          region?: string | null
          website?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_payment_schedule: {
        Args: {
          p_landlord_id: string
          p_lease_duration_months: number
          p_lease_id: string
          p_lease_start_date: string
          p_monthly_rent: number
          p_tenant_id: string
        }
        Returns: undefined
      }
      get_average_rating: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: number
      }
      get_review_count: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_email: { Args: { _email: string }; Returns: boolean }
      update_expired_leases: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "service_provider" | "vendor" | "admin" | "moderator"
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
      app_role: ["user", "service_provider", "vendor", "admin", "moderator"],
    },
  },
} as const
