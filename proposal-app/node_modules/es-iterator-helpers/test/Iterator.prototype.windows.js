'use strict';

var defineProperties = require('define-properties');
var test = require('tape');
var callBind = require('call-bind');
var functionsHaveNames = require('functions-have-names')();
var hasStrictMode = require('has-strict-mode')();
var forEach = require('for-each');
var debug = require('object-inspect');
var v = require('es-value-fixtures');
var hasSymbols = require('has-symbols/shams')();

var index = require('../Iterator.prototype.windows');
var impl = require('../Iterator.prototype.windows/implementation');

var fnName = 'windows';

var isEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = {
	tests: function (windows, name, t) {
		t['throws'](
			function () { return new windows(); }, // eslint-disable-line new-cap
			TypeError,
			'`' + name + '` is not a constructor'
		);

		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { windows(nonObject, 1); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);
		});

		forEach([undefined, NaN, 0.5, 1.5, Infinity, -Infinity, '2', true, null, {}, [2], { valueOf: function () { return 2; } }], function (nonIntegralNumber) {
			t['throws'](
				function () { windows({ next: function () {} }, nonIntegralNumber); },
				TypeError,
				debug(nonIntegralNumber) + ' is not an integral Number'
			);
		});

		forEach([0, -1, -2, 4294967296, 4294967297], function (outOfRange) {
			t['throws'](
				function () { windows({ next: function () {} }, outOfRange); },
				RangeError,
				debug(outOfRange) + ' is not in the inclusive interval from 1 to 2 ** 32 - 1'
			);
		});

		forEach(['bad', 0, false, null], function (badUndersized) {
			t['throws'](
				function () { windows({ next: function () {} }, 1, badUndersized); },
				TypeError,
				debug(badUndersized) + ' is not a valid undersized option'
			);
		});

		t.test('actual iteration', { skip: !hasSymbols }, function (st) {
			var arr = [1, 2, 3, 4, 5];
			var iterator = callBind(arr[Symbol.iterator], arr);

			var windowed2 = [];
			var iter2 = windows(iterator(), 2);
			var step;
			step = iter2.next();
			while (!step.done) {
				windowed2.push(step.value);
				step = iter2.next();
			}
			st.deepEqual(windowed2, [[1, 2], [2, 3], [3, 4], [4, 5]], 'windows(2) of [1,2,3,4,5] yields sliding windows');

			var windowed3 = [];
			var iter3 = windows(iterator(), 3);
			step = iter3.next();
			while (!step.done) {
				windowed3.push(step.value);
				step = iter3.next();
			}
			st.deepEqual(windowed3, [[1, 2, 3], [2, 3, 4], [3, 4, 5]], 'windows(3) of [1,2,3,4,5] yields sliding windows');

			var windowed1 = [];
			var iter1 = windows(iterator(), 1);
			step = iter1.next();
			while (!step.done) {
				windowed1.push(step.value);
				step = iter1.next();
			}
			st.deepEqual(windowed1, [[1], [2], [3], [4], [5]], 'windows(1) of [1,2,3,4,5] yields single-element windows');

			var windowed10 = [];
			var iter10 = windows(iterator(), 10);
			step = iter10.next();
			while (!step.done) {
				windowed10.push(step.value);
				step = iter10.next();
			}
			st.deepEqual(windowed10, [], 'windows(10) of [1,2,3,4,5] with only-full yields nothing');

			var windowedPartial = [];
			var iterPartial = windows(iterator(), 10, 'allow-partial');
			step = iterPartial.next();
			while (!step.done) {
				windowedPartial.push(step.value);
				step = iterPartial.next();
			}
			st.deepEqual(windowedPartial, [[1, 2, 3, 4, 5]], 'windows(10, "allow-partial") of [1,2,3,4,5] yields [[1,2,3,4,5]]');

			var windowedOnlyFull = [];
			var iterOnlyFull = windows(iterator(), 10, 'only-full');
			step = iterOnlyFull.next();
			while (!step.done) {
				windowedOnlyFull.push(step.value);
				step = iterOnlyFull.next();
			}
			st.deepEqual(windowedOnlyFull, [], 'windows(10, "only-full") of [1,2,3,4,5] yields nothing');

			var emptyWindows = [];
			var iterEmpty = windows([][Symbol.iterator](), 2);
			step = iterEmpty.next();
			while (!step.done) {
				emptyWindows.push(step.value);
				step = iterEmpty.next();
			}
			st.deepEqual(emptyWindows, [], 'windows(2) of empty yields nothing');

			var emptyPartial = [];
			var iterEmptyPartial = windows([][Symbol.iterator](), 2, 'allow-partial');
			step = iterEmptyPartial.next();
			while (!step.done) {
				emptyPartial.push(step.value);
				step = iterEmptyPartial.next();
			}
			st.deepEqual(emptyPartial, [], 'windows(2, "allow-partial") of empty yields nothing');

			st.test('windows yield independent arrays', function (s2t) {
				var iter = windows(iterator(), 3);
				var first = iter.next().value;
				var second = iter.next().value;
				s2t.notEqual(first, second, 'different window arrays are not the same reference');
				s2t.deepEqual(first, [1, 2, 3], 'first window');
				s2t.deepEqual(second, [2, 3, 4], 'second window');
				s2t.end();
			});

			st.test('return() closes underlying iterator', function (s2t) {
				var returnCalls = 0;
				var testIter = {
					next: function () { return { done: false, value: 1 }; },
					'return': function () {
						returnCalls += 1;
						return { done: true };
					}
				};
				testIter[Symbol.iterator] = function () { return testIter; };

				var iter = windows(testIter, 3);
				iter.next(); // start filling buffer (not yet a full window)
				s2t.equal(returnCalls, 0, 'return not yet called');

				iter['return']();
				s2t.equal(returnCalls, 1, 'return called on underlying iterator');

				s2t.end();
			});

			st.end();
		});
	},
	index: function () {
		test('Iterator.prototype.' + fnName + ': index', function (t) {
			module.exports.tests(index, 'Iterator.prototype.' + fnName, t);

			t.end();
		});
	},
	implementation: function () {
		test('Iterator.prototype.' + fnName + ': implementation', function (t) {
			module.exports.tests(callBind(impl), 'Iterator.prototype.' + fnName, t);

			t['throws'](
				function () { return new impl(); }, // eslint-disable-line new-cap
				TypeError,
				'`' + fnName + '` is not a constructor'
			);

			t.end();
		});
	},
	shimmed: function () {
		test('Iterator.prototype.' + fnName + ': shimmed', function (t) {
			t.test('Function name', { skip: !functionsHaveNames }, function (st) {
				st.equal(Iterator.prototype[fnName].name, fnName, 'Iterator#' + fnName + ' has name "' + fnName + '"');
				st.end();
			});

			t.test('enumerability', { skip: !defineProperties.supportsDescriptors }, function (et) {
				et.equal(false, isEnumerable.call(Iterator.prototype, fnName), 'Iterator#' + fnName + ' is not enumerable');
				et.end();
			});

			t.test('bad string/this value', { skip: !hasStrictMode }, function (st) {
				st['throws'](function () { return Iterator.prototype[fnName].call(undefined, 1); }, TypeError, 'undefined is not an object');
				st['throws'](function () { return Iterator.prototype[fnName].call(null, 1); }, TypeError, 'null is not an object');
				st.end();
			});

			t['throws'](
				function () { return new Iterator.prototype[fnName](); },
				TypeError,
				'`' + fnName + '` is not a constructor'
			);

			module.exports.tests(callBind(Iterator.prototype[fnName]), 'Iterator.prototype.' + fnName, t);

			t.end();
		});
	}
};
