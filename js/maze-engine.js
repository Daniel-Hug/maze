// Game constructor:
var Game = function(options) {
	// options will override the following defaults if set
	var offset = extend(options, extend({
		moveables: { player: {
			pos: {
				top: 0,
				left: 0,
				bottom: 24,
				right: 24
			}
		}},
		fps: 100
	}, this));

	// start listening to user events
	this.init();

	// Setup interval. Delay controlls frame rate:
	this.frameRefresher = createInterval(function() {
		this.movTick();
	}, 1000 / this.fps, this);

	this.frameRefresher.start();
};

// Update player direction and speed on keypress
Game.prototype.init = (function() {
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

	function updatePlayerVector() {
		// get new direction
		var deltaX = 0;
		var deltaY = 0;
		if (keys.up)    { deltaY -= 1; }
		if (keys.down)  { deltaY += 1; }
		if (keys.left)  { deltaX -= 1; }
		if (keys.right) { deltaX += 1; }

		// stop moving if there's no position change
		var player = this.moveables.player;
		player.moving = !!(deltaY || deltaX);

		if (player.moving) {
			player.direction = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
		}
	}

	return function() {
		var updateVector = updatePlayerVector.bind(this);

		document.body.addEventListener('keydown', function(event) {
			// update player vector if an arrow key was pressed
			if (Object.keys(keyCodeMap).some(function(keyCode) {
				if (event.keyCode === +keyCode) {
					var key = keyCodeMap[keyCode];
					if (keys[key] === true) return;
					keys[key] = true;
					return true;
				}
			})) updateVector();
		});

		document.body.addEventListener('keyup', function(e) {
			// update player vector if an arrow key was released
			if (Object.keys(keyCodeMap).some(function(keyCode) {
				if (event.keyCode === +keyCode) {
					var key = keyCodeMap[keyCode];
					if (keys[key] === false) return;
					keys[key] = false;
					return true;
				}
			})) updateVector();
		});
	};
})();

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

Game.prototype.getNewPosition = function(moveable) {
	if (!moveable.moving) return null;

	// get player speed in "pixels per frame" by dividing their speed in "pixels per second" by the game fps
	var stepRadius = moveable.pixelsPerSecond / this.fps;
	var stepAngle = moveable.direction / 180 * Math.PI;
	var deltaX = stepRadius * Math.cos(stepAngle);
	var deltaY = stepRadius * Math.sin(stepAngle);

	function removeMagnitude(num) {
		return num > 0 ? 1 : (num < 0 ? -1 : 0);
	}

	var xIncrement;
	var yIncrement;
	var numIterations = 0;
	if (Math.abs(deltaX) > Math.abs(deltaY)) {
		xIncrement = removeMagnitude(deltaX);
		yIncrement = xIncrement / deltaX * deltaY;
		numIterations = deltaX / xIncrement;
	} else {
		yIncrement = removeMagnitude(deltaY);
		xIncrement = yIncrement / deltaY * deltaX;
		numIterations = deltaY / yIncrement;
	}

	// get farthest valid step within deltaX, deltaY:
	var validStep = moveable.pos;
	var stepped = false;
	for (var i = 0; i < numIterations; i++) {
		var nextStep = {
			top: validStep.top + yIncrement,
			left: validStep.left + xIncrement,
			bottom: validStep.bottom + yIncrement,
			right: validStep.right + xIncrement
		};
		if (this.isValidPlayerPosition(nextStep)) {
			validStep = nextStep;
			stepped = true;
		} else {
			Object.keys(nextStep).forEach(function(key) {
				nextStep[key] = Math.floor(nextStep[key]);
			});
			if (this.isValidPlayerPosition(nextStep)) {
				validStep = nextStep;
				stepped = true;
			}
			break;
		}
	}

	return stepped ? validStep : null;
};

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
	// ensure player position changed
	var player = this.moveables.player;
	var newPos = this.getNewPosition(player);
	if (!newPos) return;

	// Touchable collisions:
	Object.keys(this.touchables).forEach(function(name) {
		var touchable = this.touchables[name];
		var positions = touchable.positions;
		for (var i = 0; i < positions.length; i++) {
			if (this.touches(newPos, positions[i])) {
				touchable.onTouch.call(this, positions[i], i);
			}
		}
	}, this);

	// update player position
	player.move.call(this, newPos);
	player.pos = newPos;
	console.log(player.pos);
};