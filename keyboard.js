/*eslint-env browser */
const ASCII_BACKSPACE = 8;
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
var keyboardCtx = canvasKeyboard.getContext("2d");

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
	
	keyboardCtx.beginPath();
	keyboardCtx.fillStyle = "white";
	keyboardCtx.fillRect(x, y, dimensions, dimensions);
	keyboardCtx.strokeStyle = "black";
	keyboardCtx.strokeRect(x, y, dimensions, dimensions);
	keyboardCtx.closePath();
}

function drawKey(x, y, letter, keyDown) {
	drawKeyOutline(x, y, keyDown);
	drawCharacter(x, y, KEY_DIMENSIONS, KEY_DIMENSIONS, letter, keyDown);
}

function drawCharacter(x, y, height, width, letter, keydown) {
	if (shiftDown) {
		letter = letter.toUpperCase();	
	}
	
	keyboardCtx.beginPath();
	keyboardCtx.font = keydown ? "40pt Verdana" : "20pt Verdana";
	keyboardCtx.textAlign = "center";
	keyboardCtx.textBaseline = "middle";
	keyboardCtx.fillStyle = keydown ? "red" : "blue";
	keyboardCtx.fillText(letter, (x + x + width) / 2, (y + y + height) / 2);
	keyboardCtx.closePath();
}

function drawShiftKey(x, y) {
	drawKeyOutline(x, y);

	keyboardCtx.beginPath();
	keyboardCtx.font = "15pt Verdana";
	keyboardCtx.textAlign = "center";
	keyboardCtx.textBaseline = "middle";
	keyboardCtx.fillStyle = shiftDown ? "red" : "blue";
	keyboardCtx.fillText("shift", (x + x + 60) / 2, (y + y + 60) / 2);
	keyboardCtx.closePath();
}

/**
 * Draws the keyboard.
 */

function drawSpacebar() {
	keyboardCtx.beginPath();
	keyboardCtx.strokeStyle = "black";
	keyboardCtx.fillStyle = "white";
	if (spaceDown) {
		keyboardCtx.strokeRect(112, 217, 486, 66);
		keyboardCtx.fillRect(112, 217, 486, 66);
	} else {
		keyboardCtx.strokeRect(115, 220, 480, 60);
		keyboardCtx.fillRect(115, 220, 480, 60);
	}
	keyboardCtx.closePath();
}

function drawKeyboard() {
	// clear the canvas before redrawing
	keyboardCtx.clearRect(0, 0, canvasKeyboard.width, canvasKeyboard.height);

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
	var input = document.getElementById("input");
	if (input.disabled) {
		return;
	}
	
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
					
					onCharacter(shiftDown ? key.toUpperCase() : key);
					return;
				}
			}
		}
	}
}

function keyDownHandler(e) {
	var input = document.getElementById("input");
	if (input.disabled) {
		return;
	}
	
	if (e.keyCode === ASCII_SHIFT) {
		shiftDown = true;
		requestAnimationFrame(drawKeyboard);
	} else if (e.keyCode === ASCII_SPACEBAR) {
		spaceDown = true;
		requestAnimationFrame(drawKeyboard);
	} else if (e.keyCode === ASCII_BACKSPACE) {
		if (onBackspace()) {
			e.preventDefault();
		}
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