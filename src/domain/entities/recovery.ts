export interface RequestRecoveryCodeInput {
  email: string;
}

export interface VerifyRecoveryCodeInput {
  email: string;
  code: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}

export type RequestRecoveryCodeResponse = unknown;
export type VerifyRecoveryCodeResponse = string | unknown;
export type ResetPasswordResponse = string | unknown;
