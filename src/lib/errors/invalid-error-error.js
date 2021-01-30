import { DuckfficerMethodError } from './duckfficer-method-error.js'

export class InvalidErrorError extends DuckfficerMethodError {
  constructor (errorName, payload, error) {
    super(`Invalid error`, payload, error);
  }
}
