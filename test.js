process.stdin.setRawMode(true);
process.stdin.on('data', (chunk) => { if (c == 3) process.exit(); });

let tests = [];

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
    let test = tests[tests.length - 1];
    await runTest(test.desc, test.str, test.expected);
    // for (let i = 0; i < tests.length; i++) {
    // 	let test = tests[i];
    // 	await runTest(test.desc, test.str, test.expected);
    // }
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
