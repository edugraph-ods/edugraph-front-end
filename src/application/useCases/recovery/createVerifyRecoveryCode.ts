import type { RecoveryRepository } from "@/domain/repositories/RecoveryRepository";
import type { VerifyRecoveryCodeInput, VerifyRecoveryCodeResponse } from "@/domain/entities/recovery";

export const createVerifyRecoveryCode = (repository: RecoveryRepository) => {
  return async (input: VerifyRecoveryCodeInput): Promise<VerifyRecoveryCodeResponse> => {
    return repository.verifyRecoveryCode(input);
  };
};
