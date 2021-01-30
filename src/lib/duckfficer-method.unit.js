import test from 'ava'
import { ValidationError } from 'duckfficer'
import { duckfficerMethod } from './duckfficer-method.js'
import { DuckfficerMethodError } from './errors/duckfficer-method-error.js'
import { InvalidEventError } from './errors/invalid-event-error.js'
import { InvalidErrorError } from './errors/invalid-error-error.js'
import { InvalidInputError } from './errors/invalid-input-error.js'
import { InvalidOutputError } from './errors/invalid-output-error.js'

test('returns a function', async (t) => {
  const method = duckfficerMethod({
    handler () {}
  })

  t.is(typeof method, 'function')
})

test('validates input', async (t) => {
  const method = duckfficerMethod({
    input: String,
    handler (input) {
      return input
    }
  })

  const error = await t.throwsAsync(() => method(1), {
    instanceOf: InvalidInputError,
    message: 'Invalid input'
  })

  t.true(error.originalError instanceof ValidationError)
  t.is(error.originalError.message, 'Invalid string')

  t.is((await method('yellOo!')).result, 'yellOo!')
})

test('validates output', async (t) => {
  const method = duckfficerMethod({
    input: String,
    output: String,
    handler (input) {
      return input === 'wrong' ? 1 : input
    }
  })

  const error = await t.throwsAsync(() => method('wrong'), {
    instanceOf: InvalidOutputError,
    message: 'Invalid output'
  })

  t.is(error.originalError.message, 'Invalid string')
  t.is((await method('right')).result, 'right')
})

test('validates events', async (t) => {
  const method = duckfficerMethod({
    input: {
      eventName: String,
      eventPayload: Object
    },
    events: {
      SomethingHappened: {
        what: String,
        when: Date
      }
    },
    async handler ({ eventName, eventPayload }) {
      await this.emit(eventName, eventPayload)
    }
  })

  const eventName = 'SomethingHappened'
  const eventPayload = {
    what: 'serendipity',
    when: new Date()
  }

  const result = await method({
    eventName,
    eventPayload
  })

  t.like(result.eventsEmitted[0], {
    name: eventName,
    payload: eventPayload
  })

  const error = await t.throwsAsync(() => method({
      eventName: 'Ouch',
      eventPayload
    }), {
    instanceOf: InvalidEventError,
    message: `Invalid event`
  })

  t.is(error.originalError.message, 'Event "Ouch" not found!')
})

test('validates errors', async (t) => {
  const method = duckfficerMethod({
    input: {
      errorName: String,
      errorPayload: Object
    },
    errors: {
      SomethingWentWrong: {
        what: String,
        when: Date
      }
    },
    async handler ({ errorName, errorPayload }) {
      await this.throw(errorName, errorPayload)
    }
  })

  const errorName = 'SomethingWentWrong'
  const errorPayload = {
    what: 'something broke',
    when: new Date()
  }

  const result = await method({
    errorName,
    errorPayload
  })

  t.like(result.errorsThrown[0], {
    name: errorName,
    payload: errorPayload
  })

  const error = await t.throwsAsync(() => method({
    errorName: 'Ouch',
    errorPayload
  }), {
    instanceOf: InvalidErrorError,
    message: `Invalid error`
  })

  t.is(error.originalError.message, 'Error "Ouch" not found!')
})

test('throws handler errors', async (t) => {
  const throwableError = new Error('jolines!')
  const method = duckfficerMethod({
    async handler () {
      throw throwableError
    }
  })

  const error = await t.throwsAsync(method, {
    instanceOf: DuckfficerMethodError,
    message: 'jolines!'
  })

  t.is(error.originalError, throwableError)
})
