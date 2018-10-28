let fs = require('fs');

process.stdin.setRawMode(true);
process.stdin.on('data', (chunk) => { if (chunk[0] == 3) process.exit(); });

let tests = [];
let failed = [];
let content;

function readFile (fileName, resolve) {
    if (!fs.existsSync(fileName)) {
	throw 'File not found: ' + fileName;
    }
    if (content == undefined) {
	fs.readFile(fileName, function (err, data) {
	    if (!err) {
		content = data.toString();
		resolve(null, content);
	    } else {
		throw err;
	    }
	});
    } else {
	setTimeout(() => { resolve(null, content); }, 0);
    }
}

function addTest(desc, str, expected) {
    tests[tests.length] = { desc: desc, str: str, expected: expected };
}

function runTest (desc, str, expected) {
    return new Promise(resolve => {
	delete require.cache[require.resolve('./kernel.js')]
	let kernel = require('./kernel.js');
	kernel.setExitFn(() => { process.exit(); });
	kernel.setReadFileFn(readFile);
	kernel.run();
	let fn = function () {
	    if (kernel.isOnPause()) {
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

// -key-
// - not_implemented -
// --

// -expect-
// - not_implemented -
// --

// -span-
// - not_implemented -
// --
