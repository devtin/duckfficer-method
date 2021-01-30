<div><h1>duckfficer-method</h1></div>

<p>
    <a href="https://www.npmjs.com/package/duckfficer-method" target="_blank"><img src="https://img.shields.io/npm/v/duckfficer-method.svg" alt="Version"></a>
<a href="http://opensource.org/licenses" target="_blank"><img src="http://img.shields.io/badge/License-MIT-brightgreen.svg"></a>
</p>

<p>
    Creates a function that enforces certain input, output, errors and events using duckfficer
</p>

## Installation

```sh
$ npm i duckfficer-method --save
# or
$ yarn add duckfficer-method
```

## Features

- [returns a function](#returns-a-function)
- [validates input](#validates-input)
- [validates output](#validates-output)
- [validates events](#validates-events)
- [validates errors](#validates-errors)
- [throws handler errors](#throws-handler-errors)


<a name="returns-a-function"></a>

## returns a function


```js
const method = duckfficerMethod({
  handler () {}
})

t.is(typeof method, 'function')
```

<a name="validates-input"></a>

## validates input


```js
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
```

<a name="validates-output"></a>

## validates output


```js
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
```

<a name="validates-events"></a>

## validates events


```js
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
```

<a name="validates-errors"></a>

## validates errors


```js
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
```

<a name="throws-handler-errors"></a>

## throws handler errors


```js
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
```


* * *

### License

[MIT](https://opensource.org/licenses/MIT)

&copy; 2020-present Martin Rafael Gonzalez <tin@devtin.io>
