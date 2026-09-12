'use strict';

var $TypeError = require('es-errors/type');

var GetIteratorDirect = require('es-abstract/2025/GetIteratorDirect');
var IteratorClose = require('es-abstract/2025/IteratorClose');
var IteratorStepValue = require('es-abstract/2025/IteratorStepValue');
var ThrowCompletion = require('es-abstract/2025/ThrowCompletion');
var ToString = require('es-abstract/2025/ToString');

var isObject = require('es-abstract/helpers/isObject');

module.exports = function join(separator) {
	if (this instanceof join) {
		throw new $TypeError('`join` is not a constructor');
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

	var sep;
	if (typeof separator === 'undefined') { // step 4
		sep = ','; // step 4.a
	} else {
		try {
			sep = ToString(separator); // step 5.a
		} catch (e) {
			return IteratorClose(iterated, ThrowCompletion(e)); // step 5.b - IfAbruptCloseIterator
		}
	}

	iterated = GetIteratorDirect(O); // step 6

	var R = ''; // step 7
	var first = true; // step 8

	while (true) { // step 9
		var value = IteratorStepValue(iterated); // step 9.a
		if (iterated['[[Done]]']) {
			return R; // step 9.b
		}
		if (first) { // step 9.c
			first = false; // step 9.c.i
		} else { // step 9.d
			R += sep; // step 9.d.i
		}
		if (value !== void undefined && value !== null) { // step 9.e
			var S;
			try {
				S = ToString(value); // step 9.e.i
			} catch (e) {
				return IteratorClose(iterated, ThrowCompletion(e)); // step 9.e.ii - IfAbruptCloseIterator
			}
			R += S; // step 9.e.iii
		}
	}
};
