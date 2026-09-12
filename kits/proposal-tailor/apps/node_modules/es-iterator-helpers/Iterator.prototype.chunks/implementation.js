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

var MAX_CHUNK_SIZE = 0xFFFFFFFF; // 2^32 - 1

module.exports = function chunks(chunkSize) {
	if (this instanceof chunks) {
		throw new $TypeError('`chunks` is not a constructor');
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

	if (typeof chunkSize !== 'number' || !isInteger(chunkSize)) { // step 4
		var error = ThrowCompletion(new $TypeError('`chunkSize` must be an integral Number')); // step 4.a
		return IteratorClose(iterated, error); // step 4.b
	}

	if (chunkSize < 1 || chunkSize > MAX_CHUNK_SIZE) { // step 5
		var error2 = ThrowCompletion(new $RangeError('`chunkSize` must be an integer from 1 to 2 ** 32 - 1')); // step 5.a
		return IteratorClose(iterated, error2); // step 5.b
	}

	iterated = GetIteratorDirect(O); // step 6

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
	var closure = function () { // step 7
		var buffer = []; // step 7.a
		while (true) { // step 7.b
			var value = IteratorStepValue(iterated); // step 7.b.i
			if (iterated['[[Done]]']) { // step 7.b.ii
				if (buffer.length > 0) { // step 7.b.ii.a
					return buffer; // Yield(CreateArrayFromList(buffer)) // step 7.b.ii.a.1
				}
				return sentinel; // ReturnCompletion(undefined) // step 7.b.ii.b
			}
			buffer[buffer.length] = value; // step 7.b.iii
			if (buffer.length === chunkSize) { // step 7.b.iv
				return buffer; // step 7.b.iv.a - Yield(CreateArrayFromList(buffer))
				// step 7.b.iv.b - IfAbruptCloseIterator handled by CreateIteratorFromClosure
				// step 7.b.iv.c - buffer is reset on next call since closure re-enters
			}
		}
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation
	SLOT.set(closure, '[[CloseIfAbrupt]]', closeIfAbrupt); // for the userland implementation

	var result = CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto, ['[[UnderlyingIterators]]']); // step 8

	SLOT.set(result, '[[UnderlyingIterators]]', [iterated]); // step 9

	return result; // step 10
};
