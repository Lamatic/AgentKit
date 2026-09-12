'use strict';

var define = require('define-properties');
var getPolyfill = require('./polyfill');

var $IteratorPrototype = require('../Iterator.prototype/implementation');

module.exports = function shimIteratorPrototypeJoin() {
	var polyfill = getPolyfill();

	define(
		$IteratorPrototype,
		{ join: polyfill },
		{ join: function () { return $IteratorPrototype.join !== polyfill; } }
	);

	return polyfill;
};
