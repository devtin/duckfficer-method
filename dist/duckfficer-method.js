/*!
 * duckfficer-method v1.0.0
 * (c) 2020-2021 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var duckfficer = require('duckfficer');

class DuckfficerMethodError extends Error {
  constructor (message, payload, originalError) {
    super(message);
    this.payload = payload;
    this.originalError = originalError;
  }
}

class InvalidEventError extends DuckfficerMethodError {
  constructor (eventName, payload, error) {
    super(`Invalid event`, payload, error);
  }
}

class InvalidErrorError extends DuckfficerMethodError {
  constructor (errorName, payload, error) {
    super(`Invalid error`, payload, error);
  }
}

class InvalidInputError extends DuckfficerMethodError {
  constructor (payload, error) {
    super(`Invalid input`, payload, error);
  }
}

class InvalidOutputError extends DuckfficerMethodError {
  constructor (payload, error) {
    super(`Invalid output`, payload, error);
  }
}

class DuckfficerMethodResultManager {
  constructor ({ events = {}, errors = {} } = {}) {
    Object.assign(this, {
      events,
      errors
    });

    this.eventsEmitted = [];
    this.errorsThrown = [];
  }

  async emit (eventName, eventPayload) {
    if (!this.events || !this.events[eventName]) {
      throw new InvalidEventError(eventName, eventPayload, new Error(`Event "${eventName||'undefined'}" not found!`))
    }

    const getPayload = async () => {
      try {
        return await this.events[eventName].parse(eventPayload)
      } catch (error) {
        throw new InvalidEventError(eventName, eventPayload, error)
      }
    };

    const payload = await getPayload();

    this.eventsEmitted.push({
      date: new Date(),
      name: eventName,
      payload
    });
  }

  async throw (errorName, errorPayload) {
    if (!this.errors || !this.errors[errorName]) {
      throw new InvalidErrorError(errorName, errorPayload,new Error(`Error "${errorName||'undefined'}" not found!`))
    }

    const getPayload = async () => {
      try {
        return await this.errors[errorName].parse(errorPayload)
      } catch (error) {
        throw new InvalidErrorError(errorName, errorPayload, error)
      }
    };

    const payload = await getPayload();

    this.errorsThrown.push({
      date: new Date(),
      name: errorName,
      payload
    });
  }
}

const noValidationProxy = { parse: payload => payload };

const getValidator = (validator) => {
  if (!validator) {
    return noValidationProxy
  }

  return duckfficer.Schema.ensureSchema(validator)
};

const duckfficerMethod = ({
  input: inputSchema,
  output: outputSchema,
  errors,
  events,
  handler
}) => {
  const inputValidator = getValidator(inputSchema);
  const outputValidator = getValidator(outputSchema);

  const errorsValidator = {};
  const eventsValidator = {};

  Object.entries(events || {}).forEach(([eventName, schema]) => {
    eventsValidator[eventName] = getValidator(schema);
  });

  Object.entries(errors || {}).forEach(([errorName, schema]) => {
    errorsValidator[errorName] = getValidator(schema);
  });

  const getInput = async (givenInput) => {
    try {
      return await inputValidator.parse(givenInput)
    } catch (error) {
      throw new InvalidInputError(givenInput, error)
    }
  };

  const getOutput = async (givenResult) => {
    try {
      return await outputValidator.parse(givenResult)
    } catch (error) {
      throw new InvalidOutputError(givenResult, error)
    }
  };

  const getResult = async (input) => {
    const resultManager = new DuckfficerMethodResultManager({
      events: eventsValidator,
      errors: errorsValidator
    });

    try {
      resultManager.result = await handler.call(resultManager, input, resultManager);
      return resultManager
    } catch (error) {
      if (!(error instanceof DuckfficerMethodError)) {
        throw new DuckfficerMethodError(error.message, input, error)
      }

      throw error
    }
  };

  return async (givenInput) => {
    const input = await getInput(givenInput);
    const resultManager = await getResult(input); // raw data returned from the given handler
    resultManager.output = await getOutput(resultManager.result); // possibly transformed data given the output transformer

    return resultManager
  }
};

exports.duckfficerMethod = duckfficerMethod;
