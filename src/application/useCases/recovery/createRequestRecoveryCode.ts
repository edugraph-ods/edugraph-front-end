import type { RecoveryRepository } from "@/domain/repositories/RecoveryRepository";
import type { RequestRecoveryCodeInput, RequestRecoveryCodeResponse } from "@/domain/entities/recovery";

export const createRequestRecoveryCode = (repository: RecoveryRepository) => {
  return async (input: RequestRecoveryCodeInput): Promise<RequestRecoveryCodeResponse> => {
    return repository.requestRecoveryCode(input);
  };
};
