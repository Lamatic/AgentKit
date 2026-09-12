'use strict';

var define = require('define-properties');
var getPolyfill = require('./polyfill');

var $IteratorPrototype = require('../Iterator.prototype/implementation');

module.exports = function shimIteratorPrototypeChunks() {
	var polyfill = getPolyfill();

	define(
		$IteratorPrototype,
		{ chunks: polyfill },
		{ chunks: function () { return $IteratorPrototype.chunks !== polyfill; } }
	);

	return polyfill;
};
