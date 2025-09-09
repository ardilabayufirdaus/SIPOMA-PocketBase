// Tipe data untuk tabel BOR
export type BOR = {
  No?: number;
  "Vessel ID": string;
  "Vessel Name"?: string;
  LOA?: number;
  Kade?: string;
  "Panjang Kade"?: number;
  "Mulai Tambat"?: string; // timestamp with time zone
  "Selesai Tambat"?: string; // timestamp with time zone
  "Waktu Sandar (jam)"?: string;
  "BOR (%)"?: string;
};

// Tipe data untuk tabel BUP
export type BUP = {
  No?: number;
  VesID?: string;
  "Vessel Name"?: string;
  "Laycan Start"?: string;
  "Laycan Finish"?: string;
  ATA?: string;
  ATD?: string;
  AGENT?: string;
  BDR?: string;
  GT?: number;
  LOA?: string;
  KADE?: string;
  "IKAT TALI"?: string;
  "COMMENCED LOADING"?: string;
  "COMPLETED LOADING"?: string;
  "LEPAS TALI"?: string;
  BARANG?: string;
  TONASE?: number;
  "MULAI TUNDA MASUK"?: string;
  "SELESAI TUNDA MASUK"?: string;
  "MULAI TUNDA KELUAR"?: string;
  "SELESAI TUNDA KELUAR"?: string;
  KOMODITAS?: string;
  JENIS?: string;
};

// Tipe data untuk tabel SIRANI
export type SIRANI = {
  No?: number;
  "Nama Kapal"?: string;
  "D.W.T"?: string;
  "G.R.T"?: number;
  Kade?: string;
  "Tanggal Tambat"?: string; // timestamp with time zone
  "Jenis Muatan"?: string;
  "QTY DN Bongkar"?: number;
  "QTY DN Muat"?: string;
  "QTY LN Bongkar"?: string;
  "QTY LN Muat"?: string;
  "Tanggal Bertolak"?: string; // timestamp with time zone
  Asal?: string;
  Tujuan?: string;
  Agen?: string;
};

// Tipe data untuk tabel alerts
export type Alert = {
  id: string;
  message: string;
  timestamp: string;
  severity: string;
  read: boolean;
};
// ...existing code...
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cop_parameters: {
        Row: {
          id: string;
          parameter_ids: string[];
        };
        Insert: {
          id?: string;
          parameter_ids: string[];
        };
        Update: {
          id?: string;
          parameter_ids?: string[];
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          message: string;
          read: boolean;
          severity: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          message: string;
          read?: boolean;
          severity: string;
          timestamp: string;
        };
        Update: {
          id?: string;
          message?: string;
          read?: boolean;
          severity?: string;
          timestamp?: string;
        };
        Relationships: [];
      };
      autonomous_risk_data: {
        Row: {
          date: string;
          id: string;
          mitigation_plan: string;
          potential_disruption: string;
          preventive_action: string;
          status: string;
          unit: string;
        };
        Insert: {
          date: string;
          id?: string;
          mitigation_plan: string;
          potential_disruption: string;
          preventive_action: string;
          status: string;
          unit: string;
        };
        Update: {
          date?: string;
          id?: string;
          mitigation_plan?: string;
          potential_disruption?: string;
          preventive_action?: string;
          status?: string;
          unit?: string;
        };
        Relationships: [];
      };
      ccr_downtime_data: {
        Row: {
          action: string | null;
          corrective_action: string | null;
          date: string;
          end_time: string;
          id: string;
          pic: string;
          problem: string;
          start_time: string;
          status: string | null;
          unit: string;
        };
        Insert: {
          action?: string | null;
          corrective_action?: string | null;
          date: string;
          end_time: string;
          id?: string;
          pic: string;
          problem: string;
          start_time: string;
          status?: string | null;
          unit: string;
        };
        Update: {
          action?: string | null;
          corrective_action?: string | null;
          date?: string;
          end_time?: string;
          id?: string;
          pic?: string;
          problem?: string;
          start_time?: string;
          status?: string | null;
          unit?: string;
        };
        Relationships: [];
      };
      ccr_parameter_data: {
        Row: {
          date: string;
          hourly_values: Json | null;
          id: string;
          parameter_id: string;
        };
        Insert: {
          date: string;
          hourly_values?: Json | null;
          id?: string;
          parameter_id: string;
        };
        Update: {
          date?: string;
          hourly_values?: Json | null;
          id?: string;
          parameter_id?: string;
        };
        Relationships: [];
      };
      ccr_silo_data: {
        Row: {
          date: string;
          id: string;
          shift1: Json | null;
          shift2: Json | null;
          shift3: Json | null;
          siloId: string;
        };
        Insert: {
          date: string;
          id?: string;
          shift1?: Json | null;
          shift2?: Json | null;
          shift3?: Json | null;
          siloId: string;
        };
        Update: {
          date?: string;
          id?: string;
          shift1?: Json | null;
          shift2?: Json | null;
          shift3?: Json | null;
          siloId?: string;
        };
        Relationships: [];
      };
      kpis: {
        Row: {
          icon: string;
          id: string;
          title: string;
          trend: number;
          unit: string;
          value: string;
        };
        Insert: {
          icon: string;
          id?: string;
          title: string;
          trend: number;
          unit: string;
          value: string;
        };
        Update: {
          icon?: string;
          id?: string;
          title?: string;
          trend?: number;
          unit?: string;
          value?: string;
        };
        Relationships: [];
      };
      machines: {
        Row: {
          id: string;
          name: string;
          output: number;
          status: string;
          temperature: number;
          uptime: number;
        };
        Insert: {
          id?: string;
          name: string;
          output: number;
          status: string;
          temperature: number;
          uptime: number;
        };
        Update: {
          id?: string;
          name?: string;
          output?: number;
          status?: string;
          temperature?: number;
          uptime?: number;
        };
        Relationships: [];
      };
      packing_plant_master: {
        Row: {
          area: string;
          cement_type: string;
          dead_stock: number;
          id: string;
          plant_code: string;
          silo_capacity: number;
        };
        Insert: {
          area: string;
          cement_type: string;
          dead_stock: number;
          id?: string;
          plant_code: string;
          silo_capacity: number;
        };
        Update: {
          area?: string;
          cement_type?: string;
          dead_stock?: number;
          id?: string;
          plant_code?: string;
          silo_capacity?: number;
        };
        Relationships: [];
      };
      packing_plant_stock: {
        Row: {
          area: string;
          closing_stock: number;
          date: string;
          id: string;
          opening_stock: number;
          stock_out: number;
          stock_received: number;
        };
        Insert: {
          area: string;
          closing_stock: number;
          date: string;
          id?: string;
          opening_stock: number;
          stock_out: number;
          stock_received: number;
        };
        Update: {
          area?: string;
          closing_stock?: number;
          date?: string;
          id?: string;
          opening_stock?: number;
          stock_out?: number;
          stock_received?: number;
        };
        Relationships: [];
      };
      parameter_settings: {
        Row: {
          category: string;
          data_type: string;
          id: string;
          max_value: number | null;
          min_value: number | null;
          parameter: string;
          unit: string;
        };
        Insert: {
          category: string;
          data_type: string;
          id?: string;
          max_value?: number | null;
          min_value?: number | null;
          parameter: string;
          unit: string;
        };
        Update: {
          category?: string;
          data_type?: string;
          id?: string;
          max_value?: number | null;
          min_value?: number | null;
          parameter?: string;
          unit?: string;
        };
        Relationships: [];
      };
      global_parameter_settings: {
        Row: {
          id: string;
          user_id: string | null;
          plant_category: string | null;
          plant_unit: string | null;
          selected_parameters: string[];
          is_global: boolean;
          created_at: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          plant_category?: string | null;
          plant_unit?: string | null;
          selected_parameters: string[];
          is_global?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          plant_category?: string | null;
          plant_unit?: string | null;
          selected_parameters?: string[];
          is_global?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      pic_settings: {
        Row: {
          id: string;
          pic: string;
        };
        Insert: {
          id?: string;
          pic: string;
        };
        Update: {
          id?: string;
          pic?: string;
        };
        Relationships: [];
      };
      plant_units: {
        Row: {
          category: string;
          id: string;
          unit: string;
        };
        Insert: {
          category: string;
          id?: string;
          unit: string;
        };
        Update: {
          category?: string;
          id?: string;
          unit?: string;
        };
        Relationships: [];
      };
      production_data: {
        Row: {
          created_at: string;
          hour: number;
          id: string;
          output: number;
        };
        Insert: {
          created_at?: string;
          hour: number;
          id?: string;
          output: number;
        };
        Update: {
          created_at?: string;
          hour?: number;
          id?: string;
          output?: number;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          activity: string;
          actualEnd: string | null;
          actualStart: string | null;
          id: string;
          percentComplete: number;
          plannedEnd: string;
          plannedStart: string;
          projectId: string;
        };
        Insert: {
          activity: string;
          actualEnd?: string | null;
          actualStart?: string | null;
          id?: string;
          percentComplete: number;
          plannedEnd: string;
          plannedStart: string;
          projectId: string;
        };
        Update: {
          activity?: string;
          actualEnd?: string | null;
          actualStart?: string | null;
          id?: string;
          percentComplete?: number;
          plannedEnd?: string;
          plannedStart?: string;
          projectId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_tasks_projectId_fkey";
            columns: ["projectId"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          budget: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          budget?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          budget?: number | null;
        };
        Relationships: [];
      };
      report_settings: {
        Row: {
          category: string;
          id: string;
          parameter_id: string;
        };
        Insert: {
          category: string;
          id?: string;
          parameter_id: string;
        };
        Update: {
          category?: string;
          id?: string;
          parameter_id?: string;
        };
        Relationships: [];
      };
      silo_capacities: {
        Row: {
          capacity: number;
          dead_stock: number;
          id: string;
          plant_category: string;
          silo_name: string;
          unit: string;
        };
        Insert: {
          capacity: number;
          dead_stock: number;
          id?: string;
          plant_category: string;
          silo_name: string;
          unit: string;
        };
        Update: {
          capacity?: number;
          dead_stock?: number;
          id?: string;
          plant_category?: string;
          silo_name?: string;
          unit?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          department: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          last_active: string;
          permissions: Json | null;
          role: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          department: string;
          email: string;
          full_name: string;
          id?: string;
          is_active?: boolean;
          last_active: string;
          permissions?: Json | null;
          role: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          department?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          last_active?: string;
          permissions?: Json | null;
          role?: string;
        };
        Relationships: [];
      };
      work_instructions: {
        Row: {
          activity: string;
          description: string;
          doc_code: string;
          doc_title: string;
          id: string;
          link: string;
        };
        Insert: {
          activity: string;
          description: string;
          doc_code: string;
          doc_title: string;
          id?: string;
          link: string;
        };
        Update: {
          activity?: string;
          description?: string;
          doc_code?: string;
          doc_title?: string;
          id?: string;
          link?: string;
        };
        Relationships: [];
      };
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never;
