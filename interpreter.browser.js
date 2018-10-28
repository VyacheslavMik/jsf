let kernel = require('./kernel.js');

function readFile (fileName, resolve) {
    fetch(fileName)
	.then((res) => { return res.text() })
	.then((data) => resolve(null, data))
	.catch((err) => resolve(err, ''));
}

kernel.setReadFileFn(readFile);

kernel.setWriteFn((outputBuffer) => {
    console.log(outputBuffer);
});

function exec() {
    kernel.execute('1 2 + .');
}

kernel.run();

var button = document.getElementById('clickme');
button.addEventListener('click', exec);
