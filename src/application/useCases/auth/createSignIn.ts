import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type { SignInInput, AuthSession } from "@/domain/entities/auth";

export const createSignIn = (repository: AuthRepository) => {
  return async (input: SignInInput): Promise<AuthSession> => {
    return repository.signIn(input);
  };
};
