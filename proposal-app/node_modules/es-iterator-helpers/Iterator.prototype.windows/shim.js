'use strict';

var define = require('define-properties');
var getPolyfill = require('./polyfill');

var $IteratorPrototype = require('../Iterator.prototype/implementation');

module.exports = function shimIteratorPrototypeWindows() {
	var polyfill = getPolyfill();

	define(
		$IteratorPrototype,
		{ windows: polyfill },
		{ windows: function () { return $IteratorPrototype.windows !== polyfill; } }
	);

	return polyfill;
};
