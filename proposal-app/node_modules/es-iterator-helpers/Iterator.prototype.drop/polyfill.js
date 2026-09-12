'use strict';

var MAX_SAFE_INTEGER = require('math-intrinsics/constants/maxSafeInteger');

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	if (typeof Iterator === 'function' && typeof Iterator.prototype.drop === 'function') {
		try {
			// https://issues.chromium.org/issues/336839115
			Iterator.prototype.drop.call({ next: null }, 0).next();
		} catch (e) {
			var earlyCloseCount = 0;
			try {
				Iterator.prototype.drop.call(
					{
						next: function () {},
						'return': function () {
							earlyCloseCount += 1;
							return {};
						}
					},
					MAX_SAFE_INTEGER + 1
				);
			} catch (e2) { /**/ }
			if (earlyCloseCount > 0) {
				return Iterator.prototype.drop;
			}
		}
	}
	return implementation;
};
