import { User } from '../types';
import { apiClient } from './supabaseClient';

export const api = {
  users: {
    async getByEmail(email: string): Promise<User | null> {
      const users = await apiClient.users.getByEmail(email);
      return users && users.length > 0 ? (users[0] as User) : null;
    },

    async getById(id: string): Promise<User> {
      return apiClient.users.getById(id) as Promise<User>;
    },

    async updateLastActive(id: string): Promise<void> {
      return apiClient.users.updateLastActive(id);
    },
    async requestRegistration({ email, name }: { email: string; name: string }) {
      return apiClient.users.requestRegistration({ email, name });
    },
    async getRegistrationRequests() {
      return apiClient.users.getRegistrationRequests();
    },
    async approveRegistrationRequest(requestId: string, userData: Partial<User>) {
      return apiClient.users.approveRegistrationRequest(requestId, userData);
    },
    async rejectRegistrationRequest(requestId: string) {
      return apiClient.users.rejectRegistrationRequest(requestId);
    },
    async getActivityLogs() {
      return apiClient.users.getActivityLogs();
    },
  },
};
