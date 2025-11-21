import type { RecoveryRepository } from "@/domain/repositories/RecoveryRepository";
import type {
  RequestRecoveryCodeInput,
  VerifyRecoveryCodeInput,
  ResetPasswordInput,
  RequestRecoveryCodeResponse,
  VerifyRecoveryCodeResponse,
  ResetPasswordResponse,
} from "@/domain/entities/recovery";
import { requestJson } from "@/infrastructure/http/apiClient";
import { withPrefix } from "@/infrastructure/http/apiPaths";

const REQUEST_CODE_PATH = withPrefix("/users/recovery-code");
const VERIFY_CODE_PATH = withPrefix("/users/verify-recovery-code");
const RESET_PASSWORD_PATH = withPrefix("/users/reset-password");

export const createRecoveryRepository = (): RecoveryRepository => {
  const requestRecoveryCode: RecoveryRepository["requestRecoveryCode"] = async (
    input: RequestRecoveryCodeInput
  ) => {
    const response = await requestJson<RequestRecoveryCodeResponse>(REQUEST_CODE_PATH, input, {
      method: "POST",
    });
    return response;
  };

  const verifyRecoveryCode: RecoveryRepository["verifyRecoveryCode"] = async (
    input: VerifyRecoveryCodeInput
  ) => {
    const response = await requestJson<VerifyRecoveryCodeResponse>(VERIFY_CODE_PATH, input, {
      method: "POST",
    });
    return response;
  };

  const resetPassword: RecoveryRepository["resetPassword"] = async (
    input: ResetPasswordInput
  ) => {
    const response = await requestJson<ResetPasswordResponse>(RESET_PASSWORD_PATH, input, {
      method: "PUT",
    });
    return response;
  };

  return {
    requestRecoveryCode,
    verifyRecoveryCode,
    resetPassword,
  };
};
