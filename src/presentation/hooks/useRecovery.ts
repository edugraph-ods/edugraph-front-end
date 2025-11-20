import { useMemo } from "react";
import { createRecoveryRepository } from "@/infrastructure/repositories/RecoveryRepositoryImpl";
import { createRequestRecoveryCode } from "@/application/useCases/recovery/createRequestRecoveryCode";
import { createVerifyRecoveryCode } from "@/application/useCases/recovery/createVerifyRecoveryCode";
import { createResetPassword } from "@/application/useCases/recovery/createResetPassword";
import type {
  RequestRecoveryCodeInput,
  VerifyRecoveryCodeInput,
  ResetPasswordInput,
  RequestRecoveryCodeResponse,
  VerifyRecoveryCodeResponse,
  ResetPasswordResponse,
} from "@/domain/entities/recovery";

interface UseRecoveryApi {
  requestRecoveryCode(input: RequestRecoveryCodeInput): Promise<RequestRecoveryCodeResponse>;
  verifyRecoveryCode(input: VerifyRecoveryCodeInput): Promise<VerifyRecoveryCodeResponse>;
  resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResponse>;
}

export const useRecovery = (): UseRecoveryApi => {
  const repository = useMemo(() => createRecoveryRepository(), []);

  const api = useMemo(() => {
    const requestRecoveryCode = createRequestRecoveryCode(repository);
    const verifyRecoveryCode = createVerifyRecoveryCode(repository);
    const resetPassword = createResetPassword(repository);
    return { requestRecoveryCode, verifyRecoveryCode, resetPassword } satisfies UseRecoveryApi;
  }, [repository]);

  return api;
};
