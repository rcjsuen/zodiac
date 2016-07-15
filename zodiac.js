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
 * The user will have to select two matching cards.
 */
const TYPE_MATCHING = TYPE_READING + 1;

/**
 * The user will select the correct definition given three choices.
 */
const TYPE_CHOOSE = TYPE_MATCHING + 1;

/**
 * The user will select a card given its corresponding foreign definition.
 */
const TYPE_KARUTA = TYPE_CHOOSE + 1;

/**
 * The type of flashcard run that has been selected.
 * 
 * @see TYPE_FLASHCARD
 * @see TYPE_ALPHABET
 * @see TYPE_READING
 * @see TYPE_MATCHING
 * @see TYPE_CHOOSE
 * @see TYPE_KARUTA
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
 * The array of original English words on the flashcards.
 * 
 * @see english
 */
var originalEnglish = null;

/**
 * The array of original Japanese words on the flashcards.
 * 
 * @see japanese
 */
var originalJapanese = null;

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

/**
 * Records how many words have been matched during a matching run.
 * 
 * @see TYPE_MATCHING
 */
var done = [];

var beepAudio = new Audio("audio/beep." + getAudioExtension());

var errorAudio = new Audio("audio/error." + getAudioExtension());

var hasWarned = false;

var elapsedTime = -1;

function playBeepAudio() {
	beepAudio.play();
}

function playErrorAudio() {
	errorAudio.play();
}

function getAudioExtension() {
	var video = document.createElement("audio");
	return video.canPlayType("audio/ogg") ? "ogg" : "mp3";
}

function handleSampleSelect(fileName) {
	sampleFileName = fileName;
	files = null;
	document.getElementById("startBtn").disabled = false;
}

/**
 * Read the sample file and prompt its contents as a flashcard.	
 */
function readSample() {
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
				done[wordCounter] = false;
				wordCounter++;
			}
			// clone the word list
			originalEnglish = english.slice(0);
			originalJapanese = japanese.slice(0);
			remaining = english.length;
	
			fileCounter++;
			
			document.getElementById("report").style.display = "none";
			document.getElementById("input").value = "";
			startCountdown();
		}
	};
	xhttp.open("GET", "words/" + sampleFileName, true);
	xhttp.send();
}

function handleFileSelect(e) {
	if (e.target.files.length === 0) {
		// the user has cancelled the dialog, disable the start button
		document.getElementById("startBtn").disabled = true;
	} else {
		files = e.target.files;
		sampleFileName = null;
		document.getElementById("startBtn").disabled = false;
	}
}

/**
 * Reads the files that the user has selected locally and prompts them
 * as flashcards.
 */
function readFiles() {
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
			done[wordCounter] = false;
			wordCounter++;
		}
		// clone the word list
		originalEnglish = english.slice(0);
		originalJapanese = japanese.slice(0);
		remaining = english.length;

		fileCounter++;

		if (fileCounter !== files.length) {
			reader.readAsText(files[fileCounter], "UTF-8");
		} else {
			document.getElementById("report").style.display = "none";
			document.getElementById("input").value = "";
			startCountdown();
		}
	};

	reader.readAsText(files[fileCounter], "UTF-8");
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function getText() {
	switch (type) {
		case TYPE_READING:
		case TYPE_CHOOSE:
			return document.getElementById("cardEnglish").checked ? english[idx] : japanese[idx];
		default:
			return japanese[idx];
	}
}

function getAnswer() {
	switch (type) {
		case TYPE_READING:
		case TYPE_CHOOSE:
			return document.getElementById("cardEnglish").checked ? japanese[idx] : english[idx];
		case TYPE_KARUTA:
			return document.getElementById("cardEnglish").checked ? english[idx] : japanese[idx];
		default:
			return english[idx];
	}
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
	updateRemaining();
	
	if (type === TYPE_FLASHCARD) {
		document.getElementById("input").value = "";
	} else if (type === TYPE_ALPHABET) {
		var text = getRemovalDisplayText();
		document.getElementById("alphabetsDisplay").innerHTML = text;
		document.getElementById("alphabetsInput").innerHTML = text;
	}
}

function updateRemaining() {
	document.getElementById("remaining").innerHTML = "残り： " + remaining + "/" + wordCounter;
}

/**
 * Displays a text to the user indicating that there is a mistake in the answer.
 */
function showError() {
	document.getElementById("mistake").innerHTML = "<font color=\"red\">間違った！</font>";
	playErrorAudio();
}

function hideError() {
	document.getElementById("mistake").innerHTML = "";
}

/**
 * Returns true if the given answer is correct.
 * 
 * @param answer the answer that the user has provided
 * @return true if the given answer is correct, false otherwise
 */
function check(answer) {
	switch (type) {
		case TYPE_READING:
			return true;
		case TYPE_CHOOSE:
			return document.getElementById("cardEnglish").checked ? answer === japanese[idx] : answer === english[idx];
		default:
			return answer === english[idx];
	}
}

/**
 * Returns true and moves on to the next flashcard if the given answer is correct.
 * 
 * @param answer the answer that the user has provided
 * @return true if the given answer is correct, false otherwise
 */
function next(answer) {
	// check if the answer matches, or if we're just doing a read through
	if (check(answer)) {
		remaining--;
		
		if (type !== TYPE_READING) {
			// no point in playing the sound if we're just reading the cards
			playBeepAudio();
		}
		english[idx] = english[remaining];
		japanese[idx] = japanese[remaining];

		switch (type) {
			case TYPE_FLASHCARD:
			case TYPE_ALPHABET:
			case TYPE_CHOOSE:
				hideError();
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
		return true;
	}
	showError();
	return false;
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
			hideError();
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
			} else if (id === "matching") {
				return TYPE_MATCHING;
			} else if (id === "choose") {
				return TYPE_CHOOSE;
			} else if (id === "karuta") {
				return TYPE_KARUTA;
			}
			throw new Error("Unknown type: " + id);
		}
	}
	
	throw new Error("No types found");
}

function startCountdown() {
	document.getElementById("restartBtn").disabled = false;

	type = getType();
	// reset all necessary values
	reset();	
	hasWarned = false;

	var showKeyboard = document.getElementById("keyboardCheckbox").checked;
	
	switch (type) {
		case TYPE_FLASHCARD:
			document.getElementById("flashcardDiv").style.display = "block";
			document.getElementById("flashcardContent").style.display = "inline";
			document.getElementById("alphabetsContent").style.display = "none";
			document.getElementById("readingContent").style.display = "none";
			document.getElementById("matchingContent").style.display = "none";
			document.getElementById("chooseContent").style.display = "none";
			document.getElementById("karutaContent").style.display = "none";
			break;
		case TYPE_ALPHABET:
			remove = parseInt(document.getElementById("alphabetRemoval").value, 10);
			
			document.getElementById("flashcardDiv").style.display = "block";
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("alphabetsContent").style.display = "inline";
			document.getElementById("readingContent").style.display = "none";
			document.getElementById("matchingContent").style.display = "none";
			document.getElementById("chooseContent").style.display = "none";
			document.getElementById("karutaContent").style.display = "none";
			break;
		case TYPE_READING:
			document.getElementById("flashcardDiv").style.display = "block";
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("alphabetsContent").style.display = "none";
			document.getElementById("readingContent").style.display = "inline";
			document.getElementById("matchingContent").style.display = "none";
			document.getElementById("chooseContent").style.display = "none";
			document.getElementById("karutaContent").style.display = "none";
			showKeyboard = false;
			break;
		case TYPE_MATCHING:
			document.getElementById("flashcardDiv").style.display = "none";
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("alphabetsContent").style.display = "none";
			document.getElementById("readingContent").style.display = "none";
			document.getElementById("matchingContent").style.display = "inline";
			document.getElementById("chooseContent").style.display = "none";
			document.getElementById("karutaContent").style.display = "none";
			showKeyboard = false;
			break;
		case TYPE_CHOOSE:
			document.getElementById("flashcardDiv").style.display = "block";
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("alphabetsContent").style.display = "none";
			document.getElementById("readingContent").style.display = "none";
			document.getElementById("matchingContent").style.display = "none";
			document.getElementById("chooseContent").style.display = "inline";
			document.getElementById("karutaContent").style.display = "none";
			showKeyboard = false;
			break; 
		case TYPE_KARUTA:
			document.getElementById("flashcardDiv").style.display = "none";
			document.getElementById("flashcardContent").style.display = "none";
			document.getElementById("alphabetsContent").style.display = "none";
			document.getElementById("readingContent").style.display = "none";
			document.getElementById("matchingContent").style.display = "inline";
			document.getElementById("chooseContent").style.display = "none";
			document.getElementById("karutaContent").style.display = "inline";
			showKeyboard = false;
			break;
	}

	if (showKeyboard) {
		document.getElementById("canvas").style.display = "inline";
	} else {
		document.getElementById("canvas").style.display = "none";
	}
	
	if (type === TYPE_MATCHING) {
		fill();
		updateRemaining();
	} else if (type === TYPE_KARUTA) {
		resetMatchingCards();
		updateKaruta();
		updateRemaining();
	} else {
		show();

		if (type === TYPE_CHOOSE) {
			makeSelections();
		}
	}
	// hide the setup popup
	document.getElementById("openModal").style.display = "none";
	
	updateFlashCard();
	
	if (document.getElementById("timeCheckbox").checked) {
		timeLimit = parseInt(document.getElementById("time").value, 10);
		remainingTime = timeLimit;
		// show the countdown timer
		document.getElementById("countdown").style.display = "inline";
		start = new Date().getTime();
		drawCountdown();
	} else {
		timeLimit = -1;
		remainingTime = -1;
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

/**
 * Resets the state of the application in preparation of the next run.
 */
function reset() {
	canvas = document.getElementById("countdownCanvas");
	ctx = canvas.getContext("2d");

	// remove the red glow around the input field
	document.getElementById("input").className = "input";

	hideError();

	document.getElementById("chooseBackContent1").innerHTML = "";
	document.getElementById("chooseBackContent2").innerHTML = "";
	document.getElementById("chooseBackContent3").innerHTML = "";

	document.getElementById("chooseFrontContent1").innerHTML = "";
	document.getElementById("chooseFrontContent2").innerHTML = "";
	document.getElementById("chooseFrontContent3").innerHTML = "";
}

function getOption(answer, option) {
	var options = document.getElementById("cardEnglish").checked ? originalJapanese : originalEnglish;
	var value = null;
	while (true) {
		var optIdx = Math.floor(Math.random() * options.length);
		if (option !== options[optIdx] && answer !== options[optIdx]) {
			return options[optIdx];
		}
	}
}

function makeSelections() {
	var contents = [];
	for (var i = 1; i < 4; i++) {
		contents[i - 1] = document.getElementById(back ? "chooseBackContent" + i : "chooseFrontContent" + i);
	}

	var options = [];
	var answer = getAnswer();
	options[0] = getOption(answer, answer);
	options[1] = getOption(answer, options[0]);

	var answerIdx = Math.floor(Math.random() * 3);
	var j = 0;
	for (var i = 0; i < 3; i++) {
		if (answerIdx === i) {
			contents[i].innerHTML = answer;
		} else {
			contents[i].innerHTML = options[j++];
		}
	}
}

var jp = -1;

function isDone(array) {
	for (var i = 0; i < array.length; i++) {
		if (!array[i]) {
			return false;
		}
	}
	
	return true;
}

/**
 * Updates the table of cards with an assortment of words from the word
 * list and then returns the number of cards on the screen.
 * 
 * @return the number of cards that can be selected by the user
 */
function updateKaruta() {
	var count = 0;
	var max = remaining > 12 ? 12 : remaining;
	var cards = [];
	var selected = [];
	var words = [];
	for (var i = 0; i < max; i++) {
		cards[i] = false;
	}

	for (var i = 0; i < remaining; i++) {
		selected[i] = false;
	}

	var keyIdx = Math.floor(Math.random() * max);
	var key = null;

	while (!isDone(cards)) {
		var c = Math.floor(Math.random() * remaining);
		while (selected[c]) {
			c = Math.floor(Math.random() * remaining);
		}

		cards[count] = true;
		if (document.getElementById("cardEnglish").checked) {
			if (keyIdx === count) {
				key = japanese[c];
				idx = c;
			}
			words[count++] = english[c];
		} else {
			if (keyIdx === count) {
				key = english[c];
				idx = c;
			}
			words[count++] = japanese[c];
		}
		selected[c] = true;
	}

	for (var i = 0; i < max; i++) {
		var contentId = back ? "backContent" + (i + 1) : "frontContent" + (i + 1);
		var p = document.getElementById(contentId);
		p.innerHTML = words[i];
	}

	if (max !== 12) {
		hideOtherMatchingCards(max);
	}
	document.getElementById("karutaContent").innerHTML = key;
	return max;
}

function getMaxFill(cards) {
	if (cards === 9 || cards === 10) {
		return 10;
	} else if (cards === 7 || cards === 8) {
		return 8;
	} else if (cards >= 6) {
		return 12;
	}
	return cards * 2;
}

function fill() {
	resetMatchingCards();
	
	var count = 0;
	var max = getMaxFill(english.length);
	var cards = [];
	for (var i = 0; i < max; i++) {
		cards[i] = false;
	}
	
	while (count < 12 && !isDone(cards)) {
		var matchingIdx = -1;
		if (jp === -1) {
			matchingIdx = Math.floor(Math.random() * wordCounter);
			while (done[matchingIdx]) {
				matchingIdx = Math.floor(Math.random() * wordCounter);
			}
		} else {
			matchingIdx = jp;
		}

		var c = Math.floor(Math.random() * cards.length);
		while (cards[c]) {
			c = Math.floor(Math.random() * cards.length);
		}
		var p = document.getElementById("frontContent" + (c + 1));
		if (jp === -1) {
			p.innerHTML = english[matchingIdx];
			jp = matchingIdx;
		} else {
			p.innerHTML = japanese[jp];
			jp = -1;
		}
		cards[c] = true;
		done[matchingIdx] = true;
		count++;
	}
	
	if (cards.length < 12) {
		hideOtherMatchingCards(cards.length);
	}
}

function resetMatchingCards() {
	for (var i = 1; i < 13; i++) {
		document.getElementById("front" + i).style.display = "block";
		document.getElementById("back" + i).style.display = "none";
			
		document.getElementById("card" + i).className = "card";
		document.getElementById("card" + i).style.display = "block";
		
		document.getElementById("frontTable" + i).style.visibility = "visible";
		document.getElementById("frontTable" + i).className = "";
		
		document.getElementById("backTable" + i).style.visibility = "hidden";
		document.getElementById("backTable" + i).className = "";
	}
	
	back = false;
}

function hideOtherMatchingCards(offset) {
	for (var i = offset + 1; i < 13; i++) {
		document.getElementById("card" + i).style.display = "none";
	}
}

var back = false;

function flip() {
	var count = 0;
	var cards = [ false, false, false, false, false, false, false, false, false, false, false, false ];
	var undone = 0;
	for (var i = 0; i < done.length; i++) {
		if (!done[i]) {
			undone++;
		}
	}
	
	var incomplete = getMaxFill(undone);
	while (count < incomplete) {
		var matchingIdx = -1;
		if (jp === -1) {
			matchingIdx = Math.floor(Math.random() * wordCounter);
			while (done[matchingIdx]) {
				matchingIdx = Math.floor(Math.random() * wordCounter);
			}
		} else {
			matchingIdx = jp;
		}

		var c = Math.floor(Math.random() * incomplete);
		while (cards[c]) {
			c = Math.floor(Math.random() * incomplete);
		}
		content = back ? "backContent" + (c + 1) : "frontContent" + (c + 1);
		p = document.getElementById(content);
		if (jp === -1) {
			p.innerHTML = english[matchingIdx];
			jp = matchingIdx;
		} else {
			p.innerHTML = japanese[jp];
			jp = -1;
		}
		cards[c] = true;
		done[matchingIdx] = true;
		count++;
	}

	flipCards(incomplete);
}

/**
 * Flips the cards on the table.
 * 
 * @param incomplete the number of cards that are on the screen
 */
function flipCards(incomplete) {
	for (var i = 1; i < 13; i++) {
		var card = document.getElementById("card" + i);
		if (card.className === "card") {
			card.className = "card flipped";
		} else {
			card.className = "card";
		}

		if (back) {
			document.getElementById("front" + i).style.display = "none";
			document.getElementById("back" + i).style.display = "block";
			
			document.getElementById("frontTable" + i).style.visibility = "hidden";
			document.getElementById("backTable" + i).style.visibility = "visible";
			document.getElementById("backTable" + i).className = "";
		} else {
			document.getElementById("front" + i).style.display = "block";
			document.getElementById("back" + i).style.display = "none";
			
			document.getElementById("frontTable" + i).style.visibility = "visible";
			document.getElementById("backTable" + i).style.visibility = "hidden";
			document.getElementById("frontTable" + i).className = "";
		}
	}
	
	if (incomplete < 12) {
		hideOtherMatchingCards(incomplete);
	}
}

var frontTables = [];
var backTables = [];

function mouseDownKaruta(table) {
	var selection = table.children[0].children[0].children[0].innerHTML;
	var answer = getAnswer();

	if (selection === getAnswer()) {
		remaining--;
		updateRemaining();
		playBeepAudio();
			
		if (remaining === 0) {
			showReport();
			return;				
		}

		english[idx] = english[remaining];
		japanese[idx] = japanese[remaining];
		
		back = !back;
		flipCards(updateKaruta());
	} else {
		playErrorAudio();
			
		table.className = "wrong";
		var f = function () {
			if (table.className === "wrong") {
				table.className = "default";
			}
		};
		setTimeout(f, 500);
	}
}

function mouseDownMatching(e) {
	var innerDiv = e.currentTarget.children[back ? 1 : 0];
	var table = innerDiv.getElementsByTagName("table")[0];
	if (type === TYPE_KARUTA) {
		mouseDownKaruta(table);
		return;
	}

	if (table.className === "cleared") {
		return;
	}

	table.className = table.className === "" || table.className === "wrong" || table.className === "default" ? "selected" : "";

	var first = null;
	var second = null;
	var tables = back ? backTables : frontTables;
	for (var i = 0; i < tables.length; i++) {
		if (tables[i].className === "selected") {
			if (first === null) {
				first = tables[i];
			} else {
				second = tables[i];
				break;
			}
		}
	}

	if (first !== null && second !== null) {
		var one = first.children[0].children[0].children[0].innerHTML;
		var two = second.children[0].children[0].children[0].innerHTML;
		if (matches(one, two)) {
			remaining--;
			updateRemaining();
			playBeepAudio();
			
			if (remaining === 0) {
				showReport();
				return;				
			}
			
			first.className = "cleared";
			second.className = "cleared";
			
			for (var i = 0; i < tables.length; i++) {
				if (tables[i].className !== "cleared" && document.getElementById("card" + (i + 1)).style.display !== "none") {
					return;
				}
			}
		
			back = !back;
			flip();
		} else {
			playErrorAudio();
			
			first.className = "wrong";
			second.className = "wrong";

			var f = function () {
				if (first.className === "wrong") {
					first.className = "default";
				}
				if (second.className === "wrong") {
					second.className = "default";
				}
			};
			setTimeout(f, 500);
		}
	}
}

function matches(one, two) {
	var idx1 = english.indexOf(one);
	if (idx1 === -1) {
		return japanese.indexOf(one) === english.indexOf(two);
	} else {
		return japanese.indexOf(two) === idx1;
	}
}

function mouseDownChoose(e) {
	var innerDiv = e.currentTarget.children[back ? 1 : 0];
	var table = innerDiv.getElementsByTagName("table")[0];
	var selection = table.children[0].children[0].children[0].children[0].innerHTML;
	if (next(selection)) {

		back = !back;

		makeSelections();

		if (back) {
			for (var v = 1; v < 4; v++) {
				document.getElementById("chooseCard" + v).className = "card flipped";

				document.getElementById("chooseFront" + v).style.display = "none";
				document.getElementById("chooseBack" + v).style.display = "block";
			
				document.getElementById("chooseFrontTable" + v).style.visibility = "hidden";
				document.getElementById("chooseBackTable" + v).style.visibility = "visible";
				document.getElementById("chooseBackTable" + v).className = "";
			}
		} else {
			for (var v = 1; v < 4; v++) {
				document.getElementById("chooseCard" + v).className = "card";

				document.getElementById("chooseFront" + v).style.display = "block";
				document.getElementById("chooseBack" + v).style.display = "none";
			
				document.getElementById("chooseFrontTable" + v).style.visibility = "visible";
				document.getElementById("chooseBackTable" + v).style.visibility = "hidden";
				document.getElementById("chooseFrontTable" + v).className = "";
			}
		}
	} else {
		table.className = "wrong";
		var f = function () {
			if (table.className === "wrong") {
				table.className = "default";
			}
		};
		setTimeout(f, 500);
	}
}

function addMouseListener() {
	for (var tables = 1; tables < 13; tables++) {
		document.getElementById("card" + tables).addEventListener("mousedown", mouseDownMatching, false);
	}	
	document.getElementById("chooseCard1").addEventListener("mousedown", mouseDownChoose, false);
	document.getElementById("chooseCard2").addEventListener("mousedown", mouseDownChoose, false);
	document.getElementById("chooseCard3").addEventListener("mousedown", mouseDownChoose, false);
}

function showReport() {
	elapsedTime = new Date().getTime() - startTime;
	elapsedTime = elapsedTime / 1000;

	// for a time trial, if the elapsed time is greater or there are cards remaining then it's a failure,
	// successes should only be possible if the elapsed time is less and there are no cards
	if (timeLimit !== -1 && (elapsedTime > timeLimit || remaining !== 0)) {
		remainingTime = 0;
	}

	document.getElementById("backContent").innerHTML = "";
	document.getElementById("frontContent").innerHTML = "";
	document.getElementById("input").disabled = true;
	
	if (remainingTime === -1) {
		// not a time trial, just tell the user how much time they used
		document.getElementById("reportTimeLimit").style.display = "none";
		document.getElementById("reportRemainingTime").style.display = "inline";
		document.getElementById("reportRemainingTime").innerHTML = "使った時間: " + elapsedTime.toFixed(3) + "秒";
		document.getElementById("reportAverageTime").innerHTML = "平均時間: " + (elapsedTime / wordCounter).toFixed(3) + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "カード枚数: " + wordCounter;
	} else if (remainingTime !== 0) {
		// completed before the time trial ended, show the time used
		var avgTime = elapsedTime / (wordCounter - remaining);
		document.getElementById("reportTimeLimit").style.display = "inline";
		document.getElementById("reportTimeLimit").innerHTML = "時間制限: " + timeLimit + "秒";
		document.getElementById("reportRemainingTime").style.display = "block";
		document.getElementById("reportRemainingTime").innerHTML = "使った時間: " + elapsedTime.toFixed(3) + "秒";
		document.getElementById("reportAverageTime").innerHTML = "平均時間: " + avgTime.toFixed(3) + "秒";
		document.getElementById("reportRemainingCards").innerHTML = "カード枚数: " + wordCounter;
	} else {
		// failed the time trial, show the remaining number of cards
		var completed = wordCounter - remaining;
		var average = completed === 0 ? "不明" : (timeLimit / completed).toFixed(3) + "秒";
		document.getElementById("reportTimeLimit").style.display = "inline";
		document.getElementById("reportTimeLimit").innerHTML = "時間制限: " + timeLimit + "秒";
		document.getElementById("reportRemainingTime").style.display = "none";
		document.getElementById("reportAverageTime").innerHTML = "平均時間: " + average;
		document.getElementById("reportRemainingCards").innerHTML = "正解: " + completed + "/" + wordCounter;
	}
	document.getElementById("body").style.background = "#333333";
	document.getElementById("content").style.display = "none";
	document.getElementById("restartBtn").disabled = false;
	document.getElementById("report").style.display = "inline";
}

function restart() {
	document.getElementById("restartBtn").disabled = true;
	
	// redraw the keyboard as fast inputs may not get processed at the conclusion of a run
	drawKeyboard();
	
	if (files === null) {
		readSample();
	} else {
		readFiles();
	}
}

function setup() {
	// hide the report
	document.getElementById("report").style.display = "none";
	// show the setup dialog again
	document.getElementById("openModal").style.display = "inline";
}

function startTimeTrial() {
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

document.getElementById("input").oninput = function() {
	var inputElement = document.getElementById("input");
	var value = inputElement.value;
	if (english[idx].substring(0, value.length) === value) {
		hasWarned = false;
		inputElement.className = "input";
	} else {
		if (!hasWarned) {
			hasWarned = true;
			errorAudio.play();
		}
		inputElement.className = "input glow";
	}	
};

function keyDownHandler(e) {
	if (e.keyCode === ASCII_ENTER && remaining !== 0) {
		onClick();
	}
}

document.addEventListener("keydown", keyDownHandler, false);

var canvas = document.getElementById("countdownCanvas");
var ctx = canvas.getContext("2d");
var startPoint = 0 - (Math.PI / 2);

function drawCountdown() {
	if (drawCountdownCanvas(countdownTime, canvas.width / 2, 230, 215, 200, 190, "400px Calibri", 5)) {
		requestAnimationFrame(drawCountdown);
	} else {
		// show the content
		document.getElementById("body").style.background = "#eeeeee";
		document.getElementById("content").style.display = "inline";
		// hide the countdown timer
		document.getElementById("countdown").style.display = "none";
		// enable the input field and grant it focus
		document.getElementById("input").disabled = false;
		document.getElementById("input").focus();
		startTime = new Date().getTime();
		start = startTime;
		
		startTimeTrial();
		document.getElementById("trialTimer").style.display = "inline";

		canvas = document.getElementById("trialTimer");
		ctx = canvas.getContext("2d");

		drawTimer();
	}
}



function drawTimer() {
	if (drawCountdownCanvas(timeLimit, canvas.width / 2, 45, 40, 35, 30, "45px Calibri", 1)) {
		requestAnimationFrame(drawTimer);
	} else {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
}

function drawCountdownCanvas(limit, center, outer, inner, timerA, timerB, font, shadowOffset) {
	var now = new Date().getTime();
	if (now - start >= limit * 1000) {
		return false;
	}
	
	var pct = ((now - start) % 1000) / 1000;
	var outerPct = (now - start) / (limit * 1000);
	var timeLeft = limit - Math.floor((now - start) / 1000);
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	
	ctx.fillStyle = getTimerStyle(countdownTime, timeLeft);
	ctx.beginPath();
	ctx.moveTo(center, center);
	ctx.arc(center, center, outer, startPoint, startPoint + (Math.PI * 2 * outerPct));
	ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.fillStyle = "#333333";
	ctx.moveTo(center, center);
	ctx.arc(center, center, inner, startPoint, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.fillStyle = "white";
	ctx.moveTo(center, center);
	ctx.arc(center, center, timerA, startPoint, startPoint + (Math.PI * 2 * (pct)));
	ctx.fill();
	ctx.closePath();
	
	ctx.fillStyle = getTimerStyle(countdownTime, timeLeft);
	ctx.beginPath();
	ctx.moveTo(center, center);
	ctx.arc(center, center, timerB, startPoint, startPoint + (Math.PI * 2 * (pct)));
	ctx.fill();
	ctx.closePath();
	
	ctx.beginPath();
	ctx.font = font;
	ctx.fillStyle = "white";
	ctx.shadowColor = "black";
	ctx.shadowOffsetX = shadowOffset;
	ctx.shadowOffsetY = shadowOffset;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(timeLeft, center, center);
	ctx.closePath();
	return true;
}

function getTimerStyle(max, timeLeft) {
	if (timeLeft <= max * 0.2) {
		return "#cc0000";
	} else if (timeLeft <= max * 0.6) {
		return "#cccc00";
	}
	return "#33cc33";
}