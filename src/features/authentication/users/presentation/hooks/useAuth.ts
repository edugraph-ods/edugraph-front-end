import { useMemo } from "react";
import { createAuthRepository } from "../../infrastructure/repositories/AuthRepositoryImpl";
import { createSignIn } from "../../application/useCases/createSignIn";
import { createSignUp } from "../../application/useCases/createSignUp";
import { createSignOut } from "../../application/useCases/createSignOut";
import type { SignInInput, SignUpInput, AuthSession } from "../../domain/entities/auth";

interface UseAuthApi {
  signIn(input: SignInInput): Promise<AuthSession>;
  signUp(input: SignUpInput): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export const useAuth = (): UseAuthApi => {
  const repository = useMemo(() => createAuthRepository(), []);

  const api = useMemo(() => {
    const signIn = createSignIn(repository);
    const signUp = createSignUp(repository);
    const signOut = createSignOut(repository);
    return { signIn, signUp, signOut } satisfies UseAuthApi;
  }, [repository]);

  return api;
};
