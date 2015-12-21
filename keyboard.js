/*eslint-env browser */
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function drawKey(x, y, letter, keydown) {
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.strokeRect(x, y, 60, 60);
	ctx.closePath();

	drawCharacter(x, y, 60, 60, letter, keydown);
}

function drawCharacter(x, y, height, width, letter, keydown) {
	ctx.beginPath();
	ctx.font = keydown ? "40pt Verdana" : "20pt Verdana";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = keydown ? "red" : "blue";
	ctx.fillText(letter, (x + x + width) / 2, (y + y + height) / 2);
	ctx.closePath();
}

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

function drawKeyboard() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < keyboard[0].length; i++) {
		drawKey(70 * i + (10), 10, keyboard[0][i], keydown[0][i]);
	}

	for (var i = 0; i < keyboard[1].length; i++) {
		drawKey(35 + 70 * i + (10), 80, keyboard[1][i], keydown[1][i]);
	}

	for (var i = 0; i < keyboard[2].length; i++) {
		drawKey(70 + 70 * i + (10), 150, keyboard[2][i], keydown[2][i]);
	}

	requestAnimationFrame(drawKeyboard);
}

function keyUpHandler(e) {
	for (var i = 0; i < keyboard.length; i++) {
		for (var j = 0; j < keyboard[i].length; j++) {
			if (keyboard[i][j] === e.key) {
				keydown[i][j] = false;
				return;
			}
		}
	}
}

function keyDownHandler(e) {
	for (var i = 0; i < keyboard.length; i++) {
		for (var j = 0; j < keyboard[i].length; j++) {
			if (keyboard[i][j] === e.key) {
				keydown[i][j] = true;
				return;
			}
		}
	}
}

document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", keyDownHandler, false);
drawKeyboard();