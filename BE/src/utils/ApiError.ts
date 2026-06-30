
/*
|--------------------------------------------------------------------------
| API Error Class (Enterprise Grade)
|--------------------------------------------------------------------------
| Standardized error handling for production backend systems
|--------------------------------------------------------------------------
*/

export interface ApiErrorOptions {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
  isOperational?: boolean;
}

/*
|--------------------------------------------------------------------------
| API Error Class
|--------------------------------------------------------------------------
*/

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(optionsOrStatusCode: ApiErrorOptions | number, message?: string) {
    const options: ApiErrorOptions =
      typeof optionsOrStatusCode === "number"
        ? {
            statusCode: optionsOrStatusCode,
            message: message ?? "Application Error",
          }
        : optionsOrStatusCode;

    super(options.message);

    this.name = "ApiError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date().toISOString();

    /*
    |--------------------------------------------------------------------------
    | Stack Trace Safety (Node + browser fallback)
    |--------------------------------------------------------------------------
    */
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Internal factory builder (DRY core)
  |--------------------------------------------------------------------------
  */

  private static create(
    statusCode: number,
    message: string,
    details?: unknown,
    isOperational = true,
    code?: string
  ): ApiError {
    return new ApiError({
      statusCode,
      message,
      details,
      isOperational,
      code,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Static Factory Methods (Clean + Consistent)
  |--------------------------------------------------------------------------
  */

  static badRequest(message = "Bad Request", details?: unknown): ApiError {
    return this.create(400, message, details);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return this.create(401, message);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return this.create(403, message);
  }

  static notFound(message = "Resource Not Found"): ApiError {
    return this.create(404, message);
  }

  static conflict(message = "Conflict", details?: unknown): ApiError {
    return this.create(409, message, details);
  }

  static validation(
    message = "Validation Failed",
    details?: unknown
  ): ApiError {
    return this.create(422, message, details);
  }

  static internal(message = "Internal Server Error"): ApiError {
    return this.create(500, message, undefined, false);
  }

  /*
  |--------------------------------------------------------------------------
  | Optional: Safe serialization for logs / APIs
  |--------------------------------------------------------------------------
  */

  toJSON() {
    return {
      name: this.name,
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
      details: this.details,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
    };
  }
}