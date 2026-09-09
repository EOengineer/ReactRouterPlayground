export type ApiErrorResponse = {
  error?: string;
  errors?: string[];
};

function messageFromBody(body: ApiErrorResponse | null): string {
  if (body?.error) {
    return body.error;
  }

  if (body?.errors && body.errors.length > 0) {
    return body.errors.join(", ");
  }

  return "Request failed";
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorResponse | null;

  constructor(status: number, body: ApiErrorResponse | null, message?: string) {
    super(message ?? messageFromBody(body));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
