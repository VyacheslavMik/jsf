'use strict';

// need to refactor
let memory = [];
let vocabularies = [];

let blks = [];

let blocks = [];
let fileName = '';

let toInPos = 0;
let tibPos = 0;
let numberTibPos = 0;
let bufferPos = 0;
let bufferStatePos = 0;
let bufferBlockPos = 0;
let blockNumberPos = 0;

let outputBuffer = '';
let isPrintingOutput = false;

let isOnPause = false;
let isWaitingKey = false;

let writeFn;
let exitFn;

function readCell (arr, addr) {
    return arr[addr] * 256 + arr[addr + 1];
};

function readCellNum (arr, addr) {
    var sign = arr[addr] & (1 << 7);
    var x = (((arr[addr] & 0xFF) << 8) | (arr[addr + 1] & 0xFF));
    if (sign) {
	x = 0xFFFF0000 | x;  // fill in most significant bits with 1's
    }
    return x;
}

function writeCell (arr, addr, value) {
    arr[addr + 1] = value & 0xFF;
    arr[addr] = (value >> 8) & 0xFF;
}

function stackPushCell (stack, value) {
    if (stack.p + 2 >= stack.limit)
	throw stack.desc + " is overflow";
    writeCell(stack.arr, stack.p, value);
    stack.p += 2;
}

// ------- double numbers ---------- 
// Double numbers are represented on the stack
// with the most-significant 16 bits (with sign) most
// accessible.

// Double numbers are represented in memory by two
// consecutive 16-bit numbers.  The address of the least
// significant 16 bits is two greater than the address of the
// most significant 16 bits.
function readMemoryDCell (arr, addr) {
    let x = 0 | arr[addr];

    x <<= 8;
    x |= arr[addr + 1];

    x <<= 8;
    x |= arr[addr + 2];

    x <<= 8;
    x |= arr[addr + 3];

    return x >>> 0;
}

function writeMemoryDCell (arr, addr, value) {
    arr[addr + 3] = value & 255;
    arr[addr + 2] = (value >> 8) & 255;
    arr[addr + 1] = (value >> 16) & 255;
    arr[addr] = (value >> 24) & 255;
}

function readStackDCell (arr, addr) {
    let x = 0 | arr[addr + 2];

    x <<= 8;
    x |= arr[addr + 3];

    x <<= 8;
    x |= arr[addr];

    x <<= 8;
    x |= arr[addr + 1]

    return x >>> 0;
}

function readStackDCellNum (arr, addr) {
    var sign = arr[addr + 2] & (1 << 7);
    let x = 0 | arr[addr + 2];

    x <<= 8;
    x |= arr[addr + 3];

    x <<= 8;
    x |= arr[addr];

    x <<= 8;
    x |= arr[addr + 1]

    if (sign) {
	x = 0xFFFF000000000000 | x;  // fill in most significant bits with 1's
    }

    return x;
}

function writeStackDCell (arr, addr, value) {
    arr[addr + 1] = value & 255;
    arr[addr] = (value >> 8) & 255;
    arr[addr + 3] = (value >> 16) & 255;
    arr[addr + 2] = (value >> 24) & 255;
}

function stackPopDCell (stack) {
    if (stack.p <= 3)
	throw stack.desc + " is underflow";
    let value = readStackDCell(stack.arr, stack.p - 4);
    stack.p -= 4;
    return value;
}

function stackPopDCellNum (stack) {
    if (stack.p <= 3)
	throw stack.desc + " is underflow";
    let value = readStackDCellNum(stack.arr, stack.p - 4);
    stack.p -= 4;
    return value;
}

function stackPushDCell (stack, value) {
    if (stack.p + 4 >= stack.limit)
	throw stack.desc + " is overflow";
    writeStackDCell(stack.arr, stack.p, value)
    stack.p += 4;
}

// ------- end double numbers ---------- 

function stackPopCell (stack) {
    if (stack.p <= 1)
	throw stack.desc + " is underflow";
    let value = readCell(stack.arr, stack.p - 2);
    stack.p -= 2;
    return value;
}

function stackPopNum (stack) {
    if (stack.p <= 1)
	throw stack.desc + " is underflow";
    let value = readCellNum(stack.arr, stack.p - 2);
    stack.p -= 2;
    return value;
}

function stackPeekCell (stack) {
    if (stack.p <= 1)
	throw stack.desc + " is underflow";
    return readCell(stack.arr, stack.p - 2);
}

function readByte (arr, addr) {
    return arr[addr];
}

function writeByte (arr, addr, value) {
    arr[addr] = value & 0xFF;
}

function readString (arr, addr) {
    let count = readCell(arr, addr);
    let value = '';
    for (let i = 0; i < count; i++) {
	value += String.fromCharCode(readByte(arr, addr + i + 2));
    }
    return value;
}

function readNextString (input) {
    readString(input.arr, input.p)
}

function writeString (arr, addr, value) {
    writeCell(arr, addr, value.length);
    addr += 2;
    let count = value.length & 0xFFFF;
    for (let i = 0; i < count; i++) {
	writeByte(arr, addr++, value.charCodeAt(i));
    }
}

let functions    = { arr: [], p: 0 };
let data_stack   = { arr: [], p: 0, desc: "Data stack", limit: 1024 };
let return_stack = { arr: [], p: 0, desc: "Return stack", limit: 1024 };

function asmVocabPush (value) {
    if (functions.p == 1024)
	throw "Assembler vocabulary is overflow";
    functions.arr[functions.p] = value;
    functions.p++;
}

function asmVocabPeek (addr) {
    if (addr > functions.p && addr < 0)
	throw "Assembler peek is out of range";
    return functions.arr[addr];
}

function dataStackPushCell     (value) { stackPushCell(data_stack, value);     }
function dataStackPushDCell    (value) { stackPushDCell(data_stack, value);    }
function dataStackPopCell      ()      { return stackPopCell(data_stack);      }
function dataStackPopDCell     ()      { return stackPopDCell(data_stack);     }
function dataStackPopDCellNum  ()      { return stackPopDCellNum(data_stack);  }
function dataStackPopNum       ()      { return stackPopNum(data_stack);       }
function dataStackPeekCell     ()      { return stackPeekCell(data_stack);     }

function returnStackPushCell   (value) { stackPushCell(return_stack, value);   }
function returnStackPopCell    ()      { return stackPopCell(return_stack);    }
function returnStackPeekCell   ()      { return stackPeekCell(return_stack);   }

function isWord (addr) {
    // TODO: need to implement this
    return true;
}

function isImmediate (addr) {
    return memory[addr] == 1;
}

function linkField (addr) {
    return addr + 1;
}

function nameField (addr) {
    return linkField(addr) + 2;
}

function codeField (addr) {
    let naddr = nameField(addr);
    return naddr + memory[naddr] + 1;
}

function findVocab (name) {
    for (let i = 0; i < vocabularies.length; i++) {
	if (vocabularies[i].name == name) {
	    return i;
	}
    }
}

function vocab (name) {
    let idx = findVocab(name);
    let vocabulary;
    if (idx == undefined) {
	vocabulary = {name: name, word: 0};
    } else {
	vocabulary = vocabularies[idx];
	vocabularies.splice(idx, 1);
    }
    vocabularies.unshift(vocabulary);
}

function definitions () {
    env.compilation_vocabulary = vocabularies[0];
}

// Dictionary entry
// flags                    - 1 byte
// link to previous word    - 1 cell
// name
//   count                  - 1 cell
//   string                 - <count> bytes
// code pointer             - 1 cell
// data field               - cells with data

function entry (name) {
    let lastWord = env.compilation_vocabulary.word;
    env.compilation_vocabulary.word = env.dp;

    memWriteNextByte(0);           // flags
    memWriteNextCell(lastWord);    // link to previous word
    memWriteNextString(name);      // word name
}

function isControlChar(c) {
    return c < 32 || c == 127;
}

function popBlock() {
    let blk = blks.pop();
    if (blk.num != 0) {
	dataStackPushCell(blk.num);
	block();
	dataStackPopCell();
    }
    writeByte(memory, blockNumberPos, blk.num);
    writeCell(memory, toInPos, blk.to_in);
}

function readWord () {
    while (true) {
	let blk = readByte(memory, blockNumberPos);
	let limit = 0;
	if (blk > 0) {
	    limit = 1025;
	} else {
	    limit = readCell(memory, numberTibPos);
	}

	let to_in = readCell(memory, toInPos);

	// input exhausted
	if (blks.length == 0 && to_in >= limit) {
	    return '';
	}

	let pos = 0;
	if (blk > 0) {
	    limit = bufferPos + limit;
	    pos = bufferPos + to_in;
	} else {
	    limit = tibPos + limit;
	    pos = tibPos + to_in;
	}

	for (; pos < limit; pos++, to_in++) {
	    if (!isControlChar(memory[pos]) && memory[pos] != 32) {
		break;
	    }
	}

	let word = '';
	for (; pos < limit; pos++, to_in++) {
	    if (isControlChar(memory[pos]) || memory[pos] == 32) {
		writeCell(memory, toInPos, to_in);
		return word;
	    } else {
		word += String.fromCharCode(memory[pos]);
	    }
	}

	writeCell(memory, toInPos, to_in);

	if (word != '') {
	    return word;
	}

	if (blks.length != 0) {
	    popBlock();
	}
    }
}

function isBufferUpdated () {
    return memory[bufferStatePos] == 1;
}

function save_buffers () {
    if (isBufferUpdated()) {
	let blk = readByte(memory, bufferBlockPos) - 1;
	let arr = [];
	for (let i = 0; i < 1024; i++) {
	    let c = 32;
	    if (memory[bufferPos + i] != undefined) {
		c = memory[bufferPos + i];
	    }
	    arr[i] = c;
	}
	blocks[blk] = arr;
	memory[bufferStatePos] = 0;
	save_file();
    }
}

function flush () {
    save_buffers();
    writeByte(memory, bufferBlockPos, 0);
}

function buffer_update () {
    memory[bufferStatePos] = 1;
}

function block () {
    let u = dataStackPopCell();

    if (u == 0) throw '0 block is denied';
    
    let blk = readByte(memory, bufferBlockPos);

    if (u != blk) {
	save_buffers();

	let arr = [];
	let c = 32;
	if (blocks[u - 1] != undefined) {
	    arr = blocks[u - 1];
	}
	for (let i = 0; i < 1024; i++) {
	    if (arr[i] == undefined) {
		c = 32;
	    } else {
		c = arr[i];
	    }
	    memory[bufferPos + i] = c;
	}
	writeByte(memory, bufferBlockPos, u);
    }
    dataStackPushCell(bufferPos);
}

function load () {
    let u = dataStackPeekCell();
    let blk = readByte(memory, blockNumberPos);
    let to_in = readCell(memory, toInPos);

    block();
    dataStackPopCell();

    blks.push({ num: blk, to_in: to_in });

    writeByte(memory, blockNumberPos, u);
    writeCell(memory, toInPos, 0);
}

function find_word (name) {
    for (var i = 0; i < vocabularies.length; i++) {
	let word_addr = vocabularies[i].word;
	while (word_addr > 0) {
	    let word_name_addr = word_addr + 1 + 2;
	    let word_name = readString(memory, word_name_addr);
	    if (name == word_name) {
		return word_addr;
	    } else {
		word_addr = readCell(memory, word_addr + 1);
	    }
	}
    }
    return undefined;
}

function printValue (v) {
    outputBuffer += v + ' ';
}

function printChar (c) {
    outputBuffer += String.fromCharCode(c);
}

function printLast (v) {
    outputBuffer += v + '\n';
}

function writeOutput (outputBuffer) {
    if (writeFn != undefined) {
	writeFn(outputBuffer);
    }
}

function printOutput () {
    writeOutput(outputBuffer);
    outputBuffer = '';
}

function pause() {
    isOnPause = true;
    printOutput();
}

function resume() {
    isOnPause = false;
    isWaitingKey = false;

    address_interpreter();
    text_interpreter();
}

function waitKey() {
    pause();
    isWaitingKey = true;
}

const removeSeq = Buffer.from([8, 32, 8]);

function exit() {
    if (exitFn != undefined) {
	exitFn();
    }
}

function processChar(c) {
    if (c == 3)  exit();
    if (isWaitingKey) {
	dataStackPushCell(c);
	resume();
    } else {
	if (c == 13) {
	    outputBuffer = ' ' + outputBuffer;

	    if (!isWaitingKey) {
		resume();
	    }
	} else if (c == 127) {
	    let ntib = readCell(memory, numberTibPos);
	    if (ntib > 0) {
		writeCell(memory, numberTibPos, ntib - 1);
	    }
	    writeOutput(removeSeq)
	} else {
	    writeByte(memory, tibPos + readCell(memory, numberTibPos), c);
	    writeCell(memory, numberTibPos, readCell(memory, numberTibPos) + 1);
	    writeOutput(String.fromCharCode(c));
	}
    }
}

function printStack (stack) {
    let count = stack.p / 2;
    let output = '<' + count + '>';
    for (var i = 0; i < count; i++) {
	let v = readCell(stack.arr, 2 * i);
	if (v > 32767) { v -= 65536; }
	output += ' ' + v;
    }
    printValue(output);
}

function memWriteNextByte (value) {
    writeByte(memory, env.dp, value);
    env.dp += 1;
}

function memWriteNextCell (value) {
    writeCell(memory, env.dp, value);
    env.dp += 2;
}

function memWriteNextString (value) {
    memWriteNextCell(value.length);
    let count = value.length & 0xFFFFFFFF;
    for (let i = 0; i < count; i++) {
	memWriteNextByte(value.charCodeAt(i));
    }
}

function memReadString (addr) {
    return readString(memory, addr);
}

function find () {
    let saddr = dataStackPopCell();
    let count = readByte(memory, saddr);
    let str = '';
    for (let i = 0; i < count; i++) {
	str += String.fromCharCode(readByte(memory, saddr + i + 1));
    }
    let waddr = find_word(str);
    if (waddr == undefined) {
	dataStackPushCell(saddr);
	dataStackPushCell(0);
    } else {
	let caddr = code_pointer_addr(waddr);
	dataStackPushCell(caddr);
	if (isImmediate(waddr)) {
	    dataStackPushCell(1);
	} else {
	    dataStackPushCell(-1);
	}
    }
}

function pruneVocabulary (addr, vocabulary) {
    let word_addr = vocabulary.word;
    while (word_addr > 0) {
	if (word_addr < addr) {
	    vocabulary.word = word_addr;
	    return;
	}
	word_addr = readCell(memory, word_addr + 1);
    }
    vocabulary.word = 0;
}

function forget () {
    let word = readWord();
    let word_addr = env.compilation_vocabulary.word;
    while (word_addr > 0) {
	let name_addr = word_addr + 1 + 2;
	let name = readString(memory, name_addr);
	if (name == word) {
	    break;
	} else {
	    word_addr = readCell(memory, word_addr + 1);
	}
    }
    if (word_addr == 0) {
	throw 'Word not found';
    }
    for (let i = 0; i < vocabularies.length; i++) {
	pruneVocabulary(word_addr, vocabularies[i]);
    }
    env.dp = word_addr;
}

let env = {memory:               memory,
	   rs:                   return_stack,
	   ds:                   data_stack,
	   vocabularies:         vocabularies,
	   dp:                   0,

	   asm_entry:            asm_entry,
	   functions:            functions,
	   entry:                entry,
	   vocab:                vocab,
	   definitions:          definitions,
	   compilation_vocabulary: undefined,
	   semicolonCode:        semicolonCode,

	   pause:                pause,
	   resume:               resume,
	   waitKey:              waitKey,
	   backslash:            backslash,

	   find_word:            find_word,
	   printStack:           printStack,
	   printValue:           printValue,
	   printChar:            printChar,

	   readCell:             readCell,
	   writeCell:            writeCell,

	   readByte:             readByte,
	   writeByte:            writeByte,

	   memWriteNextByte:     memWriteNextByte,
	   memWriteNextCell:     memWriteNextCell,
	   memWriteNextString:   memWriteNextString,

	   memReadString:        memReadString,

	   code_pointer_addr:    code_pointer_addr,

	   dataStackPopCell:     dataStackPopCell,
	   dataStackPopNum:      dataStackPopNum,
	   dataStackPopDCell:    dataStackPopDCell,
	   dataStackPopDCellNum: dataStackPopDCellNum,
	   dataStackPushCell:    dataStackPushCell,
	   dataStackPushDCell:   dataStackPushDCell,
	   dataStackPeekCell:    dataStackPeekCell,

	   returnStackPopCell:   returnStackPopCell,
	   returnStackPushCell:  returnStackPushCell,
	   returnStackPeekCell:  returnStackPeekCell,

	   block:                block,
	   save_buffers:         save_buffers,
	   buffer_update:        buffer_update,
	   flush:                flush,
	   load:                 load,
	   use:                  use,
	   readWord:             readWord,
	   find:                 find,
	   forget:               forget};

function makeAsm (str) {
    return Function('env', str);
}

function asm_entry (name, code) {
    vocab("assembler");
    entry(name);
    memWriteNextCell(1);
    memWriteNextCell(functions.p);
    asmVocabPush(makeAsm(code));
}

function address_interpreter () {
    while (return_stack.p > 0) {
	if (isOnPause) break;

	let code_addr = returnStackPopCell();
	let code = readCell(memory, code_addr);
	if (code == 1) {
	    let asm_pointer = readCell(memory, code_addr + 2);
	    let fn = asmVocabPeek(asm_pointer);
	    fn(env);
	} else if (code == 2) {
	    let code_pointer = readCell(memory, code_addr + 2);
	    returnStackPushCell(code_addr + 4);
	    returnStackPushCell(code_pointer);
	} else if (code == 3) {
	    let integer = readCell(memory, code_addr + 2);
	    returnStackPushCell(code_addr + 4);
	    dataStackPushCell(integer);
	} else {
	    throw 'Unabled to process code: ' + code;
	}
    }
}

function code_pointer_addr (word_addr) {
    return word_addr + 1 + 2 + 2 + readCell(memory, word_addr + 1 + 2);
}

function dump () {
    printLast("\n------------");
    let flag = dataStackPopCell();
    if (flag > 9 || flag < 1) {
	printLast("end start 1 - memory.slice(start, end)");
	printLast("          2 - functions");
	printLast("          3 - data_stack");
	printLast("          4 - return_stack");
	printLast("          5 - vocabularies");
	printLast("          6 - blk");
	printLast("          7 - blocks")
	printLast("          8 - word");
	printLast("          9 - vocabulary words");
    }
    if (flag == 1) {
	let start = dataStackPopCell();
	let end   = dataStackPopCell();
	printValue(memory.slice(start, end));
    }
    if (flag == 2) {
	printValue(functions);
    }
    if (flag == 3) {
	printValue('p: ' + data_stack.p + ' arr: ' + data_stack.arr);
    }
    if (flag == 4) {
	printValue(return_stack);
    }
    if (flag == 5) {
	printValue(vocabularies);
    }
    if (flag == 6) {
	printValue(blk);
    }
    if (flag == 7) {
	printValue(blocks);
    }
    if (flag == 8) {
	let word = readWord();
	if (word == '') {
	    printValue('Specify word');
	    return;
	}
	let word_addr = find_word(word);
	if (word_addr == undefined) {
	    printValue('Word not found: ' + word);
	    return;
	}

	let exit_word = find_word('exit');
	if (exit_word == undefined) {
	    printValue('Word exit is not found');
	    return;
	}
	
	let exit_code_addr = code_pointer_addr(exit_word);
	let word_code_addr = code_pointer_addr(word_addr);
	let output = '';
	let cell = 0;
	do {
	    cell = readCell(memory, word_code_addr);
	    if (cell == 1) {
		output += '[a]';
	    } else if (cell == 2) {
		output += '[c]';
	    } else if (cell == 3) {
		output += '[l]';
	    } else {
		output += '[' + cell + ']';
	    }
	    word_code_addr += 2;
	    cell = readCell(memory, word_code_addr);
	    word_code_addr += 2;
	    output += cell + ' ';
	}
	while (cell != exit_code_addr && cell != undefined);

	printValue(output);
    }
    if (flag == 9) {
	let word = readWord();
	if (word == '') {
	    printValue('Specify vocabulary');
	    return;
	}
	let idx = findVocab(word);
	if (idx == undefined) {
	    printValue('Vocabulary not found: ' + word);
	    return;
	}

	let output = '';
	let word_addr = vocabularies[idx].word;
	while (word_addr > 0) {
	    let word_name_addr = word_addr + 1 + 2;
	    let word_name = readString(memory, word_name_addr);
	    output += word_name + ' ';
	    word_addr = readCell(memory, word_addr + 1);
	}

	printValue(output);
    }
}

var fs = require('fs');

function use (name) {
    pause();

    blocks = [];
    writeByte(memory, bufferBlockPos, 0);
    writeByte(memory, blockNumberPos, 0);

    fileName = __dirname + '/' + name;
    if (!fs.existsSync(fileName)) {
	resume();
	return;
    }

    fs.readFile( fileName, function (err, data) {
	if (err) {
	    throw err; 
	}
	let content = data.toString();
	let count = Math.ceil(content.length / 1024);

	for (var i = 0; i < count; i++) {
	    let arr = [];
	    let str = content.substring(i * 1024, (i + 1) * 1024);
	    writeString(arr, 0, str);
	    arr.shift();
	    arr.shift();
	    blocks[i] = arr;
	}

	resume();
    });
}

function save_file () {
    let output = '';
    for(let i = 0; i < blocks.length; i++) {
	for (let j = 0; j < 1024; j++) {
	    if (blocks[i] == undefined || blocks[i][j] == undefined) {
		output += ' ';
	    } else {
		output += String.fromCharCode(blocks[i][j]);
	    }
	}
    }
    pause();
    fs.writeFile(fileName, output, function(err) {
	if(err) {
	    console.log(err);
	    process.exit();
	}
	resume();
    }); 
}

function parseInteger (str) {
    for (var i = 0; i < str.length; i++) {
	if (i == 0 && str[i] == '-') {
	    continue;
	}
	if (str[i] < '0' || str[i] > '9') {
	    return undefined;
	}
    }
    return parseInt(str);
}

// implement word interpreter
// write word to tib
// first cell is a length of input
function text_interpreter () {
    let message = 'ok';
    let word = readWord();
    try {
	while (!isOnPause && word != '') {
	    let word_addr = find_word(word);
	    if (word_addr != undefined && isImmediate(word_addr) && memory[1] == 0) {
		returnStackPushCell(code_pointer_addr(word_addr));
		address_interpreter();
		message = 'ok';
	    } else if (memory[0] == 0) {
		if (word == 'bye') {
		    exit();
		    break;
		} else if (word == 'dump') {
		    dump();
		    message = 'ok';
		} else if (word != '') {
		    let word_addr = find_word(word);
		    if (word_addr == undefined) {
			let integer = parseInteger(word);
			if (integer == undefined) {
			    throw 'Word is not found: ' + word;
			} else {
			    dataStackPushCell(integer);
			}
		    } else {
			returnStackPushCell(code_pointer_addr(word_addr));
			address_interpreter();
			message = 'ok';
		    }
		} else {
		    message = 'ok';
		}
	    } else {
		if (memory[1] != 0) {
		    let word_addr = find_word(word);
		    if (word != 'end-code') {
			memory[1].code += ' ' + word;
			message = 'compiled';
		    } else {
			returnStackPushCell(code_pointer_addr(word_addr));
			address_interpreter();
			message = 'ok';
		    }
		} else if (memory[2] != 0) {
		    let word_addr = find_word(word);
		    if (word_addr == undefined) {
			let integer = parseInteger(word);
			if (integer == undefined) {
			    throw 'Word is not found: ' + word;
			} else {
			    memWriteNextCell(3);
			    memWriteNextCell(integer);
			    message = 'compiled';
			}
		    } else {
			memWriteNextCell(2);
			memWriteNextCell(code_pointer_addr(word_addr));
			message = 'compiled';
		    }
		} else {
		    throw 'What is compiling?!';
		}
	    }
	    if (!isOnPause) {
		word = readWord();
	    }
	}

	if (!isOnPause) {
	    printLast(' ' + message);
	    pause();
	    writeCell(memory, toInPos, 0);
	    writeCell(memory, numberTibPos, 0);
	}
    } catch (err) {
	printOutput();
	console.log('Error: ' + err);
	writeCell(memory, numberTibPos, 0);
	writeCell(memory, toInPos,  0);
	writeByte(memory, blockNumberPos, 0);
	writeByte(memory, 0, 0);
	data_stack.p = 0;
	return_stack.p = 0;
    }
}

memWriteNextByte(0); 		// compilation state
memWriteNextByte(0);		// first byte is empty and define an assembler word;
memWriteNextByte(0);		// second byte is empty and define an execute word;
memWriteNextByte(0);		// third byte is empty and define an literal word;
memWriteNextCell(0);		// compilation vocabulary

toInPos = env.dp;
memWriteNextCell(0);               // >in

numberTibPos = env.dp;
memWriteNextCell(0);

tibPos = env.dp;
for (let i = 0; i < 1024; i++) {        // tib
    memWriteNextByte(0);
}

bufferPos = env.dp;
for (let i = 0; i < 1024; i++) {        // buffer
    memWriteNextByte(0);
}

bufferStatePos = env.dp;
memWriteNextByte(0);               // buffer state

bufferBlockPos = env.dp;
memWriteNextByte(0);               // buffer block state

blockNumberPos = env.dp;
memWriteNextByte(0);               // block number

vocab("assembler"); definitions();

asm_entry("code", `
let name = env.readWord();
if (name.trim() == '') {
    throw 'Empty string for name' ;
}
env.printValue('a[' + name + ']');
env.memory[0] = 1;
env.memory[1] = {
                  name: name,
                  code: '',
                  make: function(v) {
                            env.asm_entry(v.name, v.code);
                        }
                };
`);

function semicolonCode (v) {
    asmVocabPush(makeAsm(v.code))
}

asm_entry(";code", `
let w = env.code_pointer_addr(env.find_word('does>'));
env.memWriteNextCell(2);
env.memWriteNextCell(w);
env.memWriteNextCell(1);
env.memWriteNextCell(env.functions.p);
w = env.code_pointer_addr(env.find_word('exit'));
env.memWriteNextCell(2);
env.memWriteNextCell(w);
env.memory[0] = 1;
env.memory[2] = 0;
env.memory[1] = {
                  code: '',
                  make: env.semicolonCode
                };
`);

memory[env.compilation_vocabulary.word] = 1;

asm_entry('end-code', `
env.memory[1].make(env.memory[1]);
env.memory[0] = 0;
env.memory[1] = 0;
`);

vocab("forth"); definitions();

function backslash () {
    writeCell(memory, toInPos, (Math.floor(readCell(memory, toInPos) / 64) + 1) * 64);
}

asm_entry('\\', `env.backslash();`);
asm_entry('load', `env.load();`);

use('core.f');

outputBuffer =
    'Welcome to forth interpreter prototype\n' +
    'Type \'bye\' to exit\n\n';

env.numberTibPos   = numberTibPos;
env.toInPos        = toInPos;
env.blockNumberPos = blockNumberPos;
env.tibPos         = tibPos;

let arr = [];
writeString(arr, 0, '1 load');
for (let i = 2; i < arr.length; i++) {
    writeByte(memory, tibPos + i - 2, arr[i]);
}
writeCell(memory, numberTibPos, arr.length - 2);

function execute (str) {
    let arr = [];
    writeString(arr, 0, str);
    for (let i = 2; i < arr.length; i++) {
	writeByte(memory, tibPos + i - 2, arr[i]);
    }
    writeCell(memory, numberTibPos, arr.length - 2);
    resume();
}

module.exports = {
    processChar: processChar,
    setWriteFn: (v) => { writeFn = v },
    setExitFn: (v) => { exitFn = v },
    execute: execute,
    isOnPause: isOnPause
};
