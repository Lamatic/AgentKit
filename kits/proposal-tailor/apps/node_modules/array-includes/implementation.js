'use strict';

var ToIntegerOrInfinity = require('es-abstract/2025/ToIntegerOrInfinity');
var ToLength = require('es-abstract/2025/ToLength');
var ToObject = require('es-object-atoms/ToObject');
var SameValueZero = require('es-abstract/2025/SameValueZero');
var $max = require('math-intrinsics/max');
var callBound = require('call-bound');
var isString = require('is-string');

var $charAt = callBound('String.prototype.charAt');

module.exports = function includes(searchElement) {
	var fromIndex = arguments.length > 1 ? ToIntegerOrInfinity(arguments[1]) : 0;

	var O = ToObject(this);
	var length = ToLength(O.length);
	if (length === 0) {
		return false;
	}
	var k = fromIndex >= 0 ? fromIndex : $max(0, length + fromIndex);
	while (k < length) {
		if (SameValueZero(searchElement, isString(O) ? $charAt(O, k) : O[k])) {
			return true;
		}
		k += 1;
	}
	return false;
};
