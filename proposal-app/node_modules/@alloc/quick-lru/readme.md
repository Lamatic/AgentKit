# @alloc/quick-lru [![Build Status](https://travis-ci.org/aleclarson/quick-lru.svg?branch=master)](https://travis-ci.org/aleclarson/quick-lru) [![Coverage Status](https://coveralls.io/repos/github/aleclarson/quick-lru/badge.svg?branch=master)](https://coveralls.io/github/aleclarson/quick-lru?branch=master)

> Simple [“Least Recently Used” (LRU) cache](https://en.m.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29)

This is a CommonJS-only fork of [`quick-lru`](https://github.com/sindresorhus/quick-lru).

Useful when you need to cache something and limit memory usage.

See the [algorithm section](#algorithm) for implementation details.

## Install

```
$ npm install @alloc/quick-lru
```

## Usage

```js
const QuickLRU = require('@alloc/quick-lru');

const lru = new QuickLRU({maxSize: 1000});

lru.set('🦄', '🌈');

lru.has('🦄');
//=> true

lru.get('🦄');
//=> '🌈'
```

## API

### new QuickLRU(options?)

Returns a new instance.

### options

Type: `object`

#### maxSize

*Required*\
Type: `number`

The target maximum number of items before evicting the least recently used items.

> **Note:** The dual-cache algorithm may physically retain up to twice `maxSize` entries for performance reasons, even though the reported cache size does not exceed `maxSize`.

#### maxAge

Type: `number`\
Default: `Infinity`

The maximum number of milliseconds an item should remain in cache.
By default maxAge will be Infinity, which means that items will never expire.

Lazy expiration happens upon the next `write` or `read` call.

Individual expiration of an item can be specified by the `set(key, value, options)` method.

#### onEviction

*Optional*\
Type: `(key, value) => void`

Called right before an item is evicted from the cache due to capacity pressure or TTL expiration.

Useful for side effects or for items like object URLs that need explicit cleanup (`revokeObjectURL`).

This callback is not called for manual removals via `delete()` or `clear()`.

### Instance

The instance is [`iterable`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols) so you can use it directly in a [`for…of`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/for...of) loop.

Both `key` and `value` can be of any type.

#### .set(key, value, options?)

Set an item. Returns the instance.

Individual expiration of an item can be specified with the `maxAge` option. If not specified, the global `maxAge` value will be used in case it is specified on the constructor, otherwise the item will never expire.

#### .get(key)

Get an item.

#### .has(key)

Check if an item exists.

#### .peek(key)

Get an item without marking it as recently used.

#### .expiresIn(key)

Get the remaining time to live (in milliseconds) for the given item, or `undefined` if the item is not in the cache.

- Does not mark the item as recently used.
- Does not trigger lazy expiration or remove the entry when it is expired.
- Returns `Infinity` if the item has no expiration.
- May return a negative number if the item has already expired but has not yet been lazily removed.

#### .delete(key)

Delete an item.

Returns `true` if the item is removed or `false` if the item doesn't exist.

#### .clear()

Delete all items.

#### .resize(maxSize)

Update the `maxSize`, discarding items as necessary. Insertion order is mostly preserved, though this is not a strong guarantee.

Useful for on-the-fly tuning of cache sizes in live systems.

#### .keys()

Iterable for all the keys.

#### .values()

Iterable for all the values.

#### .entriesAscending()

Iterable for all entries, starting with the oldest (ascending in recency).

#### .entriesDescending()

Iterable for all entries, starting with the newest (descending in recency).

#### .size

The stored item count.

## Algorithm

This library implements a variant of the [`hashlru` algorithm](https://github.com/dominictarr/hashlru#algorithm) using two [`Map`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) objects. One map holds recently added or accessed entries, while the other holds older entries. When the recent map reaches `maxSize`, it replaces the older map and a new recent map is created.

This avoids the frequent delete operations required by a traditional linked-list LRU and supports keys of any type and `undefined` values. The tradeoff is that the two maps may physically retain up to twice the target `maxSize` between rotations. Use a strict-size cache when that temporary memory overhead is unacceptable.

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-quick-lru?utm_source=npm-quick-lru&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
