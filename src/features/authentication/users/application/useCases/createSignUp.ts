import type { AuthRepository } from "../../domain/repositories/AuthRepository";
import type { SignUpInput, AuthSession } from "../../domain/entities/auth";

export const createSignUp = (repository: AuthRepository) => {
  return async (input: SignUpInput): Promise<AuthSession> => {
    return repository.signUp(input);
  };
};
