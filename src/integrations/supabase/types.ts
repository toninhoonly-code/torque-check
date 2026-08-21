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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      atendimentos: {
        Row: {
          assinatura_data_url: string | null
          assinatura_em: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          diagnostico: string | null
          id: string
          km_entrada: string | null
          km_saida: string | null
          numero: number
          obs_mecanico: string | null
          reclamacao: string | null
          saida_estado: string | null
          saida_observacoes: string | null
          saida_pendencias: string | null
          saida_recomendacoes: string | null
          servicos_realizados: string | null
          status: string
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          assinatura_data_url?: string | null
          assinatura_em?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          diagnostico?: string | null
          id?: string
          km_entrada?: string | null
          km_saida?: string | null
          numero?: number
          obs_mecanico?: string | null
          reclamacao?: string | null
          saida_estado?: string | null
          saida_observacoes?: string | null
          saida_pendencias?: string | null
          saida_recomendacoes?: string | null
          servicos_realizados?: string | null
          status?: string
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          assinatura_data_url?: string | null
          assinatura_em?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          diagnostico?: string | null
          id?: string
          km_entrada?: string | null
          km_saida?: string | null
          numero?: number
          obs_mecanico?: string | null
          reclamacao?: string | null
          saida_estado?: string | null
          saida_observacoes?: string | null
          saida_pendencias?: string | null
          saida_recomendacoes?: string | null
          servicos_realizados?: string | null
          status?: string
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      avarias: {
        Row: {
          atendimento_id: string
          created_at: string
          descricao: string | null
          id: string
          pos_x: number | null
          pos_y: number | null
          storage_path: string | null
          tipo: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          pos_x?: number | null
          pos_y?: number | null
          storage_path?: string | null
          tipo: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          pos_x?: number | null
          pos_y?: number | null
          storage_path?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avarias_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          atendimento_id: string
          created_at: string
          etapa: string
          id: string
          item: string
          observacao: string | null
          status: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          etapa: string
          id?: string
          item: string
          observacao?: string | null
          status?: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          etapa?: string
          id?: string
          item?: string
          observacao?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nome: string
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fotos: {
        Row: {
          atendimento_id: string
          created_at: string
          etapa: string
          id: string
          item: string
          storage_path: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          etapa: string
          id?: string
          item: string
          storage_path: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          etapa?: string
          id?: string
          item?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          atendimento_id: string
          created_at: string
          destino_peca_antiga: string
          id: string
          marca: string | null
          nome: string
          observacao: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          destino_peca_antiga?: string
          id?: string
          marca?: string | null
          nome: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          destino_peca_antiga?: string
          id?: string
          marca?: string | null
          nome?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pecas_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
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
      veiculos: {
        Row: {
          ano: string | null
          cliente_id: string
          created_at: string
          id: string
          modelo: string | null
          placa: string
        }
        Insert: {
          ano?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          modelo?: string | null
          placa: string
        }
        Update: {
          ano?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          modelo?: string | null
          placa?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      pode_ver_arquivo: { Args: { _name: string }; Returns: boolean }
      pode_ver_atendimento: {
        Args: { _atendimento_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "funcionario" | "cliente"
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
      app_role: ["admin", "funcionario", "cliente"],
    },
  },
} as const
