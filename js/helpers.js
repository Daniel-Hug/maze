// Get elements by CSS selector:
function qs(selector, scope) {
	return (scope || document).querySelector(selector);
}
function qsa(selector, scope) {
	return (scope || document).querySelectorAll(selector);
}


function extend(source, destination) {
	for (var key in source) {
		if (source.hasOwnProperty(key)) {
			destination[key] = source[key];
		}
	}
	return destination;
}


function createInterval(fn, delay, thisVal /*, argumentToPass1, argumentToPass2, etc. */) {
	var argsToPass = Array.prototype.slice.call(arguments, 3),
		id,
		obj = {
			going: false,
			start: function start() {
				if (this.going) return;
				repeater();
				this.going = true;
			},
			stop: function stop() {
				clearTimeout(id);
				this.going = false;
			}
		};
	function repeater() {
		fn.apply(thisVal, argsToPass);
		id = setTimeout(repeater, delay);
	}
	return obj;
}

// Create an interval:
//
// var frameRefresher = createInterval(refreshFrame, 100, this);
//
//
// Start it:
//
// frameRefresher.start();
//
//
// Stop it:
//
// frameRefresher.stop();