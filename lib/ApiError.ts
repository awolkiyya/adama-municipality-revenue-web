
export class ApiError extends Error {
  status?: number;
  code?: string;
  errors?: unknown;

  constructor(
    message: string,
    status?: number,
    code?: string,
    errors?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
