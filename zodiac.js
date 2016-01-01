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

/**
 * The name of the sample file that's been selected. Will be null if
 * the user has chosen to use a local file.
 */
var sampleFileName = null;

var front = true;

function handleSampleSelect(fileName) {
	sampleFileName = fileName;
	files = null;
	readSample(false);
}

/**
 * Read the sample file and prompt its contents as a flashcard.	
 * 
 * @param restart true if this run was prompted by a restart, false
 * otherwise
 */
function readSample(restart) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState === 4 && xhttp.status === 200) {
			wordCounter = 0;
			fileCounter = 0;
			english = [];
			japanese = [];
			
			var text =  xhttp.responseText;
			var strings = text.split("\r");
			for (var i = 0; i < strings.length / 2; i++) {
				english[wordCounter] = strings[i * 2].trim();
				japanese[wordCounter] = strings[(i * 2) + 1].trim();
				wordCounter++;
			}
			count = english.length;
			remaining = count;
	
			fileCounter++;
	
			document.getElementById("startBtn").disabled = false;
			document.getElementById("nextBtn").disabled = false;
			document.getElementById("restartBtn").disabled = false;
			
			if (restart) {
				document.getElementById("report").style.display = "none";
				document.getElementById("input").value = "";
				startCountdown();
			}
			show();
		}
	};
	xhttp.open("GET", "words/" + sampleFileName, true);
	xhttp.send();
}

function handleFileSelect(e) {
	files = e.target.files;
	sampleFileName = null;
	readFiles(false);
}

/**
 * Reads the files that the user has selected locally and prompts them
 * as flashcards.
 * 
 * @param restart true if this run was prompted by a restart, false
 * otherwise
 */
function readFiles(restart) {
	wordCounter = 0;
	fileCounter = 0;
	english = [];
	japanese = [];
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
			document.getElementById("restartBtn").disabled = false;
			document.getElementById("startBtn").disabled = false;
			document.getElementById("nextBtn").disabled = false;
			
			if (restart) {
				document.getElementById("report").style.display = "none";
				document.getElementById("input").value = "";
				startCountdown();
			}
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

var start = -1;

function startCountdown() {
	// hide the setup popup
	document.getElementById("openModal").style.display = "none";

	if (document.getElementById("timeCheckbox").checked) {
		// show the timer
		document.getElementById("countdown").style.display = "inline";
		start = new Date().getTime();
		drawCountdownCanvas();
	} else {
		// not a time trial, remove the trial timer
		document.getElementById("trialTimer").style.display = "none";
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
	document.getElementById("restartBtn").disabled = false;
	document.getElementById("report").style.display = "inline";
}

function restart() {
	document.getElementById("restartBtn").disabled = true;
	
	if (files === null) {
		readSample(true);
	} else {
		readFiles(true);
	}
}

function startTimeTrial() {
	timeLimit = parseInt(document.getElementById("time").value, 10);
	remainingTime = timeLimit;
	
	setTimeout(timer, 1000);
}

function timer() {
	// stop counting down on the timer if we're done
	if (remaining === 0) {
		return;
	}
	
	remainingTime--;
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

function drawCountdownCanvas() {
	var now = new Date().getTime();
	if (now - start >= countdownTime * 1000) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		
		ctx.fillStyle = "black";
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
		document.getElementById("body").style.background = "#eeeeee";
		document.getElementById("content").style.display = "inline";
		// hide the countdown timer
		document.getElementById("countdown").style.display = "none";
		// enable the input field and grant it focus
		document.getElementById("input").disabled = false;
		document.getElementById("input").focus();
		startTime = new Date().getTime();
		
		startTimeTrial();
		drawTimerCanvas();
		return;
	}
	
	var pct = ((now - start) % 1000) / 1000;
	var timeLeft = 5 - Math.floor((now - start) / 1000);
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	
	ctx.fillStyle = getTimerStyle(countdownTime, timeLeft);
	ctx.beginPath();
	ctx.moveTo(250, 250);
	ctx.arc(250, 250, 230, startPoint, startPoint + (Math.PI * 2 * (.2 * (6 - timeLeft))));
	ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.fillStyle = "#333333";
	ctx.moveTo(250, 250);
	ctx.arc(250, 250, 215, startPoint, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.fillStyle = "white";
	ctx.moveTo(250, 250);
	ctx.arc(250, 250, 200, startPoint, startPoint + (Math.PI * 2 * (pct)));
	ctx.fill();
	ctx.closePath();
	
	ctx.fillStyle = getTimerStyle(countdownTime, timeLeft);
	ctx.beginPath();
	ctx.moveTo(250, 250);
	ctx.arc(250, 250, 190, startPoint, startPoint + (Math.PI * 2 * (pct)));
	ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.font = "400px Calibri";
	ctx.fillStyle = "white";
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = 5;
	ctx.shadowOffsetY = 5;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(timeLeft, 250, 250);
	ctx.closePath();
	
	requestAnimationFrame(drawCountdownCanvas);
}

var timerCanvas = document.getElementById("trialTimer");
var timerCtx = timerCanvas.getContext("2d");

function getTimerStyle(max, timeLeft) {
	if (timeLeft <= max * 0.2) {
		return "#cc0000";
	} else if (timeLeft <= max * 0.6) {
		return timerCtx.fillStyle = "#cccc00";
	}
	return "#33cc33";
}

function drawTimerCanvas() {
	var x = timerCanvas.width / 2;
	var y = timerCanvas.height / 2;
	var now = new Date().getTime();
	if (now - startTime >= timeLimit * 1000) {
		timerCtx.clearRect(0, 0, timerCanvas.width, timerCanvas.height);
		return;
	}
	
	var pct = ((now - startTime) % 1000) / 1000;
	var timeLeft = timeLimit - Math.floor((now - startTime) / 1000);
	
	timerCtx.clearRect(0, 0, timerCanvas.width, timerCanvas.height);
	timerCtx.shadowOffsetX = 0;
	timerCtx.shadowOffsetY = 0;
	
	timerCtx.fillStyle = getTimerStyle(timeLimit, timeLeft);
	timerCtx.beginPath();
	timerCtx.moveTo(x, y);
	timerCtx.arc(x, y, 45, startPoint, startPoint + (Math.PI * 2 * (1 / timeLimit * (timeLimit - timeLeft))));
	timerCtx.fill();
	timerCtx.closePath();
	
	timerCtx.beginPath();
	timerCtx.fillStyle = "#333333";
	timerCtx.moveTo(x, y);
	timerCtx.arc(x, y, 40, startPoint, Math.PI * 2);
	timerCtx.fill();
	timerCtx.closePath();
	
	timerCtx.beginPath();
	timerCtx.fillStyle = "white";
	timerCtx.moveTo(x, y);
	timerCtx.arc(x, y, 35, startPoint, startPoint + (Math.PI * 2 * (pct)));
	timerCtx.fill();
	timerCtx.closePath();
	
	timerCtx.fillStyle = getTimerStyle(timeLimit, timeLeft);
	timerCtx.beginPath();
	timerCtx.moveTo(x, y);
	timerCtx.arc(x, y, 30, startPoint, startPoint + (Math.PI * 2 * (pct)));
	timerCtx.fill();
	timerCtx.closePath();
	
	timerCtx.beginPath();
	timerCtx.font = "45px Calibri";
	timerCtx.fillStyle = "white";
	timerCtx.shadowColor = "black";
	timerCtx.shadowOffsetX = 1;
	timerCtx.shadowOffsetY = 1;
	timerCtx.textAlign = "center";
	timerCtx.textBaseline = "middle";
	timerCtx.fillText(timeLeft, x, y);
	timerCtx.closePath();
	
	requestAnimationFrame(drawTimerCanvas);
}
