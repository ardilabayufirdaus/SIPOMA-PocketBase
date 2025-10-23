/**
 * Interface untuk profil parameter urutan yang disimpan
 */
export interface ParameterProfile {
  id: string;
  name: string;
  user_id: string;
  unit: string;
  parameter_order: string[];
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

