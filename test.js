process.stdin.setRawMode(true);
process.stdin.on('data', (chunk) => { if (c == 3) process.exit(); });

let tests = [];

function addTest(str, expected) {
    tests[tests.length] = { str: str, expected: expected };
}

function runTest (str, expected) {
    return new Promise(resolve => {
	let kernel = require('./kernel.js');
	kernel.setExitFn(() => { process.exit(); });
	let fn = function () {
	    if (kernel.isOnPause) {
		kernel.setWriteFn((actual) => {
		    if (actual == expected + ' ok\n') {
			console.log('Passed "' + str + '"');
		    } else {
			console.log('Failed "' + str + '". Actual: "' + actual.trim('\n') + '"');
		    }
		    resolve();
		});
		kernel.execute(str);
	    } else {
		setTimeout(fn, 1000);
	    }
	}
	setTimeout(fn, 10);
    });
}

async function runTests () {
    for (let i = 0; i < tests.length; i++) {
	let test = tests[i];
	await runTest(test.str, test.expected);
    }
    process.exit();
}

addTest('code test env.printValue(1); end-code test', 'a[test] 1 ');
addTest('1 2 + .', '3 ');

runTests();
