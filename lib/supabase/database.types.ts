
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"details": NonNullable<Json>,"entity_id": string,"id": number,"occurred_at": string,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"details": NonNullable<Json>,"entity_id": string,"id"?: never,"occurred_at"?: string,"shop_id": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"details"?: NonNullable<Json>,"entity_id"?: string,"id"?: never,"occurred_at"?: string,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_events_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"offer_reports": {
                  Row: {
                    "created_at": string,"id": string,"offer_id": string,"reason": string,"reviewed_at": string | null,"reviewed_by": string | null,"shop_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"offer_id": string,"reason": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"shop_id": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"offer_id"?: string,"reason"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"shop_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "offer_reports_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "offers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offer_reports_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "public_offers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offer_reports_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offer_reports_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"offer_sources": {
                  Row: {
                    "corrections": NonNullable<Json>,"extracted_fields": NonNullable<Json>,"offer_id": string,"retained_until": string,"shop_id": string,"storage_path": string | null,"transcript": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "corrections"?: NonNullable<Json>,"extracted_fields"?: NonNullable<Json>,"offer_id": string,"retained_until"?: string,"shop_id": string,"storage_path"?: string | null,"transcript"?: string | null
                  }
                  Update: {
                    "corrections"?: NonNullable<Json>,"extracted_fields"?: NonNullable<Json>,"offer_id"?: string,"retained_until"?: string,"shop_id"?: string,"storage_path"?: string | null,"transcript"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "offer_sources_offer_id_shop_id_fkey"
      columns: ["offer_id","shop_id"]
isOneToOne: false
      referencedRelation: "offers"
      referencedColumns: ["id","shop_id"]
    },{
      foreignKeyName: "offer_sources_offer_id_shop_id_fkey"
      columns: ["offer_id","shop_id"]
isOneToOne: false
      referencedRelation: "public_offers"
      referencedColumns: ["id","shop_id"]
    }
                  ]
                },"offers": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"created_at": string,"created_by": string,"currency": string,"description": string,"expires_at": string | null,"id": string,"moderation_status": string,"price_minor": number | null,"quantity": number | null,"shop_id": string,"source_type": string,"starts_at": string | null,"status": string,"title": string,"unit": string | null,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: string,"description"?: string,"expires_at"?: string | null,"id"?: string,"moderation_status"?: string,"price_minor"?: number | null,"quantity"?: number | null,"shop_id": string,"source_type"?: string,"starts_at"?: string | null,"status"?: string,"title": string,"unit"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: string,"description"?: string,"expires_at"?: string | null,"id"?: string,"moderation_status"?: string,"price_minor"?: number | null,"quantity"?: number | null,"shop_id"?: string,"source_type"?: string,"starts_at"?: string | null,"status"?: string,"title"?: string,"unit"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "offers_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"owner_shop_requests": {
                  Row: {
                    "address": string,"category": string,"description": string,"id": string,"name": string,"neighborhood": string,"reviewed_at": string | null,"reviewed_by": string | null,"shop_id": string | null,"status": string,"submitted_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"category": string,"description"?: string,"id": string,"name": string,"neighborhood": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"shop_id"?: string | null,"status"?: string,"submitted_at"?: string,"user_id": string
                  }
                  Update: {
                    "address"?: string,"category"?: string,"description"?: string,"id"?: string,"name"?: string,"neighborhood"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"shop_id"?: string | null,"status"?: string,"submitted_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "owner_shop_requests_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: true
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "owner_shop_requests_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: true
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_daily_metrics": {
                  Row: {
                    "day": string,"page_views": number,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day"?: string,"page_views"?: number,"shop_id": string
                  }
                  Update: {
                    "day"?: string,"page_views"?: number,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_daily_metrics_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shop_daily_metrics_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_memberships": {
                  Row: {
                    "role": string,"shop_id": string,"user_id": string,"verified_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "role": string,"shop_id": string,"user_id": string,"verified_at": string
                  }
                  Update: {
                    "role"?: string,"shop_id"?: string,"user_id"?: string,"verified_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_memberships_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shop_memberships_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shops": {
                  Row: {
                    "address": string,"category": string,"created_at": string,"description": string,"id": string,"location": unknown,"name": string,"neighborhood": string,"profile_version": number,"slug": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"category": string,"created_at"?: string,"description"?: string,"id"?: string,"location"?: unknown,"name": string,"neighborhood": string,"profile_version"?: number,"slug": string,"visibility"?: string
                  }
                  Update: {
                    "address"?: string,"category"?: string,"created_at"?: string,"description"?: string,"id"?: string,"location"?: unknown,"name"?: string,"neighborhood"?: string,"profile_version"?: number,"slug"?: string,"visibility"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "public_offers": {
                  Row: {
                    "currency": string,"description": string,"expires_at": string | null,"id": string,"price_minor": number | null,"quantity": number | null,"shop_id": string,"starts_at": string | null,"title": string,"unit": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "offers_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "public_shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"public_shops": {
                  Row: {
                    "address": string,"category": string,"description": string,"id": string,"name": string,"neighborhood": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                           "address"?: string | null,"category"?: string | null,"description"?: string | null,"id"?: string | null,"name"?: string | null,"neighborhood"?: string | null,"slug"?: string | null
                         }
                        Update: {
                           "address"?: string | null,"category"?: string | null,"description"?: string | null,"id"?: string | null,"name"?: string | null,"neighborhood"?: string | null,"slug"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "admin_save_shop":
{ Args: { "p_expected_version": number,"p_owner_lookup"?: string,"p_payload": Json,"p_request_id"?: string,"p_shop_id": string,"p_verification_method"?: string,"p_verified"?: boolean }; Returns: string
                           },
"admin_shop_details":
{ Args: { "p_shop_id": string }; Returns: {
              "address": string,"category": string,"description": string,"id": string,"latitude": number,"longitude": number,"name": string,"neighborhood": string,"profile_version": number,"slug": string,"visibility": string
            }[]
                           },
"begin_ai_request":
{ Args: { "p_offer_id": string,"p_request_id": string,"p_shop_id": string }; Returns: string
                           },
"complete_ai_draft":
{ Args: { "p_extracted": Json,"p_payload": Json,"p_request_id": string,"p_storage_path"?: string,"p_transcript": string }; Returns: string
                           },
"current_user_is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"discover_shops":
{ Args: { "p_lat"?: number,"p_limit"?: number,"p_lon"?: number,"p_neighborhood"?: string,"p_radius_m"?: number }; Returns: {
              "address": string,"category": string,"distance_m": number,"id": string,"name": string,"neighborhood": string,"slug": string
            }[]
                           },
"fail_ai_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"moderate_content":
{ Args: { "p_hidden": boolean,"p_id": string,"p_kind": string,"p_reason": string }; Returns: undefined
                           },
"publish_offer":
{ Args: { "p_expected_version": number,"p_offer_id": string,"p_request_id": string }; Returns: string
                           },
"record_shop_view":
{ Args: { "p_rate_key": string,"p_shop_id": string }; Returns: boolean
                           },
"review_offer_report":
{ Args: { "p_id": string,"p_status": string }; Returns: undefined
                           },
"review_owner_shop_request":
{ Args: { "p_approve": boolean,"p_method"?: string,"p_request_id": string,"p_slug"?: string,"p_verified"?: boolean }; Returns: string
                           },
"run_private_maintenance":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"save_offer_draft":
{ Args: { "p_expected_version": number,"p_offer_id": string,"p_payload": Json,"p_request_id": string,"p_shop_id": string }; Returns: string
                           },
"submit_offer_report":
{ Args: { "p_offer_id": string,"p_rate_key": string,"p_reason": string }; Returns: string
                           },
"submit_owner_shop_request":
{ Args: { "p_payload": Json,"p_request_id": string }; Returns: string
                           },
"withdraw_offer":
{ Args: { "p_expected_version": number,"p_offer_id": string,"p_request_id": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
