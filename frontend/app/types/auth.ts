export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegistrationPayload = {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
};

export type AuthErrorResponse = {
  error?: string;
  errors?: string[];
};

function messageFromBody(body: AuthErrorResponse | null): string {
  if (body?.error) {
    return body.error;
  }

  if (body?.errors && body.errors.length > 0) {
    return body.errors.join(", ");
  }

  return "Request failed";
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly body: AuthErrorResponse | null;

  constructor(status: number, body: AuthErrorResponse | null, message?: string) {
    super(message ?? messageFromBody(body));
    this.name = "AuthApiError";
    this.status = status;
    this.body = body;
  }
}
