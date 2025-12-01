import type { AuthRepository } from "../../domain/repositories/AuthRepository";

export const createSignOut = (repository: AuthRepository) => {
  return async (): Promise<void> => {
    await repository.signOut();
  };
};
