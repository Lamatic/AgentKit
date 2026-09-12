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

var index = require('../Iterator.prototype.chunks');
var impl = require('../Iterator.prototype.chunks/implementation');

var fnName = 'chunks';

var isEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = {
	tests: function (chunks, name, t) {
		t['throws'](
			function () { return new chunks(); }, // eslint-disable-line new-cap
			TypeError,
			'`' + name + '` is not a constructor'
		);

		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { chunks(nonObject, 1); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);
		});

		forEach([undefined, NaN, 0.5, 1.5, Infinity, -Infinity, '2', true, null, {}, [2], { valueOf: function () { return 2; } }], function (nonIntegralNumber) {
			t['throws'](
				function () { chunks({ next: function () {} }, nonIntegralNumber); },
				TypeError,
				debug(nonIntegralNumber) + ' is not an integral Number'
			);
		});

		forEach([0, -1, -2, 4294967296, 4294967297], function (outOfRange) {
			t['throws'](
				function () { chunks({ next: function () {} }, outOfRange); },
				RangeError,
				debug(outOfRange) + ' is not in the inclusive interval from 1 to 2 ** 32 - 1'
			);
		});

		t.test('actual iteration', { skip: !hasSymbols }, function (st) {
			var arr = [1, 2, 3, 4, 5];
			var iterator = callBind(arr[Symbol.iterator], arr);

			var chunked2 = [];
			var iter2 = chunks(iterator(), 2);
			var step;
			step = iter2.next();
			while (!step.done) {
				chunked2.push(step.value);
				step = iter2.next();
			}
			st.deepEqual(chunked2, [[1, 2], [3, 4], [5]], 'chunks(2) of [1,2,3,4,5] yields [[1,2],[3,4],[5]]');

			var chunked3 = [];
			var iter3 = chunks(iterator(), 3);
			step = iter3.next();
			while (!step.done) {
				chunked3.push(step.value);
				step = iter3.next();
			}
			st.deepEqual(chunked3, [[1, 2, 3], [4, 5]], 'chunks(3) of [1,2,3,4,5] yields [[1,2,3],[4,5]]');

			var chunked5 = [];
			var iter5 = chunks(iterator(), 5);
			step = iter5.next();
			while (!step.done) {
				chunked5.push(step.value);
				step = iter5.next();
			}
			st.deepEqual(chunked5, [[1, 2, 3, 4, 5]], 'chunks(5) of [1,2,3,4,5] yields [[1,2,3,4,5]]');

			var chunked10 = [];
			var iter10 = chunks(iterator(), 10);
			step = iter10.next();
			while (!step.done) {
				chunked10.push(step.value);
				step = iter10.next();
			}
			st.deepEqual(chunked10, [[1, 2, 3, 4, 5]], 'chunks(10) of [1,2,3,4,5] yields [[1,2,3,4,5]]');

			var chunked1 = [];
			var iter1 = chunks(iterator(), 1);
			step = iter1.next();
			while (!step.done) {
				chunked1.push(step.value);
				step = iter1.next();
			}
			st.deepEqual(chunked1, [[1], [2], [3], [4], [5]], 'chunks(1) of [1,2,3,4,5] yields [[1],[2],[3],[4],[5]]');

			var emptyChunks = [];
			var iterEmpty = chunks([][Symbol.iterator](), 2);
			step = iterEmpty.next();
			while (!step.done) {
				emptyChunks.push(step.value);
				step = iterEmpty.next();
			}
			st.deepEqual(emptyChunks, [], 'chunks(2) of empty yields nothing');

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

				var iter = chunks(testIter, 3);
				iter.next(); // start iteration, not yet a full chunk
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
