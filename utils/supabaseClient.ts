import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const apiClient = {
    users: {
        async getByEmail(email: string) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email);
            if (error) throw error;
            return data;
        },
        async getById(id: string) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        async updateLastActive(id: string) {
            const { error } = await supabase
                .from('users')
                .update({ last_active: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        async requestRegistration({ email, name }: { email: string; name: string }) {
            const { error } = await supabase
                .from('registration_requests')
                .insert([{ email, name, status: 'pending' }]);
            if (error) throw error;
        },
        async getRegistrationRequests() {
            const { data, error } = await supabase
                .from('registration_requests')
                .select('*')
                .eq('status', 'pending');
            if (error) throw error;
            return data;
        },
        async approveRegistrationRequest(requestId: string, userData: any) {
            const { error } = await supabase.rpc('approve_user_registration', { 
                request_id: requestId, 
                user_data: userData 
            });
            if (error) throw error;
        },
        async rejectRegistrationRequest(requestId: string) {
            const { error } = await supabase
                .from('registration_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);
            if (error) throw error;
        },
        async getActivityLogs() {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('timestamp', { ascending: false });
            if (error) throw error;
            return data;
        },
    },
};