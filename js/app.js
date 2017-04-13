// Get element position:
function getOffset(el) {
	return {
		top: el.offsetTop,
		left: el.offsetLeft,
		bottom: el.offsetTop + el.offsetHeight,
		right: el.offsetLeft + el.offsetWidth
	};
}


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


// Update score:
Game.prototype.setScore = function(method, amount) {
	if (method === 'add') this.score += amount;
	else                  this.score -= amount;

	[].forEach.call(this.scoreEls, function(scoreEl) {
		scoreEl.textContent = this.score;
	}, this);
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

Game.prototype.movePlayer = function(sidePositions) {
	var ps = this.player.el.style;
	ps.left = sidePositions.left + 'px';
	ps.top  = sidePositions.top + 'px';
	this.player.pos = sidePositions;
};

// Move one pixel for each direction and check if move is valid.
Game.prototype.movTick = function() {
	var t = this;

	// ensure player position changed
	var newPos = this.getNewPlayerPosition();
	if (!newPos) return;

	// ensure valid player position
	if (!this.isValidPlayerPosition(newPos)) return;

	// Finish-line collision:
	if (this.touches(newPos, t.solids[this.finishI]) && !this.finished) {
		this.setScore('add', 250);
		this.finished = true;
	}

	// Coin collision:
	[].forEach.call(t.coins, function(coinPos, i) {
		if (this.touches(newPos, coinPos)) {
			this.setScore('add', 50);
			delete this.coins[i];
			this.coinEls[i].parentNode.removeChild(this.coinEls[i]);
		}
	}, t);

	this.movePlayer(newPos);
};


// Create a game:
var game = (function() {
	// Viewport element & style:
	var viewportEl = qs(".game");
	var cs = getComputedStyle(viewportEl);

	// Grab necessary game elements:
	var solidEls  = qsa('.solid',  viewportEl);
	var coinEls   = qsa('.coin',   viewportEl);
	var playerEl =  qs(".player", viewportEl);

	// Create game passing initial state
	return new Game({
		viewport: {
			width:  parseInt(cs.width,  10),
			height: parseInt(cs.height, 10)
		},

		// Positions of solids:
		solids: [].map.call(solidEls, getOffset),

		// Coins and their positions:
		coinEls: coinEls,
		coins: [].map.call(coinEls, getOffset),

		// Player and their position:
		player: {
			el: playerEl,
			pos: getOffset(playerEl)
		},

		scoreEls: qsa('.score',  viewportEl),

		// index of finish line among the solids
		finishI: [].indexOf.call(solidEls, qs(".finish", viewportEl))
	});
})();