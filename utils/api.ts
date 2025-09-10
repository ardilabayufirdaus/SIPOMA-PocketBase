import { User } from "../types";
import { apiClient } from "./supabaseClient";

export const api = {
  users: {
    async getByEmail(email: string): Promise<User | null> {
      const users = await apiClient.users.getByEmail(email);
      return users.length > 0 ? users[0] : null;
    },

    async getById(id: string): Promise<User> {
      return apiClient.users.getById(id);
    },

    async updateLastActive(id: string): Promise<void> {
      return apiClient.users.updateLastActive(id);
    },
  },
};
