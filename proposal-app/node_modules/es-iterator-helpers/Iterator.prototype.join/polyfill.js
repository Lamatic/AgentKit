'use strict';

var implementation = require('./implementation');

module.exports = function getPolyfill() {
	return typeof Iterator === 'function' && typeof Iterator.prototype.join === 'function'
		? Iterator.prototype.join
		: implementation;
};
