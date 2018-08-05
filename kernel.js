// need to refactor
let memory = [];
let vocabularies = [];
let tib = [];

let blk = 0;
let blk_tmp = 0;

let to_in = 0;
let to_in_tmp = 0;

let blocks = [];

let output_buffer = '';
let line_length = 0;
let isPrintingOutput = false;

let isOnPause = false;

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

function readNextCell (input) {
    let value = readCell(input.arr, input.p);
    input.p += 2;
    return value;
}

function writeCell (arr, addr, value) {
    arr[addr + 1] = value & 0xFF;
    arr[addr] = (value >> 8) & 0xFF;
}

function writeNextCell (arr, value) {
    writeCell(arr, arr.length, value);
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

function readNextByte (input) {
    let value = readByte(input.arr, input.p);
    input.p++;
    return value;
}

function writeByte (arr, addr, value) {
    arr[addr] = value & 0xFF;
}

function writeNextByte (arr, value) {
    writeByte(arr, arr.length, value);
}

function stackPushByte (stack, value) {
    if (stack.p == stack.limit)
	throw stack.desc + " is overflow";
    writeByte(stack.arr, stack.p, value);
    stack.p++;
}

function stackPopByte (stack) {
    if (stack.p == 0)
	throw stack.desc + " is underflow";
    let value = readByte(stack.arr, stack.p - 1);
    stack.p--;
    return value;
}

function stackPeekByte (stack) {
    if (stack.p === 0)
	throw stack.desc + " is underflow";
    readByte(stack.arr, stack.p);
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

function writeNextString (arr, value) {
    writeString(arr, arr.length, value);
}

let asm_vocab    = { arr: [], p: 0 };
let data_stack   = { arr: [], p: 0, desc: "Data stack", limit: 1024 };
let return_stack = { arr: [], p: 0, desc: "Return stack", limit: 1024 };

function asmVocabPush (value) {
    if (asm_vocab.p == 1024)
	throw "Assembler vocabulary is overflow";
    asm_vocab.arr[asm_vocab.p] = value;
    asm_vocab.p++;
}

function asmVocabPeek (addr) {
    if (addr > asm_vocab.p && addr < 0)
	throw "Assembler peek is out of range";
    return asm_vocab.arr[addr];
}

function dataStackPushByte (value) { stackPushByte(data_stack, value); }
function dataStackPopByte  ()      { return stackPopByte(data_stack); }
function dataStackPeekByte ()      { return stackPeekByte(data_stack); }
function dataStackPushCell (value) { stackPushCell(data_stack, value); }
function dataStackPopCell  ()      { return stackPopCell(data_stack); }
function dataStackPopNum  ()       { return stackPopNum(data_stack); }
function dataStackPeekCell ()      { return stackPeekCell(data_stack); }

function returnStackPushByte (value) { stackPushByte(return_stack, value); }
function returnStackPopByte  ()      { return stackPopByte(return_stack); }
function returnStackPeekByte ()      { return stackPeekByte(return_stack); }
function returnStackPushCell (value) { stackPushCell(return_stack, value); }
function returnStackPopCell  ()      { return stackPopCell(return_stack); }
function returnStackPeekCell ()      { return stackPeekCell(return_stack); }

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

// Dictionary entry
// flags                    - 1 byte
// link to previous word    - 1 cell
// name
//   count                  - 1 cell
//   string                 - <count> bytes
// code pointer             - 1 cell
// data field               - cells with data

function entry (name) {
    let lastWord = vocabularies[0].word;
    vocabularies[0].word = memory.length;

    writeNextByte(memory, 0);           // flags
    writeNextCell(memory, lastWord);    // link to previous word
    writeNextString(memory, name);      // word name
}

function readWord () {
    let input_stream = tib;
    if (blk > 0) {
	let idx = blk - 1;
	if (blocks[idx] == undefined) {
	    throw 'Cannot read block ' + blk;
	}
	input_stream = blocks[idx];
    }

    let line = readString(input_stream, 0);
    let word = '';

    for (; to_in < line.length; to_in++) {
    	let key = line.charCodeAt(to_in);
    	if (key > 32) {
	    break;
    	}
    }

    for (; to_in < line.length; to_in++) {
	let key = line.charCodeAt(to_in);
	if (key <= 32) {
	    return word;
	} else {
	    word += line[to_in];
	}
    }

    // rewrite recursive function
    if (blk > 0) {
	blk = blk_tmp;
	to_in = to_in_tmp;
	blk_tmp = 0;
	to_in_tmp = 0;
	return readWord();
    }

    return word;
}

function setBlock (val) {
    to_in_tmp = to_in;
    blk_tmp = blk;

    to_in = 0;
    blk = val;
}

function getToIn () {
    return to_in;
}

function setToIn(val) {
    to_in = val;
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

const readline = require('readline');
let receiveKey = undefined;
readline.emitKeypressEvents(process.stdin);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
});
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {

    if (key.sequence.charCodeAt(0) == 3) {
	process.exit()
    }; // for test reason

    if (receiveKey != undefined) {
	let handler = receiveKey;
	receiveKey = undefined;
	handler(key.sequence.charCodeAt(0));
    }
});

function printValue (v) {
    output_buffer += ' ' + v;
}

function printLast (v) {
    output_buffer += v + '\n';
}

function printOutput () {
    isPrintingOutput = true;
    readline.moveCursor(process.stdout, line_length, -1);
    rl.write(output_buffer);
    output_buffer = '';
    isPrintingOutput = false;
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

let env = {memory:              memory,
	   rs:                  return_stack,
	   ds:                  data_stack,
	   vocabularies:        vocabularies,

	   asm_entry:           asm_entry,
	   entry:               entry,

	   find_word:           find_word,
	   printStack:          printStack,
	   printValue:          printValue,

	   readCell:            readCell,
	   writeCell:           writeCell,

	   readByte:            readByte,
	   writeByte:           writeByte,

	   writeNextByte:       writeNextByte,
	   writeNextCell:       writeNextCell,

	   getToIn:             getToIn,
	   setToIn:             setToIn,
	   code_pointer_addr:   code_pointer_addr,

	   dataStackPopCell:    dataStackPopCell,
	   dataStackPopNum:     dataStackPopNum,
	   dataStackPushCell:   dataStackPushCell,
	   dataStackPeekCell:   dataStackPeekCell,

	   returnStackPopCell:  returnStackPopCell,
	   returnStackPushCell: returnStackPushCell,
	   returnStackPeekCell: returnStackPeekCell,

	   setBlock:            setBlock,
	   readWord:            readWord};

function execAsm (fn) {
    fn(env);
}

function makeAsm (str) {
    return Function('env', str);
}

function asm_entry (name, code) {
    vocab("assembler");
    entry(name);
    writeNextCell(memory, 1);
    writeNextCell(memory, asm_vocab.p);
    asmVocabPush(makeAsm(code));
}

function pause() {
    isOnPause = true;
}

function resume() {
    isOnPause = false;
    address_interpreter();
    word_interpreter();
}

rl.on('line', (line) => {
    if (!isPrintingOutput) {
	line_length = line.length;
	writeString(tib, 0, line);
	to_in = 0;
	resume();
    }
});

// create function pause and resume
// In resume we start address_interpreter
// then word_interpreter.
// when we receive input we resume.
// functions that need to wait need to execute
// pause()
// refactor functions address_interpreter and
// word_interpreter to stop when pause.

// use buffered output; firstly we store
// data in buffer and then send output
// DONE

function address_interpreter () {
    while (return_stack.p > 0) {
	if (isOnPause) break;

	let code_addr = returnStackPopCell();
	let code = readCell(memory, code_addr);
	if (code == 1) {
	    let asm_pointer = readCell(memory, code_addr + 2);
	    execAsm(asmVocabPeek(asm_pointer));
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
	printLast("          2 - asm_vocab");
	printLast("          3 - data_stack");
	printLast("          4 - return_stack");
	printLast("          5 - vocabularies");
	printLast("          6 - blk");
	printLast("          7 - blocks")
	printLast("          8 - word");
    }
    if (flag == 1) {
	let start = dataStackPopCell();
	let end   = dataStackPopCell();
	printValue(memory.slice(start, end));
    }
    if (flag == 2) {
	printValue(asm_vocab);
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
}

var fs = require('fs');

function load (name) {
    pause();
    fs.readFile( __dirname + '/' + name, function (err, data) {
	if (err) {
	    throw err; 
	}
	let content = data.toString();
	let count = Math.ceil(content.length / 1024);

	for (var i = 0; i < count; i++) {
	    let arr = [];
	    let str = content.substring(i * 1024, (i + 1) * 1024);
	    writeString(arr, 0, str);
	    blocks[i] = arr;
	}

	blk = 1;
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
function word_interpreter () {
    let message = 'ok';
    let word = readWord();

    let count = 0;

    try {
	while (!isOnPause && word != '') {
	    let word_addr = find_word(word);
	    if (word_addr != undefined && isImmediate(word_addr) && memory[1] == 0) {
		returnStackPushCell(code_pointer_addr(word_addr));
		address_interpreter();
		message = 'ok';
	    } else if (memory[0] == 0) {
		if (word == 'bye') {
		    process.exit();
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
			    writeNextCell(memory, 3);
			    writeNextCell(memory, integer);
			    message = 'compiled';
			}
		    } else {
			writeNextCell(memory, 2);
			writeNextCell(memory, code_pointer_addr(word_addr));
			message = 'compiled';
		    }
		} else {
		    throw 'What is compiling?!';
		}
	    }
	    word = readWord();
	}

	printLast(' ' + message);
	printOutput();
	pause();
    } catch (err) {
	console.log('Error: ' + err);
	data_stack.p = 0;
	return_stack.p = 0;
    }
}

writeNextByte(memory, 0); 		// compilation state
writeNextByte(memory, 0);		// first byte is empty and define an assembler word;
writeNextByte(memory, 0);		// second byte is empty and define an execute word;
writeNextByte(memory, 0);		// third byte is empty and define an literal word;
writeNextByte(memory, 0);		// compilation vocabulary

vocab("assembler");
vocab("forth");

asm_entry("code", `
let name = env.readWord();
if (name.trim() == '') {
    throw 'Empty string for name' ;
}
env.printValue('a[' + name + ']');
env.memory[0] = 1;
env.memory[1] = { name: name, code: '' };
`);

asm_entry('end-code', `
env.asm_entry(env.memory[1].name, env.memory[1].code);
env.memory[0] = 0;
env.memory[1] = 0;
`);

asm_entry('\\', `env.setToIn((Math.floor(env.getToIn() / 64) + 1) * 64);`);

// gforth

// use blocked.fb 1 load editor
// use /Users/vyacheslavmikushev/Work/jsf/core.f

// copy block: <from-block> <to-block> cp
// clear block: <block> db

// let arr = [0, 0, 0, 0];
// //let x = 4294967295;
// let x = -7;

// console.log(x);

// for (var i = arr.length - 1; i >= 0; i--) {
//     arr[i] = x & 255;
//     x >>= 8;
// }

// var z = 0;

// for (var i = 0; i < arr.length; i++) {
//     z <<= 8;
//     z = z | arr[i];
// }

// console.log(arr, z, z >>> 0);

// console.log('-----------');
// let arr2 = [0, 0, 0, 0];
// writeMemoryDCell(arr2, 0, 5);
// console.log(arr2);
// console.log(readMemoryDCell(arr2, 0));

// console.log('-----------');
// let arr3 = [0, 0, 0, 0];
// writeStackDCell(arr3, 0, 2147483647);
// console.log(arr3);
// console.log(readStackDCell(arr3, 0));


console.log("Welcome to forth interpreter prototype");
console.log("Type 'bye' to exit");
console.log();
console.log();

load('core.f');
