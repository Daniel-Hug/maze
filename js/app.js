// Create a game:
var game = (function() {
	// Viewport element & style:
	var viewportEl = qs(".game");
	var cs = getComputedStyle(viewportEl);

	// Grab necessary game elements:
	var playerEl =  qs(".player", viewportEl);
	var solidEls  = [].slice.call(qsa('.solid',  viewportEl));
	var scoreEls = [].slice.call(qsa('.score',  viewportEl));
	var coinEls   = [].slice.call(qsa('.coin',   viewportEl));
	var solids = [].map.call(solidEls, getOffset);

	var finishI = [].indexOf.call(solidEls, qs(".finish", viewportEl));

	// Get element position:
	function getOffset(el) {
		return {
			top: el.offsetTop,
			left: el.offsetLeft,
			bottom: el.offsetTop + el.offsetHeight,
			right: el.offsetLeft + el.offsetWidth
		};
	}

	// Create game passing initial state
	return new Game({
		viewport: {
			width:  parseInt(cs.width,  10),
			height: parseInt(cs.height, 10)
		},

		// Player position and move function:
		player: {
			pos: getOffset(playerEl),
			move: function(sidePositions) {
				var ps = playerEl.style;
				ps.left = sidePositions.left + 'px';
				ps.top  = sidePositions.top + 'px';
				this.player.pos = sidePositions;
			}
		},

		// Positions of solids:
		solids: solids,

		touchables: {
			coin: {
				positions: coinEls.map(getOffset),
				onTouch: function(pos, i) {
					this.setScore('add', 50);
					this.touchables.coin.positions.splice(i, 1);
					coinEls[i].parentNode.removeChild(coinEls[i]);
					coinEls.splice(i, 1);
				}
			},
			finish: {
				positions: [solids[finishI]],
				onTouch: function() {
					if (this.finished) return;
					this.setScore('add', 250);
					this.finished = true;
				}
			}
		},

		setScore: function(method, amount) {
			if (method === 'add') this.score += amount;
			else                  this.score -= amount;

			scoreEls.forEach(function(scoreEl) {
				scoreEl.textContent = this.score;
			}, this);
		}
	});
})();