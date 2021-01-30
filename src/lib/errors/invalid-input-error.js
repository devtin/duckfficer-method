import { DuckfficerMethodError } from './duckfficer-method-error.js'

export class InvalidInputError extends DuckfficerMethodError {
  constructor (payload, error) {
    super(`Invalid input`, payload, error);
  }
}
