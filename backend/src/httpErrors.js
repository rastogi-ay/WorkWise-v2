export class HttpError extends Error {
  constructor(status, message, details = null, { expose = true } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.expose = expose;
  }
}

export class BadRequestError extends HttpError {
  constructor(message, details = null) {
    super(400, message, details);
  }
}

export class FeatureDeniedError extends HttpError {
  constructor(message, details = null) {
    super(403, message, details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message, details = null) {
    super(404, message, details);
  }
}

export class ConflictError extends HttpError {
  constructor(message, details = null) {
    super(409, message, details);
  }
}

export class UpstreamError extends HttpError {
  constructor(status, message) {
    super(status, message, null, { expose: false });
  }
}

// Anything that isn't an HttpError is unexpected: log it and report a 500 with
// fallbackMessage rather than leaking internals to the client. Used in controllers only.
export function sendHttpError(error, res, fallbackMessage) {
  if (error instanceof HttpError) {
    console.log(`${error.name} (${error.status}): ${error.message}`, error.details ?? '');
    return res.status(error.status).json({ error: error.expose ? error.message : fallbackMessage });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}
