'use strict';

var MAX_SAFE_INTEGER = require('math-intrinsics/constants/maxSafeInteger');

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	if (typeof Iterator === 'function' && typeof Iterator.prototype.take === 'function') {
		var earlyCloseCount = 0;
		try {
			Iterator.prototype.take.call(
				{
					next: function () {},
					'return': function () {
						earlyCloseCount += 1;
						return {};
					}
				},
				MAX_SAFE_INTEGER + 1
			);
		} catch (e) { /**/ }
		if (earlyCloseCount > 0) {
			return Iterator.prototype.take;
		}
	}
	return implementation;
};
