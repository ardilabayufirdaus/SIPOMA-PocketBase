import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PocketBaseUserRepository } from '../../../src/infrastructure/repositories/PocketBaseUserRepository';
import { CreateUserDTO, UpdateUserDTO } from '../../../src/domain/repositories/UserRepository';
import { UserFilter } from '../../../src/domain/entities/User';

// Singleton instance for hooks
const userRepository = new PocketBaseUserRepository();

export const USER_KEYS = {
  all: ['users'] as const,
  list: (filter: UserFilter) => [...USER_KEYS.all, 'list', filter] as const,
  detail: (id: string) => [...USER_KEYS.all, 'detail', id] as const,
};

export const useUsersList = (filter: UserFilter) => {
  return useQuery({
    queryKey: USER_KEYS.list(filter),
    queryFn: () => userRepository.getUsers(filter),
  });
};

export const useUserDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => userRepository.getUserById(id),
    enabled,
  });
};

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (data: CreateUserDTO) => userRepository.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDTO }) =>
      userRepository.updateUser(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => userRepository.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });

  return { createUser, updateUser, deleteUser };
};
