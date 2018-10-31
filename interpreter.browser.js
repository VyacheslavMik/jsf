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

terminal.onkeypress = (ev) => {
    charCount++;
    kernel.processChar(ev.keyCode);
}

terminal.onkeydown = (ev) => {
    if (ev.keyCode == 8) {
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
    terminal.focus();
}

terminal.focus();

kernel.setExitFn((err) => {
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
