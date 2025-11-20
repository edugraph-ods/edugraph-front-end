import type { RecoveryRepository } from "@/domain/repositories/RecoveryRepository";
import type { ResetPasswordInput, ResetPasswordResponse } from "@/domain/entities/recovery";

export const createResetPassword = (repository: RecoveryRepository) => {
  return async (input: ResetPasswordInput): Promise<ResetPasswordResponse> => {
    return repository.resetPassword(input);
  };
};
