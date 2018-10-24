process.stdin.setRawMode(true);
process.stdin.on('data', (chunk) => { if (c == 3) process.exit(); });

let tests = [];

function addTest(str, expected) {
    tests[tests.length] = { str: str, expected: expected };
}

function runTest (str, expected) {
    let kernel = require('./kernel.js');
    kernel.setExitFn(() => { process.exit(); });
    let fn = function () {
	if (kernel.isOnPause) {
	    kernel.setWriteFn((actual) => {
		if (actual == expected + ' ok\n') {
		    console.log('"' + str + '" passed');
		} else {
		    console.log('"' + str + '" failed. Actual: "' + actual.trim('\n') + '"');
		}
	    });
	    kernel.execute(str);
	    process.exit();
	} else {
	    setTimeout(fn, 1000);
	}
    }
    setTimeout(fn, 10);
}

function runTests () {
    tests.map(function (test) {
	runTest(test.str, test.expected);
    });
}

addTest('1 2 + .', '3 ');
runTests();
