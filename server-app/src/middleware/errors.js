/**
 * Base error, don't use directly. Create a subclass.
 */
export class SmrpoError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ValidationError extends SmrpoError {
  constructor(message) {
    super(message, 400);
  }
}

export class UnauthorizedError extends SmrpoError {
  constructor(message = 'Unauthorized') {
    super(message, 403);
  }
}

export class TeapotError extends SmrpoError {
  constructor() {
    super('', 418);
  }
}
