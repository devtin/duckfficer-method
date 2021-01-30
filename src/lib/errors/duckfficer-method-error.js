export class DuckfficerMethodError extends Error {
  constructor (message, payload, originalError) {
    super(message);
    this.payload = payload
    this.originalError = originalError
  }
}
