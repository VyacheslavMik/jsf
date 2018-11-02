let kernel = require('./kernel.js');
let charCount = 0;

function readFile (fileName, resolve) {
    fetch(fileName)
	.then((res) => { return res.text() })
	.then((data) => resolve(null, data))
	.catch((err) => resolve(err, ''));
}

kernel.setReadFileFn(readFile);

var terminal = document.getElementById('terminal');
var stub = document.getElementById('stub');

stub.onkeypress = (ev) => {
    let c;
    if (ev.keyCode != 0) {
	c = ev.keyCode;
    } else if (ev.charCode != 0) {
	c = ev.charCode;
    } else {
	alert('aaaaa');
	throw 'Do not know what to do!';
    }
    if (c != 8) {
    charCount++;
	kernel.processChar(c);
    }
}

stub.onkeydown = (ev) => {
    let c;
    if (ev.keyCode != 0) {
	c = ev.keyCode;
    } else if (ev.charCode != 0) {
	c = ev.charCode;
    } else {
	alert('aaaaa');
	throw 'Do not know what to do!';
    }
    if (c == 8) {
	kernel.processChar(127);
	if (charCount > 0 && !kernel.isWaitingKey()) {
	    let s = terminal.textContent;
	    terminal.textContent = s.slice(0, -3) + '|';
	    charCount--;
	}
    }
}

kernel.setWriteFn((outputBuffer) => {
    if (outputBuffer.charCodeAt(outputBuffer.length - 1) == 10) {
	charCount = 0;
    }
    let s = terminal.textContent;
    terminal.textContent = s.slice(0, -1) + outputBuffer + '|';
    window.scrollTo(0,document.body.scrollHeight);
});

window.onclick = () => {
    stub.focus();
}

stub.focus();

kernel.setExitFn((err) => {
    stub.parentNode.removeChild(stub);
    terminal.parentNode.removeChild(terminal);
    let text;
    if (err) {
	text = err;
    } else {
	text = 'See you later!';
    }
    document.body.innerHTML += '<div id="leave"><div class="content"><span>'+ text +
	'</span><button id="restart" onClick="window.location.reload()">Restart</button></div></div>';
});

kernel.run();
