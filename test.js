process.stdin.setRawMode(true);
process.stdin.on('data', (chunk) => { if (c == 3) process.exit(); });

let tests = [];
let failed = [];

function addTest(desc, str, expected) {
    tests[tests.length] = { desc: desc, str: str, expected: expected };
}

function runTest (desc, str, expected) {
    return new Promise(resolve => {
	delete require.cache[require.resolve('./kernel.js')]
	let kernel = require('./kernel.js');
	kernel.setExitFn(() => { process.exit(); });
	let fn = function () {
	    if (kernel.isOnPause) {
		kernel.setWriteFn((actual) => {
		    if (actual == expected + ' ok\n') {
			console.log('Passed "' + desc + '"');
		    } else {
			failed[failed.length] = { desc: desc, str: str, actual: actual.trim('\n') };
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
    console.log("Passed tests");
    console.log();
    for (let i = 0; i < tests.length; i++) {
    	let test = tests[i];
    	await runTest(test.desc, test.str, test.expected);
    }
    console.log();
    console.log();
    console.log("Failed tests");
    console.log();
    for (let i = 0; i < failed.length; i++) {
	let test = failed[i];
	console.log('Failed "' + test.desc + '" ("' + test.str + '"). Actual: "' + test.actual + '"');
    }
    process.exit();
}

var fs = require('fs');
fs.readFile('tests', function (err, data) {
    if (err) {
	throw err; 
    }

    let content = data.toString();
    var regex = /-([\s\S]*?)-\n-([\s\S]*?)-\n-([\s\S]*?)-\n/g;
    var match = regex.exec(content);

    while (match != null) {
    	addTest(match[1], match[2], match[3]);
    	match = regex.exec(content);
    }

    runTests();
})
