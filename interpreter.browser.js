let kernel = require('./kernel.js');

function readFile (fileName, resolve) {
    fetch(fileName)
	.then((res) => { return res.text() })
	.then((data) => resolve(null, data))
	.catch((err) => resolve(err, ''));
}

kernel.setReadFileFn(readFile);

var output = document.getElementById('output');

kernel.setWriteFn((outputBuffer) => {
    console.log(outputBuffer);
    output.textContent += outputBuffer;
});

var input = document.getElementById('input');
input.onchange = (ev) => {
    console.log(ev.target.value);
    output.textContent += ev.target.value + ' ';
    kernel.execute(ev.target.value);
    input.value = '';
}

window.onclick = () => {
    input.focus();
}

kernel.run();
