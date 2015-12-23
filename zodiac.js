/*eslint-env browser */
const ASCII_ENTER = 13;

var english = null;
var japanese = null;

var count = -1;
var remaining = -1;
var idx = -1;

var files = null;
var fileCounter = 0;
var wordCounter = 0;

var front = true;

function handleFileSelect(e) {
	wordCounter = 0;
	fileCounter = 0;
	english = [];
	japanese = [];
	files = e.target.files;
	var reader = new FileReader();
	
	reader.onload = function(e) {
		var text = reader.result;
		var strings = text.split("\r");
		for (var i = 0; i < strings.length / 2; i++) {
			english[wordCounter] = strings[i * 2].trim();
			japanese[wordCounter] = strings[(i * 2) + 1].trim();
			wordCounter++;
		}
		count = english.length;
		remaining = count;

		fileCounter++;

		if (fileCounter !== files.length) {
			reader.readAsText(files[fileCounter], "UTF-8");
		} else {
			document.getElementById("nextBtn").disabled = false;
			show();
		}
	};

	reader.readAsText(files[fileCounter], "UTF-8");
}


var enableKeyboard = true;

function showKeyboard() {
	enableKeyboard = !enableKeyboard;

	if (enableKeyboard) {
		document.getElementById("canvas").style.display = "inline";
	} else {
		document.getElementById("canvas").style.display = "none";
	}
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function updateFlashCard() {
	var canvasFront = document.getElementById('canvasFront');
	var canvasBack = document.getElementById('canvasBack');
	var contextFront = canvasFront.getContext('2d');
	var contextBack = canvasBack.getContext('2d');
	
	if (front) {
		contextBack.clearRect(0, 0, canvasBack.width, canvasBack.height);
		
		var x = canvasFront.width / 2;
		var y = canvasFront.height / 2;
		
		contextFront.font = "30pt Calibri";
		contextFront.textAlign = "center";
		contextFront.textBaseline = "middle";
		contextFront.fillStyle = "white";
		contextFront.fillRect(0, 0, canvasFront.width, canvasFront.height);
		contextFront.fillStyle = "black";
		contextFront.fillText(japanese[idx], x, y);
	} else {
		contextFront.clearRect(0, 0, canvasFront.width, canvasFront.height);
		
		var x = canvasBack.width / 2;
		var y = canvasBack.height / 2;
		
		contextBack.font = "30pt Calibri";
		contextBack.textAlign = "center";
		contextBack.textBaseline = "middle";
		contextBack.fillStyle = "white";
		contextBack.fillRect(0, 0, canvasBack.width, canvasBack.height);
		contextBack.fillStyle = "black";
		contextBack.fillText(japanese[idx], x, y);
	}
}

function show() {
	idx = Math.floor(Math.random() * remaining);
	updateFlashCard();
	document.getElementById("remaining").innerHTML = "残り： " + remaining;
	document.getElementById("input").value = "";
}

function onClick() {	
	if (document.getElementById("input").value === english[idx]) {
		remaining--;
		english[idx] = english[remaining];
		japanese[idx] = japanese[remaining];

		document.getElementById("mistake").innerHTML = "";

		if (remaining === 0) {
			var canvas = document.getElementById("canvasFront");
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			canvas = document.getElementById("canvasBack");
			ctx = canvas.getContext("2d");
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			alert("終わりました！");
			document.getElementById("remaining").innerHTML = "残り： 0";
			document.getElementById("nextBtn").disabled = true;
		} else {
			front = !front;
			show();
		
			var card = document.getElementById("card");
			if (card.className === "card") {
				card.className = "card flipped";
			} else {
				card.className = "card";
			}
		}
	} else {
		document.getElementById("mistake").innerHTML = "<font color=\"red\">間違った！</font>";
	}
}

function keyDownHandler(e) {
	if (e.keyCode === ASCII_ENTER && remaining !== 0) {
		onClick();
	}
}

document.addEventListener("keydown", keyDownHandler, false);