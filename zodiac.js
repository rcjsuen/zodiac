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
			document.getElementById("startBtn").disabled = false;
			document.getElementById("nextBtn").disabled = false;
			show();
		}
	};

	reader.readAsText(files[fileCounter], "UTF-8");
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function updateFlashCard() {
	if (front) {
		document.getElementById("frontContent").innerHTML = japanese[idx];
		document.getElementById("frontTable").style.visibility = "visible";
		document.getElementById("backTable").style.visibility = "hidden";
	} else {
		document.getElementById("frontTable").style.visibility = "hidden";
		document.getElementById("backTable").style.visibility = "visible";
		document.getElementById("backContent").innerHTML = japanese[idx];
	}
}

function show() {
	idx = Math.floor(Math.random() * remaining);
	updateFlashCard();
	document.getElementById("remaining").innerHTML = "残り： " + remaining + "/" + wordCounter;
	document.getElementById("input").value = "";
}

function onClick() {
	var input = document.getElementById("input");
	if (input.disabled) {
		return;
	}

	if (input.value === english[idx]) {
		remaining--;
		english[idx] = english[remaining];
		japanese[idx] = japanese[remaining];

		document.getElementById("mistake").innerHTML = "";

		if (remaining === 0) {
			document.getElementById("backContent").innerHTML = "";
			document.getElementById("frontContent").innerHTML = "";

			alert("終わりました！");
			document.getElementById("remaining").innerHTML = "残り： 0/" + wordCounter;
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