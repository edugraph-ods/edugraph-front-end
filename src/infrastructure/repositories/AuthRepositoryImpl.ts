import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type { SignInInput, SignUpInput, AuthSession } from "@/domain/entities/auth";
import { requestJson } from "@/infrastructure/http/apiClient";
import { extractAuthToken } from "@/shared/utils/authToken";

const SIGN_IN_PATH = "/api/v1/sign-in";
const SIGN_UP_PATH = "/api/v1/sign-up";

export const createAuthRepository = (): AuthRepository => {
  const toAuthSession = (payload: unknown): AuthSession => ({
    token: extractAuthToken(payload),
    raw: payload,
  });

  const signIn: AuthRepository["signIn"] = async (input: SignInInput) => {
    const response = await requestJson<unknown>(SIGN_IN_PATH, input);
    return toAuthSession(response);
  };

  const signUp: AuthRepository["signUp"] = async (input: SignUpInput) => {
    const response = await requestJson<unknown>(SIGN_UP_PATH, input);
    return toAuthSession(response);
  };

  const signOut: AuthRepository["signOut"] = async () => {
    Promise.resolve();
  };

  return {
    signIn,
    signUp,
    signOut,
  };
};
