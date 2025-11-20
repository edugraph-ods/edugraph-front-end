import type {
  RequestRecoveryCodeInput,
  VerifyRecoveryCodeInput,
  ResetPasswordInput,
  RequestRecoveryCodeResponse,
  VerifyRecoveryCodeResponse,
  ResetPasswordResponse,
} from "@/domain/entities/recovery";

export interface RecoveryRepository {
  requestRecoveryCode(input: RequestRecoveryCodeInput): Promise<RequestRecoveryCodeResponse>;
  verifyRecoveryCode(input: VerifyRecoveryCodeInput): Promise<VerifyRecoveryCodeResponse>;
  resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResponse>;
}
