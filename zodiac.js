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

function show() {
	idx = Math.floor(Math.random() * remaining);
	document.getElementById("japanese").innerHTML = japanese[idx];
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
			alert("終わりました！");
			document.getElementById("japanese").innerHTML = "";
			document.getElementById("remaining").innerHTML = "残り： 0";
			document.getElementById("nextBtn").disabled = true;
		} else {
			show();
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