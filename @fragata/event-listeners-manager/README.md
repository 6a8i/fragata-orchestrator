<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @fragata/event-listeners-manager

[![Package Version](https://badgen.net/npm/v/@fragata/event-listeners-manager)](https://npmjs.org/package/@fragata/event-listeners-manager) ![License](https://badgen.net/npm/license/@fragata/event-listeners-manager) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@fragata/event-listeners-manager)](https://bundlephobia.com/result?p=@fragata/event-listeners-manager) [![Node compatibility](https://badgen.net/npm/node/@fragata/event-listeners-manager)](https://npmjs.org/package/@fragata/event-listeners-manager)

## Install

Installation of the [npm package](https://npmjs.org/package/@fragata/event-listeners-manager):

```sh
npm install --save @fragata/event-listeners-manager
```

## Usage

> This library is compatible with Node's `EventEmitter` and web browsers' `EventTarget` APIs.

### API

```js
import { EventListenersManager } from '@fragata/event-listeners-manager'

const events = new EventListenersManager(emitter)

// adding listeners
events.add('foo', onFoo).add('bar', onBar).on('baz', onBaz)

// removing a specific listener
events.remove('foo', onFoo)

// removing all listeners for a specific event
events.removeAll('foo')

// removing all listeners
events.removeAll()
```

### Typical use case

> Removing all listeners when no longer necessary.

Manually:

```js
const onFoo = () => {}
const onBar = () => {}
const onBaz = () => {}
emitter.on('foo', onFoo).on('bar', onBar).on('baz', onBaz)

// CODE LOGIC

emitter.off('foo', onFoo).off('bar', onBar).off('baz', onBaz)
```

With this library:

```js
const events = new EventListenersManager(emitter)

events.add('foo', () => {})).add('bar', () => {})).add('baz', () => {}))

// CODE LOGIC

events.removeAll()
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/6a8i/fragata-orchestrator/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
