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
			showReport();
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

var countdownTime = 5;
var remainingTime = -1;

/**
 * The desired time limit for a time trial. Will be -1 if the run is not a time trial.
 */
var timeLimit = -1;

/**
 * The time when the user started the run.
 */
var startTime = -1;

function startCountdown() {
	// hide the setup popup
	document.getElementById("openModal").style.display = "none";

	if (document.getElementById("timeCheckbox").checked) {
		// show the timer
		document.getElementById("countdown").style.display = "inline";
		drawCountdownCanvas();
	} else {
		// not a time trial, remove the field for showing the remaining time
		document.getElementById("remainingTime").style.display = "none";
		// show the content
		document.getElementById("body").style.background = "#eeeeee";
		document.getElementById("content").style.display = "inline";
		// enable the input field and grant it focus
		document.getElementById("input").disabled = false;
		document.getElementById("input").focus();
		startTime = new Date().getTime();
	}
}

function showReport() {
	var current = new Date().getTime();
	startTime = current - startTime;
	
	document.getElementById("backContent").innerHTML = "";
	document.getElementById("frontContent").innerHTML = "";
	document.getElementById("nextBtn").disabled = true;
	document.getElementById("input").disabled = true;
	
	if (remainingTime === -1) {
		// not a time trial, just tell the user how much time they used
		document.getElementById("reportTimeLimit").style.display = "none";
		document.getElementById("reportRemainingTime").innerHTML = "使った時間：" + (startTime / 1000) + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "カード枚数：" + wordCounter;
	} else if (remainingTime > 0) {
		// completed before the time trial ended, show the time used
		document.getElementById("reportTimeLimit").innerHTML = "時間制限：" + timeLimit + "秒";
		document.getElementById("reportRemainingTime").innerHTML = "使った時間：" + (startTime / 1000) + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "カード枚数：" + wordCounter;
	} else {
		// failed the time trial, show the remaining number of cards
		document.getElementById("reportTimeLimit").innerHTML = "時間制限：" + timeLimit + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "残りカード：" + remaining;
	}
	document.getElementById("body").style.background = "#333333";
	document.getElementById("content").style.display = "none";
	document.getElementById("report").style.display = "inline";
}

function startTimeTrial() {
	timeLimit = parseInt(document.getElementById("time").value, 10);
	remainingTime = timeLimit;
	
	document.getElementById("remainingTime").innerHTML = remainingTime + "秒";
	setTimeout(timer, 1000);
}

function timer() {
	remainingTime--;
	document.getElementById("remainingTime").innerHTML = remainingTime + "秒";
	if (remainingTime === 0) {
		showReport();
	} else {
		setTimeout(timer, 1000);
	}
}

function keyDownHandler(e) {
	if (e.keyCode === ASCII_ENTER && remaining !== 0) {
		onClick();
	}
}

document.addEventListener("keydown", keyDownHandler, false);

var canvas = document.getElementById("countdownCanvas");
var ctx = canvas.getContext("2d");
var startPoint = 0 - (Math.PI / 2);

var start = -1;
var time = 5;

function drawCountdownCanvas() {
	if (start === -1) {
		start = new Date().getTime();
	}
	var now = new Date().getTime();
	if (now - start >= time * 1000) {
		ctx.fillStyle = "black";
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.beginPath();
		ctx.moveTo(250, 250);
		ctx.arc(250, 250, 200, startPoint, Math.PI * 2);
			ctx.fill();
		ctx.closePath();
		
		ctx.fillStyle = "#eeeeee";
		ctx.beginPath();
		ctx.moveTo(250, 250);
		ctx.arc(250, 250, 190, startPoint, Math.PI * 2);
		ctx.fill();
		
		// show the content
		document.getElementById("body").style.background = "#ffffff";
		document.getElementById("content").style.display = "inline";
		// hide the countdown timer
		document.getElementById("countdown").style.display = "none";
		// enable the input field and grant it focus
		document.getElementById("input").disabled = false;
		document.getElementById("input").focus();
		startTime = new Date().getTime();
		
		startTimeTrial();
		return;
	}
	
	var pct = ((now - start) % 1000) / 1000;
	
	ctx.fillStyle = "black";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.moveTo(250, 250);
	ctx.arc(250, 250, 200, startPoint, startPoint + (Math.PI * 2 * (pct)));
		ctx.fill();
	ctx.closePath();
	
	ctx.fillStyle = "#eeeeee";
	ctx.beginPath();
	ctx.moveTo(250, 250);
	ctx.arc(250, 250, 190, startPoint, startPoint + (Math.PI * 2 * (pct)));
		ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.font = "400px Calibri";
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(5 - Math.floor((now - start) / 1000), 250, 250);
	ctx.closePath();
	
	requestAnimationFrame(drawCountdownCanvas);
}
