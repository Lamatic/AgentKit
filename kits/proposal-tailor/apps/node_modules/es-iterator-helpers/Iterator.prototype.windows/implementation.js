'use strict';

var $RangeError = require('es-errors/range');
var $TypeError = require('es-errors/type');

var CompletionRecord = require('es-abstract/2025/CompletionRecord');
var CreateIteratorFromClosure = require('es-abstract/2025/CreateIteratorFromClosure');
var GetIteratorDirect = require('es-abstract/2025/GetIteratorDirect');
var IteratorClose = require('es-abstract/2025/IteratorClose');
var IteratorStepValue = require('es-abstract/2025/IteratorStepValue');
var ThrowCompletion = require('es-abstract/2025/ThrowCompletion');

var isInteger = require('math-intrinsics/isInteger');
var isObject = require('es-abstract/helpers/isObject');

var iterHelperProto = require('../IteratorHelperPrototype');

var SLOT = require('internal-slot');

var MAX_WINDOW_SIZE = 0xFFFFFFFF; // 2^32 - 1

module.exports = function windows(windowSize) {
	if (this instanceof windows) {
		throw new $TypeError('`windows` is not a constructor');
	}

	var O = this; // step 1
	if (!isObject(O)) {
		throw new $TypeError('`this` value must be an Object'); // step 2
	}

	var iterated = { // step 3
		'[[Iterator]]': O,
		'[[NextMethod]]': undefined,
		'[[Done]]': false
	};

	if (typeof windowSize !== 'number' || !isInteger(windowSize)) { // step 4
		return IteratorClose(iterated, ThrowCompletion(new $TypeError('`windowSize` must be an integral Number'))); // step 4.a, 4.b
	}

	if (windowSize < 1 || windowSize > MAX_WINDOW_SIZE) { // step 5
		return IteratorClose(iterated, ThrowCompletion(new $RangeError('`windowSize` must be an integer from 1 to 2 ** 32 - 1'))); // step 5.a, 5.b
	}

	var undersized = arguments.length > 1 ? arguments[1] : void undefined;
	if (typeof undersized === 'undefined') { // step 6
		undersized = 'only-full';
	}

	if (undersized !== 'only-full' && undersized !== 'allow-partial') { // step 7
		return IteratorClose(iterated, ThrowCompletion(new $TypeError('`undersized` must be "only-full" or "allow-partial"'))); // step 7.a, 7.b
	}

	iterated = GetIteratorDirect(O); // step 8

	var closeIfAbrupt = function (abruptCompletion) {
		if (!(abruptCompletion instanceof CompletionRecord)) {
			throw new $TypeError('`abruptCompletion` must be a Completion Record');
		}
		IteratorClose(
			iterated,
			abruptCompletion
		);
	};

	var sentinel = {};
	var buffer = []; // step 9.a
	var closure = function () { // step 9
		while (true) { // step 9.b
			var value = IteratorStepValue(iterated); // step 9.b.i
			if (iterated['[[Done]]']) { // step 9.b.ii
				if (undersized === 'allow-partial' && buffer.length > 0 && buffer.length < windowSize) { // step 9.b.ii.a
					var partial = [];
					for (var p = 0; p < buffer.length; p += 1) {
						partial[partial.length] = buffer[p];
					}
					buffer = [];
					return partial; // Yield(CreateArrayFromList(buffer)) // step 9.b.ii.a.1
				}
				return sentinel; // ReturnCompletion(undefined) // step 9.b.ii.b
			}
			if (buffer.length === windowSize) { // step 9.b.iii
				buffer.splice(0, 1); // Remove the first element from buffer // step 9.b.iii.a
			}
			buffer[buffer.length] = value; // step 9.b.iv
			if (buffer.length === windowSize) { // step 9.b.v
				var result = [];
				for (var i = 0; i < buffer.length; i += 1) {
					result[result.length] = buffer[i];
				}
				return result; // step 9.b.v.a - Yield(CreateArrayFromList(buffer))
				// step 9.b.v.b - IfAbruptCloseIterator handled by CreateIteratorFromClosure
			}
		}
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation
	SLOT.set(closure, '[[CloseIfAbrupt]]', closeIfAbrupt); // for the userland implementation

	var result = CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto, ['[[UnderlyingIterators]]']); // step 10

	SLOT.set(result, '[[UnderlyingIterators]]', [iterated]); // step 11

	return result; // step 12
};
