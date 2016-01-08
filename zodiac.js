/*eslint-env browser */
const ASCII_ENTER = 13;

/**
 * The user will enter in the English word of the corresponding flashcard.
 */
const TYPE_FLASHCARD = 0;

/**
 * The user will fill in one missing character from the English word(s).
 */
const TYPE_ALPHABET = TYPE_FLASHCARD + 1;

/**
 * The user will simply read the answer.
 */
const TYPE_READING = TYPE_ALPHABET + 1;

/**
 * The type of flashcard run that has been selected.TYPE_READING
 * 
 * @see TYPE_FLASHCARD
 * @see TYPE_ALPHABET
 * @see TYPE_READING
 */
var type = -1;

/**
 * The array of English words on the flashcards.
 * 
 * @see japanese
 */
var english = null;

/**
 * The array of Japanese words on the flashcards.
 * 
 * @see english
 */
var japanese = null;

/**
 * The number of cards that are left in the deck.
 */
var remaining = -1;
var idx = -1;

var files = null;
var fileCounter = 0;

/**
 * The total number of cards in the deck.
 */
var wordCounter = 0;

/**
 * The name of the sample file that's been selected. Will be null if
 * the user has chosen to use a local file.
 */
var sampleFileName = null;

var front = true;

/**
 * The number of characters to remove when the user is trying to fill in the blanks.
 */
var remove = -1;

/**
 * An array of indices of the characters that have been removed.
 * 
 * @see skipIdx
 * @see fillIndices
 */
var skipIndices = null;

/**
 * The current index within the list of removed characters that the user is currently on.undefined
 * 
 * @see skipIndices
 */
var skipIdx = 0;

/**
 * An array of characters that the user has entered.
 * 
 * @see skipIndices
 */
var fillIndices = [];

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
			remaining = english.length;
	
			fileCounter++;
	
			document.getElementById("startBtn").disabled = false;
			document.getElementById("restartBtn").disabled = false;
			
			if (restart) {
				document.getElementById("report").style.display = "none";
				document.getElementById("input").value = "";
				startCountdown();
			}
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
		remaining = english.length;

		fileCounter++;

		if (fileCounter !== files.length) {
			reader.readAsText(files[fileCounter], "UTF-8");
		} else {
			document.getElementById("restartBtn").disabled = false;
			document.getElementById("startBtn").disabled = false;
			
			if (restart) {
				document.getElementById("report").style.display = "none";
				document.getElementById("input").value = "";
				startCountdown();
			}
		}
	};

	reader.readAsText(files[fileCounter], "UTF-8");
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function getText() {
	if (type === TYPE_READING && document.getElementById("readingEnglish").checked) {
		return english[idx];
	}
	return japanese[idx];
}

function getAnswer() {
	return document.getElementById("readingEnglish").checked ? japanese[idx] : english[idx];
}

function updateFlashCard() {
	var text = getText();
	if (front) {
		document.getElementById("frontContent").innerHTML = text;
		document.getElementById("frontTable").style.visibility = "visible";
		document.getElementById("backTable").style.visibility = "hidden";
	} else {
		document.getElementById("frontTable").style.visibility = "hidden";
		document.getElementById("backTable").style.visibility = "visible";
		document.getElementById("backContent").innerHTML = text;
	}
}

/**
 * Checks whether the given character code corresponds to an English character.
 * 
 * @param charCode the character code to check
 */
function isEnglishLetter(charCode) {
	return (65 <= charCode && charCode <= 90) || (97 <= charCode && charCode <= 122);
}

/**
 * Retrieves an array of indices that are to be skipped given the number of characters to remove.
 * 
 * @param remove the number of characters to remove from the current English word
 */
function getSkippedIndices(remove) {
	var indices = [];
	var count = 0;
	for (var i = 0; i < english[idx].length; i++) {
		if (isEnglishLetter(english[idx].charCodeAt(i))) {
			count++;
		}			
	}
	
	var j = 0;
	if (count <= remove) {
		// will be removing all the English characters
		for (i = 0; i < english[idx].length; i++) {
			if (isEnglishLetter(english[idx].charCodeAt(i))) {
				indices[j] = i;
				j++;
			}			
		}
		return indices;
	}
	
	while (remove > 0) {
		var randomIdx = Math.floor(Math.random() * english[idx].length);
		while (!isEnglishLetter(english[idx].charCodeAt(randomIdx)) || indices.indexOf(randomIdx) !== -1) {
			randomIdx = Math.floor(Math.random() * english[idx].length);
		}
		indices[j] = randomIdx;
		j++;
		remove--;
	}
	indices.sort();
	return indices;
}

/**
 * Returns the English word with a subset of its characters missing and replaced with an underscore.
 */
function getRemovalDisplayText() {
	var display = "";
	skipIndices = getSkippedIndices(remove);
	for (var i = 0; i < skipIndices.length; i++) {
		fillIndices[i] = -1;
	}
	var j = 0;
	for (i = 0; i < english[idx].length; i++) {
		if (i === skipIndices[j]) {
			display = display + "_";
			j++;
		} else {
			display = display + english[idx].charAt(i);
		}
	}
	return display;
}

function show() {
	idx = Math.floor(Math.random() * remaining);
	updateFlashCard();
	document.getElementById("remaining").innerHTML = "残り： " + remaining + "/" + wordCounter;
	
	if (type === TYPE_FLASHCARD) {
		document.getElementById("input").value = "";
	} else if (type === TYPE_ALPHABET) {
		var text = getRemovalDisplayText();
		document.getElementById("alphabetsDisplay").innerHTML = text;
		document.getElementById("alphabetsInput").innerHTML = text;
	}
}

/**
 * Displays a text to the user indicating that there is a mistake in the answer.
 */
function showError() {
	document.getElementById("mistake").innerHTML = "<font color=\"red\">間違った！</font>";
}

function next(answer) {
	// check if the answer matches, or if we're just doing a read through
	if (answer === english[idx] || type === TYPE_READING) {
		remaining--;
		english[idx] = english[remaining];
		japanese[idx] = japanese[remaining];

		switch (type) {
			case TYPE_FLASHCARD:
			case TYPE_ALPHABET:
				document.getElementById("mistake").innerHTML = "";
				break;
			case TYPE_READING:
				document.getElementById("readingDisplay").innerHTML = "";
				break;
		}

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
		showError();
	}
}

function onClick() {
	var input = document.getElementById("input");
	if (input.disabled) {
		return;
	}
	next(input.value);
}

/**
 * Given the current index of where the user is in completing the English word,
 * either fill in the character or remove the most recently filled in character.
 * 
 * @param c the character to enter in, or null if the most recently filled in
 * character should be removed
 */
function fillInTheBlank(c) {
	// has the user completed the word
	var done = true;
	// are there any errors
	var hasErrors = false;
	
	if (c === null) {
		// remove the last character
		skipIdx--;
		fillIndices[skipIdx] = -1;
	} else {
		// fill in the current character
		fillIndices[skipIdx] = c;
		skipIdx++;
	}
	
	var html = "";
	var j = 0;
	for (var i = 0; i < english[idx].length; i++) {
		var char = english[idx].charAt(i);
		// is this an index that was skipped
		if (i === skipIndices[j]) {
			if (fillIndices[j] === char) {
				// the character matches, make it green
				html = html + "<font color=\"#00dd00\">" + fillIndices[j] + "</font>";
			} else if (fillIndices[j] === -1) {
				// this character hasn't been entered in yet, put in an underscore
				html = html + "_";
				done = false;
			} else {
				// the character is wrong, make it red
				html = html + "<font color=\"#ff0000\">" + fillIndices[j] + "</font>";
				done = false;
				hasErrors = true;
			}
			j++;
		} else {
			html = html + char;
		}
	}
	
	if (done) {
		// we're done, reset and move on
		skipIdx = 0;
		next(english[idx]);
	} else {
		// update the input
		document.getElementById("alphabetsInput").innerHTML = html;
		if (hasErrors) {
			// show errors if there are any
			showError();
		} else {
			// clear the error message otherwise
			document.getElementById("mistake").innerHTML = "";
		}
	}
}

function onBackspace() {
	if (type === TYPE_ALPHABET) {
		if (skipIdx > 0) {
			fillInTheBlank(null);
		}
		return true;
	}
	return false;
}

function onCharacter(c) {
	// if the user just keeps typing, don't bother processing the extra stuff
	if (type === TYPE_ALPHABET && skipIdx < skipIndices.length) {
		fillInTheBlank(c);
	}
}

function onShow() {
	if (type === TYPE_READING) {
		document.getElementById("readingDisplay").innerHTML = getAnswer();
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

function getType() {
	var navbar = document.getElementById('navbar').getElementsByTagName('li');
	for (var i = 0; i < navbar.length; i ++) {
		var anchor = navbar[i].getElementsByTagName("a")[0];
		if (anchor.hasAttribute("class")) {
			var id = anchor.getAttribute("id");
			if (id === "flashcard") {
				return TYPE_FLASHCARD;
			} else if (id === "alphabet") {
				return TYPE_ALPHABET;
			} else if (id === "reading") {
				return TYPE_READING;
			}
			throw new Error("Unknown type: " + id);
		}
	}
	
	throw new Error("No types found");
}

function startCountdown() {
	type = getType();
	
	switch (type) {
		case TYPE_ALPHABET:
			remove = parseInt(document.getElementById("alphabetRemoval").value, 10);
			
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("alphabetsContent").style.display = "inline";
			break;
		case TYPE_READING:
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("readingContent").style.display = "inline";
			document.getElementById("canvas").style.display = "none";
			break;
	}
	
	show();
	// hide the setup popup
	document.getElementById("openModal").style.display = "none";
	
	updateFlashCard();
	
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
	document.getElementById("input").disabled = true;
	
	if (remainingTime === -1) {
		// not a time trial, just tell the user how much time they used
		document.getElementById("reportTimeLimit").style.display = "none";
		document.getElementById("reportRemainingTime").innerHTML = "使った時間：" + (startTime / 1000) + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "カード枚数：" + wordCounter;
	} else if (remainingTime > 0) {
		// completed before the time trial ended, show the time used
		document.getElementById("reportTimeLimit").innerHTML = "時間制限：" + timeLimit + "秒";
		document.getElementById("reportRemainingTime").style.display = "inline";
		document.getElementById("reportRemainingTime").innerHTML = "使った時間：" + (startTime / 1000) + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "カード枚数：" + wordCounter;
	} else {
		// failed the time trial, show the remaining number of cards
		document.getElementById("reportTimeLimit").innerHTML = "時間制限：" + timeLimit + "秒";
		document.getElementById("reportRemainingTime").style.display = "none";
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
