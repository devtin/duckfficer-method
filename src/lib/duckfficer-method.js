import { Schema } from 'duckfficer'
import { DuckfficerMethodError } from './errors/duckfficer-method-error.js'
import { InvalidEventError } from './errors/invalid-event-error.js'
import { InvalidErrorError } from './errors/invalid-error-error.js'
import { InvalidInputError } from './errors/invalid-input-error.js'
import { InvalidOutputError } from './errors/invalid-output-error.js'

class DuckfficerMethodResultManager {
  constructor ({ events = {}, errors = {} } = {}) {
    Object.assign(this, {
      events,
      errors
    })

    this.eventsEmitted = []
    this.errorsThrown = []
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
    }

    const payload = await getPayload()

    this.eventsEmitted.push({
      date: new Date(),
      name: eventName,
      payload
    })
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
    }

    const payload = await getPayload()

    this.errorsThrown.push({
      date: new Date(),
      name: errorName,
      payload
    })
  }
}

const noValidationProxy = { parse: payload => payload }

const getValidator = (validator) => {
  if (!validator) {
    return noValidationProxy
  }

  return Schema.ensureSchema(validator)
}

export const duckfficerMethod = ({
  input: inputSchema,
  output: outputSchema,
  errors,
  events,
  handler
}) => {
  const inputValidator = getValidator(inputSchema)
  const outputValidator = getValidator(outputSchema)

  const errorsValidator = {}
  const eventsValidator = {}

  Object.entries(events || {}).forEach(([eventName, schema]) => {
    eventsValidator[eventName] = getValidator(schema)
  })

  Object.entries(errors || {}).forEach(([errorName, schema]) => {
    errorsValidator[errorName] = getValidator(schema)
  })

  const getInput = async (givenInput) => {
    try {
      return await inputValidator.parse(givenInput)
    } catch (error) {
      throw new InvalidInputError(givenInput, error)
    }
  }

  const getOutput = async (givenResult) => {
    try {
      return await outputValidator.parse(givenResult)
    } catch (error) {
      throw new InvalidOutputError(givenResult, error)
    }
  }

  const getResult = async (input) => {
    const resultManager = new DuckfficerMethodResultManager({
      events: eventsValidator,
      errors: errorsValidator
    })

    try {
      const caller = {
        emit: resultManager.emit.bind(resultManager),
        throw: resultManager.throw.bind(resultManager)
      }
      resultManager.result = await handler.call(caller, input, caller)
      return resultManager
    } catch (error) {
      if (!(error instanceof DuckfficerMethodError)) {
        throw new DuckfficerMethodError(error.message, input, error)
      }

      throw error
    }
  }

  return async (givenInput) => {
    const input = await getInput(givenInput)
    const resultManager = await getResult(input) // raw data returned from the given handler
    resultManager.output = await getOutput(resultManager.result) // possibly transformed data given the output transformer

    return resultManager
  }
}
