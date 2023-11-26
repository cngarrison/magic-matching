export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      categories: {
        Row: {
          created_at: string
          created_by: number
          id: number
          organisation_id: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: number
          id?: number
          organisation_id: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: number
          id?: number
          organisation_id?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_organisation_id_fkey"
            columns: ["organisation_id"]
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      embeddings: {
        Row: {
          content: string | null
          created_at: string
          created_by: number
          group_id: number | null
          group_order: number | null
          id: number
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: number
          group_id?: number | null
          group_order?: number | null
          id?: number
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: number
          group_id?: number | null
          group_order?: number | null
          id?: number
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          created_at: string
          created_by: number
          id: number
          job_data: Json | null
          job_function: string | null
          organisation_id: number
          results: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: number
          id?: number
          job_data?: Json | null
          job_function?: string | null
          organisation_id: number
          results?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: number
          id?: number
          job_data?: Json | null
          job_function?: string | null
          organisation_id?: number
          results?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organisation_id_fkey"
            columns: ["organisation_id"]
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          category_id: number
          created_at: string
          created_by: number
          id: number
          message: string | null
          person_id: number
          updated_at: string | null
        }
        Insert: {
          category_id: number
          created_at?: string
          created_by: number
          id?: number
          message?: string | null
          person_id: number
          updated_at?: string | null
        }
        Update: {
          category_id?: number
          created_at?: string
          created_by?: number
          id?: number
          message?: string | null
          person_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_person_id_fkey"
            columns: ["person_id"]
            referencedRelation: "persons"
            referencedColumns: ["id"]
          }
        ]
      }
      organisation_users: {
        Row: {
          created_at: string
          is_primary_org: boolean | null
          organisation_id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          is_primary_org?: boolean | null
          organisation_id: number
          user_id: number
        }
        Update: {
          created_at?: string
          is_primary_org?: boolean | null
          organisation_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "organisation_users_organisation_fk"
            columns: ["organisation_id"]
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_users_user_fk"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      organisations: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: number
          name: string | null
          org_data: Json | null
          org_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          name?: string | null
          org_data?: Json | null
          org_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          name?: string | null
          org_data?: Json | null
          org_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      person_embeddings: {
        Row: {
          content: string | null
          created_at: string
          created_by: number
          group_id: number | null
          group_order: number | null
          id: number
          person_id: number | null
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: number
          group_id?: number | null
          group_order?: number | null
          id?: number
          person_id?: number | null
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: number
          group_id?: number | null
          group_order?: number | null
          id?: number
          person_id?: number | null
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_embeddings_person_id_fkey"
            columns: ["person_id"]
            referencedRelation: "persons"
            referencedColumns: ["id"]
          }
        ]
      }
      person_embeddings_ada_002: {
        Row: {
          content: string | null
          created_at: string
          created_by: number
          embedding: string | null
          group_id: number | null
          group_order: number | null
          id: number
          person_id: number | null
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: number
          embedding?: string | null
          group_id?: number | null
          group_order?: number | null
          id?: number
          person_id?: number | null
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: number
          embedding?: string | null
          group_id?: number | null
          group_order?: number | null
          id?: number
          person_id?: number | null
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      person_embeddings_gte_small: {
        Row: {
          content: string | null
          created_at: string
          created_by: number
          embedding: string | null
          group_id: number | null
          group_order: number | null
          id: number
          person_id: number | null
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: number
          embedding?: string | null
          group_id?: number | null
          group_order?: number | null
          id?: number
          person_id?: number | null
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: number
          embedding?: string | null
          group_id?: number | null
          group_order?: number | null
          id?: number
          person_id?: number | null
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          bio: string | null
          created_at: string
          created_by: number
          email: string
          id: number
          location: string | null
          name: string
          person_data: Json | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by: number
          email: string
          id?: number
          location?: string | null
          name: string
          person_data?: Json | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: number
          email?: string
          id?: number
          location?: string | null
          name?: string
          person_data?: Json | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "persons_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          auth_id: string
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: number
          locale: string | null
          name_first: string | null
          name_last: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          timezone: string | null
          updated_at: string | null
          user_data: Json | null
          username: string | null
        }
        Insert: {
          auth_id: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: number
          locale?: string | null
          name_first?: string | null
          name_last?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string | null
          user_data?: Json | null
          username?: string | null
        }
        Update: {
          auth_id?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: number
          locale?: string | null
          name_first?: string | null
          name_last?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string | null
          user_data?: Json | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_userid_by_email: {
        Args: {
          email: string
        }
        Returns: string
      }
      match_person_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          username: string
          content: string
          similarity: number
        }[]
      }
      user_has_permission: {
        Args: {
          auth_id: string
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "organisations.update"
        | "organisations.delete"
        | "users.admin"
        | "users.update"
        | "users.delete"
        | "embeddings.admin"
        | "embeddings.update"
        | "embeddings.delete"
        | "embeddings.read"
        | "persons.admin"
        | "persons.update"
        | "persons.delete"
        | "persons.read"
        | "categories.update"
        | "categories.delete"
        | "messages.update"
        | "messages.delete"
      app_role:
        | "app.owner"
        | "app.admin"
        | "org.owner"
        | "org.admin"
        | "org.moderator"
        | "user"
      user_status: "NEW" | "ACTIVE" | "DISABLED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

