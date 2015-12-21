/*eslint-env browser */
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var shiftDown = false;
var keydown = [
	[ false, false, false, false, false, false, false, false, false, false ],
	[ false, false, false, false, false, false, false, false, false ],
	[ false, false, false, false, false, false, false, false, false ]
];
var keyboard = [
	[ 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p' ],
	[ 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l' ],
	[ 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.' ]
];

function drawKeyOutline(x, y) {
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.strokeRect(x, y, 60, 60);
	ctx.closePath();
}

function drawKey(x, y, letter, keydown) {
	drawKeyOutline(x, y);
	drawCharacter(x, y, 60, 60, letter, keydown);
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

function drawKeyboard() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < keyboard[0].length; i++) {
		drawKey(70 * i + (10), 10, keyboard[0][i], keydown[0][i]);
	}

	for (var i = 0; i < keyboard[1].length; i++) {
		drawKey(35 + 70 * i + (10), 80, keyboard[1][i], keydown[1][i]);
	}
	
	drawShiftKey(10, 150);

	for (var i = 0; i < keyboard[2].length; i++) {
		drawKey(70 + 70 * i + (10), 150, keyboard[2][i], keydown[2][i]);
	}

	requestAnimationFrame(drawKeyboard);
}

function keyUpHandler(e) {
	if (e.key === "Shift") {
		shiftDown = false;
	} else {
		var key = e.key.toLowerCase();
		for (var i = 0; i < keyboard.length; i++) {
			for (var j = 0; j < keyboard[i].length; j++) {
				if (keyboard[i][j] === key) {
					keydown[i][j] = false;
					return;
				}
			}
		}
	}
}

function keyDownHandler(e) {
	if (e.key === "Shift") {
		shiftDown = true;
	} else {
		var key = e.key.toLowerCase();
		for (var i = 0; i < keyboard.length; i++) {
			for (var j = 0; j < keyboard[i].length; j++) {
				if (keyboard[i][j] === key) {
					keydown[i][j] = true;
					return;
				}
			}
		}
	}
}

document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", keyDownHandler, false);
drawKeyboard();