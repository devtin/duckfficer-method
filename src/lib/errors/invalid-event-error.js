import { DuckfficerMethodError } from './duckfficer-method-error.js'

export class InvalidEventError extends DuckfficerMethodError {
  constructor (eventName, payload, error) {
    super(`Invalid event`, payload, error);
  }
}
