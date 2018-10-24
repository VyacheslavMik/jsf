let kernel = require('./kernel.js');

kernel.setWriteFn((outputBuffer) => { process.stdout.write(outputBuffer); });
kernel.setExitFn(() => { process.exit(); });

process.stdin.setRawMode(true);
process.stdin.on('data', (chunk) => {
    if (chunk.length == 1) {
	kernel.processChar(chunk[0]);
    } else {
	for (let i = 0; i < chunk.length; i++) {
	    kernel.processChar(chunk[i]);
	}
    }
});
