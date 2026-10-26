
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
                },"offer_sources": {
                  Row: {
                    "corrections": NonNullable<Json>,"extracted_fields": NonNullable<Json>,"offer_id": string,"shop_id": string,"storage_path": string | null,"transcript": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "corrections"?: NonNullable<Json>,"extracted_fields"?: NonNullable<Json>,"offer_id": string,"shop_id": string,"storage_path"?: string | null,"transcript"?: string | null
                  }
                  Update: {
                    "corrections"?: NonNullable<Json>,"extracted_fields"?: NonNullable<Json>,"offer_id"?: string,"shop_id"?: string,"storage_path"?: string | null,"transcript"?: string | null
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
                    "approved_at": string | null,"approved_by": string | null,"created_at": string,"created_by": string,"currency": string,"description": string,"expires_at": string | null,"id": string,"moderation_status": string,"price_minor": number | null,"quantity": number | null,"shop_id": string,"source_type": string,"starts_at": string | null,"status": string,"title": string,"unit": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: string,"description"?: string,"expires_at"?: string | null,"id"?: string,"moderation_status"?: string,"price_minor"?: number | null,"quantity"?: number | null,"shop_id": string,"source_type"?: string,"starts_at"?: string | null,"status"?: string,"title": string,"unit"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: string,"description"?: string,"expires_at"?: string | null,"id"?: string,"moderation_status"?: string,"price_minor"?: number | null,"quantity"?: number | null,"shop_id"?: string,"source_type"?: string,"starts_at"?: string | null,"status"?: string,"title"?: string,"unit"?: string | null,"updated_at"?: string
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
                    "address": string,"category": string,"created_at": string,"description": string,"id": string,"name": string,"neighborhood": string,"slug": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"category": string,"created_at"?: string,"description"?: string,"id"?: string,"name": string,"neighborhood": string,"slug": string,"visibility"?: string
                  }
                  Update: {
                    "address"?: string,"category"?: string,"created_at"?: string,"description"?: string,"id"?: string,"name"?: string,"neighborhood"?: string,"slug"?: string,"visibility"?: string
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
            "current_user_is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
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
