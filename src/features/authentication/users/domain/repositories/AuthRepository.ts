import type { SignInInput, SignUpInput, AuthSession } from "../../domain/entities/auth";

export interface AuthRepository {
  signIn(input: SignInInput): Promise<AuthSession>;
  signUp(input: SignUpInput): Promise<AuthSession>;
  signOut(): Promise<void>;
}
