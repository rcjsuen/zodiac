/*eslint-env browser */
const ASCII_SHIFT = 16;
const ASCII_SPACEBAR = 32;
const ASCII_COMMA = 188;
const ASCII_PERIOD = 190;
/**
 * The width and height of the key.
 */
const KEY_DIMENSIONS = 60;
/**
 * How much the key should grow in size if it is pressed.
 */
const KEY_EXPANSION_SIZE = 6;

var canvasKeyboard = document.getElementById("canvas");
var ctx = canvasKeyboard.getContext("2d");

/**
 * Whether the shift key is currently being pressed by the user.
 */
var shiftDown = false;
var spaceDown = false;
var keyDown = [
	[ false, false, false, false, false, false, false, false, false, false ],
	[ false, false, false, false, false, false, false, false, false ],
	[ false, false, false, false, false, false, false, false, false ]
];
var keyboard = [
	[ 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p' ],
	[ 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l' ],
	[ 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.' ]
];

/**
 * Draws the outline of a key.
 * 
 * @param x the desired starting X position of the key
 * @param y the desired starting Y position of the key
 * @param keydown whether this key is currently being pressed by the user
 */
function drawKeyOutline(x, y, keyDown) {
	var dimensions = KEY_DIMENSIONS;
	if (keyDown) {
		x = x - (KEY_EXPANSION_SIZE / 2);	
		y = y - (KEY_EXPANSION_SIZE / 2);
		dimensions = KEY_DIMENSIONS + KEY_EXPANSION_SIZE;
	}
	
	ctx.beginPath();
	ctx.fillStyle = "white";
	ctx.fillRect(x, y, dimensions, dimensions);
	ctx.strokeStyle = "black";
	ctx.strokeRect(x, y, dimensions, dimensions);
	ctx.closePath();
}

function drawKey(x, y, letter, keyDown) {
	drawKeyOutline(x, y, keyDown);
	drawCharacter(x, y, KEY_DIMENSIONS, KEY_DIMENSIONS, letter, keyDown);
}

function drawCharacter(x, y, height, width, letter, keydown) {
	if (shiftDown) {
		letter = letter.toUpperCase();	
	}
	
	ctx.beginPath();
	ctx.font = keydown ? "40pt Verdana" : "20pt Verdana";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = keydown ? "red" : "blue";
	ctx.fillText(letter, (x + x + width) / 2, (y + y + height) / 2);
	ctx.closePath();
}

function drawShiftKey(x, y) {
	drawKeyOutline(x, y);

	ctx.beginPath();
	ctx.font = "15pt Verdana";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = shiftDown ? "red" : "blue";
	ctx.fillText("shift", (x + x + 60) / 2, (y + y + 60) / 2);
	ctx.closePath();
}

/**
 * Draws the keyboard.
 */

function drawSpacebar() {
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.fillStyle = "white";
	if (spaceDown) {
		ctx.strokeRect(112, 217, 486, 66);
		ctx.fillRect(112, 217, 486, 66);
	} else {
		ctx.strokeRect(115, 220, 480, 60);
		ctx.fillRect(115, 220, 480, 60);
	}
	ctx.closePath();
}

function drawKeyboard() {
	// clear the canvas before redrawing
	ctx.clearRect(0, 0, canvasKeyboard.width, canvasKeyboard.height);

	// draw the top row of the keyboard
	for (var i = 0; i < keyboard[0].length; i++) {
		drawKey(70 * i + (10), 10, keyboard[0][i], keyDown[0][i]);
	}

	// draw the home row of the keyboard
	for (var i = 0; i < keyboard[1].length; i++) {
		drawKey(35 + 70 * i + (10), 80, keyboard[1][i], keyDown[1][i]);
	}
	
	// draw the bottom row of the keyboard
	drawShiftKey(10, 150);
	for (var i = 0; i < keyboard[2].length; i++) {
		drawKey(70 + 70 * i + (10), 150, keyboard[2][i], keyDown[2][i]);
	}

	drawSpacebar();
}

function getEventKey(e) {
	if (typeof e.key === "undefined") {
		if (!e.shiftKey) {
			if (e.keyCode === ASCII_COMMA) {
				return ",";
			} else if (e.keyCode === ASCII_PERIOD) {
				return ".";
			}
		}
		// e.key is undefined in Safari 9.0.2 and Chrome 47
		return String.fromCharCode(e.keyCode).toLowerCase();
	}
	return e.key.toLowerCase();
}

function keyUpHandler(e) {
	if (e.keyCode === ASCII_SHIFT) {
		shiftDown = false;
		requestAnimationFrame(drawKeyboard);
	} else if (e.keyCode === ASCII_SPACEBAR) {
		spaceDown = false;
		requestAnimationFrame(drawKeyboard);
	} else {
		var key = getEventKey(e);
		
		for (var i = 0; i < keyboard.length; i++) {
			for (var j = 0; j < keyboard[i].length; j++) {
				if (keyboard[i][j] === key) {
					keyDown[i][j] = false;
					requestAnimationFrame(drawKeyboard);
					return;
				}
			}
		}
	}
}

function keyDownHandler(e) {
	if (e.keyCode === ASCII_SHIFT) {
		shiftDown = true;
		requestAnimationFrame(drawKeyboard);
	} else if (e.keyCode === ASCII_SPACEBAR) {
		spaceDown = true;
		requestAnimationFrame(drawKeyboard);
	} else {
		var key = getEventKey(e);
		
		for (var i = 0; i < keyboard.length; i++) {
			for (var j = 0; j < keyboard[i].length; j++) {
				if (keyboard[i][j] === key) {
					keyDown[i][j] = true;
					requestAnimationFrame(drawKeyboard);
					return;
				}
			}
		}
	}
}

document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", keyDownHandler, false);

// detect when the tab has become visible or hidden
document.addEventListener("visibilitychange", function(e) {
	for (var i = 0; i < keyboard.length; i++) {
		for (var j = 0; j < keyboard[i].length; j++) {
			keyDown[i][j] = false;
		}
	}
	shiftDown = false;
	// redraw the keyboard immediately, if we use delay it by using
	// requestAnimationFrame(*), it will only redraw when the tab gains
	// focus again, and that causes a flickering effect as the user will
	// see the red keys for a brief moment
	drawKeyboard();
});

drawKeyboard();