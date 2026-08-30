export class ApiError extends Error {
    status?: number;
    code?: string;
    errors?: any;
  
    constructor(
      message: string,
      status?: number,
      code?: string,
      errors?: any
    ) {
      super(message);
  
      this.name = "ApiError"; // important for debugging
      this.status = status;
      this.code = code;
      this.errors = errors;
    }
  }