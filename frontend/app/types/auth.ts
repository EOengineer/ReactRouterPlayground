export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthErrorResponse = {
  error: string;
};

export class AuthApiError extends Error {
  readonly status: number;
  readonly body: AuthErrorResponse | null;

  constructor(status: number, body: AuthErrorResponse | null, message?: string) {
    super(message ?? body?.error ?? "Request failed");
    this.name = "AuthApiError";
    this.status = status;
    this.body = body;
  }
}
