import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type { SignInInput, SignUpInput, AuthSession } from "@/domain/entities/auth";
import { requestJson } from "@/infrastructure/http/apiClient";
import { extractAuthToken } from "@/shared/utils/authToken";
import { PATH_SIGN_IN, PATH_SIGN_UP } from "@/infrastructure/http/apiPaths";

export const createAuthRepository = (): AuthRepository => {
  const toAuthSession = (payload: unknown): AuthSession => ({
    token: extractAuthToken(payload),
    raw: payload,
  });

  const signIn: AuthRepository["signIn"] = async (input: SignInInput) => {
    const response = await requestJson<unknown>(PATH_SIGN_IN(), input);
    return toAuthSession(response);
  };

  const signUp: AuthRepository["signUp"] = async (input: SignUpInput) => {
    const response = await requestJson<unknown>(PATH_SIGN_UP(), input);
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
