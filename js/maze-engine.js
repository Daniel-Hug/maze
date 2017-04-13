// Game constructor:
var Game = function(options) {
	// options will override the following defaults if set
	var offset = extend(options, extend({
		// Initial game state defaults
		score: 0,
		finished: false,
		player: {},
		step: 2
	}, this));

	// Setup interval. Delay controlls tickrate:
	this.frameRefresher = createInterval(function() {
		this.movTick();
	}, 10, this);

	this.frameRefresher.start();
};


// Checks if an element is inside its viewport:
Game.prototype.insideGameArea = function(offset) {
	return !(
		offset.left < 0 ||
		offset.top  < 0 ||
		offset.right  > this.viewport.width ||
		offset.bottom > this.viewport.height
	);
};

// Checks if rectangle a overlaps rectangle b
Game.prototype.overlaps = function(a, b) {
	// no horizontal overlap
    if (a.left >= b.right || b.left >= a.right) return false;
 
	// no vertical overlap
    if (a.top >= b.bottom || b.top >= a.bottom) return false;
 
    return true;
};

// Checks if rectangle a touches rectangle b
Game.prototype.touches = function(a, b) {
	// has horizontal gap
    if (a.left > b.right || b.left > a.right) return false;
 
	// has vertical gap
    if (a.top > b.bottom || b.top > a.bottom) return false;
 
    return true;
};

Game.prototype.getNewPlayerPosition = (function() {
	// Which keys are pressed:
	var keys = {
		left: false,
		right: false,
		up: false,
		down: false
	};

	var keyCodeMap = {
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down'
	};

	// Keydown listener
	document.body.addEventListener('keydown', function(event) {
		Object.keys(keyCodeMap).forEach(function(keyCode) {
			if (event.keyCode === +keyCode) keys[keyCodeMap[keyCode]] = true;
		});
	});

	// Keyup listener
	document.body.addEventListener('keyup', function(e) {
		Object.keys(keyCodeMap).forEach(function(keyCode) {
			if (event.keyCode === +keyCode) keys[keyCodeMap[keyCode]] = false;
		});
	});

	return function() {
		var moved = false;
		var offset = extend(this.player.pos, {});

		if (!(keys.up && keys.down)) {
			if      (keys.up)    { offset.top -= this.step; offset.bottom -= this.step; moved = true; }
			else if (keys.down)  { offset.top += this.step; offset.bottom += this.step; moved = true; }
		}
		if (!(keys.left && keys.right)) {
			if      (keys.left)  { offset.left -= this.step; offset.right -= this.step; moved = true; }
			else if (keys.right) { offset.left += this.step; offset.right += this.step; moved = true; }
		}
		return moved ? offset : null;
	};
})();

Game.prototype.isValidPlayerPosition = function(sidePositions) {
	// Ensure move is inside the game area:
	if (!this.insideGameArea(sidePositions)) return false;

	// Ensure we're not entering a solid:
	if ([].some.call(this.solids, function(solidPos, i) {
		return this.overlaps(sidePositions, solidPos);
	}, this)) return false;
 
    return true;
};

// Move one pixel for each direction and check if move is valid.
Game.prototype.movTick = function() {
	var t = this;

	// ensure player position changed
	var newPos = this.getNewPlayerPosition();
	if (!newPos) return;

	// ensure valid player position
	if (!this.isValidPlayerPosition(newPos)) return;

	// Touchable collisions:
	Object.keys(this.touchables).forEach(function(name) {
		var touchable = this.touchables[name];
		var positions = touchable.positions;
		for (var i = 0; i < positions.length; i++) {
			if (this.touches(newPos, positions[i])) {
				touchable.onTouch.call(this, positions[i], i);
			}
		}
	}, t);

	this.player.move.call(this, newPos);
};