// Tipe data untuk tabel BOR
export type BOR = {
  No?: number;
  'Vessel ID': string;
  'Vessel Name'?: string;
  LOA?: number;
  Kade?: string;
  'Panjang Kade'?: number;
  'Mulai Tambat'?: string; // timestamp with time zone
  'Selesai Tambat'?: string; // timestamp with time zone
  'Waktu Sandar (jam)'?: string;
  'BOR (%)'?: string;
};

// Tipe data untuk tabel BUP
export type BUP = {
  No?: number;
  VesID?: string;
  'Vessel Name'?: string;
  'Laycan Start'?: string;
  'Laycan Finish'?: string;
  ATA?: string;
  ATD?: string;
  AGENT?: string;
  BDR?: string;
  GT?: number;
  LOA?: string;
  KADE?: string;
  'IKAT TALI'?: string;
  'COMMENCED LOADING'?: string;
  'COMPLETED LOADING'?: string;
  'LEPAS TALI'?: string;
  BARANG?: string;
  TONASE?: number;
  'MULAI TUNDA MASUK'?: string;
  'SELESAI TUNDA MASUK'?: string;
  'MULAI TUNDA KELUAR'?: string;
  'SELESAI TUNDA KELUAR'?: string;
  KOMODITAS?: string;
  JENIS?: string;
};

// Tipe data untuk tabel SIRANI
export type SIRANI = {
  No?: number;
  'Nama Kapal'?: string;
  'D.W.T'?: string;
  'G.R.T'?: number;
  Kade?: string;
  'Tanggal Tambat'?: string; // timestamp with time zone
  'Jenis Muatan'?: string;
  'QTY DN Bongkar'?: number;
  'QTY DN Muat'?: string;
  'QTY LN Bongkar'?: string;
  'QTY LN Muat'?: string;
  'Tanggal Bertolak'?: string; // timestamp with time zone
  Asal?: string;
  Tujuan?: string;
  Agen?: string;
};

// Tipe data untuk tabel alerts
export type Alert = {
  id: string;
  message: string;
  severity: string;
  created_at: string;
  read_at?: string;
  category?: string;
  dismissed?: boolean;
  snoozed_until?: string;
};
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          password: string | null;
          full_name: string | null;
          role: string;
          avatar_url: string | null;
          is_active: boolean;
          last_active: string | null;
          created_at: string;
          updated_at: string;
          permissions: any;
        };
        Insert: {
          id?: string;
          username: string;
          email?: string | null;
          password?: string | null;
          full_name?: string | null;
          role: string;
          avatar_url?: string | null;
          is_active?: boolean;
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
          permissions?: any;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string | null;
          password?: string | null;
          full_name?: string | null;
          role?: string;
          avatar_url?: string | null;
          is_active?: boolean;
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
          permissions?: any;
        };
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          severity: string;
          category: string;
          action_url: string | null;
          action_label: string | null;
          metadata: Json | null;
          user_id: string;
          created_at: string;
          read_at: string | null;
          dismissed_at: string | null;
          snoozed_until: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          severity: string;
          category: string;
          action_url?: string | null;
          action_label?: string | null;
          metadata?: Json | null;
          user_id: string;
          created_at?: string;
          read_at?: string | null;
          dismissed_at?: string | null;
          snoozed_until?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          severity?: string;
          category?: string;
          action_url?: string | null;
          action_label?: string | null;
          metadata?: Json | null;
          user_id?: string;
          created_at?: string;
          read_at?: string | null;
          dismissed_at?: string | null;
          snoozed_until?: string | null;
          expires_at?: string | null;
        };
      };
      parameter_settings: {
        Row: {
          id: string;
          parameter: string;
          data_type: string;
          unit: string;
          category: string;
          min_value: number | null;
          max_value: number | null;
          opc_min_value: number | null;
          opc_max_value: number | null;
          pcc_min_value: number | null;
          pcc_max_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parameter: string;
          data_type: string;
          unit: string;
          category: string;
          min_value?: number | null;
          max_value?: number | null;
          opc_min_value?: number | null;
          opc_max_value?: number | null;
          pcc_min_value?: number | null;
          pcc_max_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parameter?: string;
          data_type?: string;
          unit?: string;
          category?: string;
          min_value?: number | null;
          max_value?: number | null;
          opc_min_value?: number | null;
          opc_max_value?: number | null;
          pcc_min_value?: number | null;
          pcc_max_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ccr_footer_data: {
        Row: {
          id: string;
          date: string;
          parameter_id: string;
          plant_unit: string | null;
          total: number | null;
          average: number | null;
          minimum: number | null;
          maximum: number | null;
          shift1_total: number | null;
          shift2_total: number | null;
          shift3_total: number | null;
          shift3_cont_total: number | null;
          shift1_counter: number | null;
          shift2_counter: number | null;
          shift3_counter: number | null;
          shift3_cont_counter: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          parameter_id: string;
          plant_unit?: string | null;
          total?: number | null;
          average?: number | null;
          minimum?: number | null;
          maximum?: number | null;
          shift1_total?: number | null;
          shift2_total?: number | null;
          shift3_total?: number | null;
          shift3_cont_total?: number | null;
          shift1_counter?: number | null;
          shift2_counter?: number | null;
          shift3_counter?: number | null;
          shift3_cont_counter?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          parameter_id?: string;
          plant_unit?: string | null;
          total?: number | null;
          average?: number | null;
          minimum?: number | null;
          maximum?: number | null;
          shift1_total?: number | null;
          shift2_total?: number | null;
          shift3_total?: number | null;
          shift3_cont_total?: number | null;
          shift1_counter?: number | null;
          shift2_counter?: number | null;
          shift3_counter?: number | null;
          shift3_cont_counter?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      plant_units: {
        Row: {
          id: string;
          unit: string;
          category: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          unit: string;
          category: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit?: string;
          category?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      autonomous_risk_data: {
        Row: {
          id: string;
          unit: string;
          potential_disruption: string;
          preventive_action: string;
          mitigation_plan: string;
          status: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          unit: string;
          potential_disruption: string;
          preventive_action: string;
          mitigation_plan: string;
          status: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit?: string;
          potential_disruption?: string;
          preventive_action?: string;
          mitigation_plan?: string;
          status?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ccr_downtime_data: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          pic: string;
          problem: string;
          unit: string;
          action: string | null;
          corrective_action: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          start_time: string;
          end_time: string;
          pic: string;
          problem: string;
          unit: string;
          action?: string | null;
          corrective_action?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          pic?: string;
          problem?: string;
          unit?: string;
          action?: string | null;
          corrective_action?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      packing_plant_master: {
        Row: {
          id: string;
          area: string;
          plant_code: string;
          silo_capacity: number;
          dead_stock: number;
          cement_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          area: string;
          plant_code: string;
          silo_capacity: number;
          dead_stock: number;
          cement_type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          area?: string;
          plant_code?: string;
          silo_capacity?: number;
          dead_stock?: number;
          cement_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      packing_plant_stock: {
        Row: {
          id: string;
          record_id: string | null;
          date: string;
          area: string;
          opening_stock: number;
          stock_received: number;
          stock_out: number;
          closing_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          record_id?: string | null;
          date: string;
          area: string;
          opening_stock: number;
          stock_received: number;
          stock_out: number;
          closing_stock: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string | null;
          date?: string;
          area?: string;
          opening_stock?: number;
          stock_received?: number;
          stock_out?: number;
          closing_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      pic_settings: {
        Row: {
          id: string;
          pic: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pic: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pic?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_settings: {
        Row: {
          id: string;
          parameter_id: string;
          category: string;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parameter_id: string;
          category: string;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parameter_id?: string;
          category?: string;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_report_settings: {
        Row: {
          id: string;
          jenis: string;
          parameter_id: string | null;
          data: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          jenis: string;
          parameter_id?: string | null;
          data: string;
          category: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          jenis?: string;
          parameter_id?: string | null;
          data?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      silo_capacities: {
        Row: {
          id: string;
          plant_category: string;
          unit: string;
          silo_name: string;
          capacity: number;
          dead_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plant_category: string;
          unit: string;
          silo_name: string;
          capacity: number;
          dead_stock: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plant_category?: string;
          unit?: string;
          silo_name?: string;
          capacity?: number;
          dead_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_instructions: {
        Row: {
          id: string;
          activity: string;
          doc_code: string;
          doc_title: string;
          description: string;
          link: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity: string;
          doc_code: string;
          doc_title: string;
          description: string;
          link: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          activity?: string;
          doc_code?: string;
          doc_title?: string;
          description?: string;
          link?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          budget: number | null;
          status: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          budget?: number | null;
          status: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          budget?: number | null;
          status?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_tasks: {
        Row: {
          id: string;
          project_id: string;
          activity: string;
          planned_start: string;
          planned_end: string;
          actual_start: string | null;
          actual_end: string | null;
          percent_complete: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          activity: string;
          planned_start: string;
          planned_end: string;
          actual_start?: string | null;
          actual_end?: string | null;
          percent_complete: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          activity?: string;
          planned_start?: string;
          planned_end?: string;
          actual_start?: string | null;
          actual_end?: string | null;
          percent_complete?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      cop_parameters: {
        Row: {
          id: string;
          parameter_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parameter_ids: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parameter_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      global_parameter_settings: {
        Row: {
          id: string;
          user_id: string;
          plant_category: string;
          plant_unit: string;
          selected_parameters: string[];
          is_global: boolean;
          created_at: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plant_category: string;
          plant_unit: string;
          selected_parameters: string[];
          is_global: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plant_category?: string;
          plant_unit?: string;
          selected_parameters?: string[];
          is_global?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          message: string;
          severity: string;
          created_at: string;
          read_at: string | null;
          category: string | null;
          dismissed: boolean | null;
          snoozed_until: string | null;
        };
        Insert: {
          id?: string;
          message: string;
          severity: string;
          created_at?: string;
          read_at?: string | null;
          category?: string | null;
          dismissed?: boolean | null;
          snoozed_until?: string | null;
        };
        Update: {
          id?: string;
          message?: string;
          severity?: string;
          created_at?: string;
          read_at?: string | null;
          category?: string | null;
          dismissed?: boolean | null;
          snoozed_until?: string | null;
        };
      };
      // Add more table definitions as needed
      [key: string]: any;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never;
