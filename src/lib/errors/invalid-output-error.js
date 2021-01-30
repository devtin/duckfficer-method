import { DuckfficerMethodError } from './duckfficer-method-error.js'

export class InvalidOutputError extends DuckfficerMethodError {
  constructor (payload, error) {
    super(`Invalid output`, payload, error);
  }
}
