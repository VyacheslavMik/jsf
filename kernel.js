// need to refactor
let memory = [];
let vocabularies = [];
let tib = [];

let blk = 0;
let blk_tmp = 0;

let to_in = 0;
let to_in_tmp = 0;

let blocks = [];

function readCell (arr, addr) {
    return arr[addr] * 256 + arr[addr + 1];
};

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

function stackPopCell (stack) {
    if (stack.p <= 1)
	throw stack.desc + " is underflow";
    let value = readCell(stack.arr, stack.p - 2);
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

let env = {memory:              memory,

	   asm_entry:           asm_entry,
	   entry:               entry,

	   find_word:           find_word,

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
	   dataStackPushCell:   dataStackPushCell,
	   dataStackPeekCell:   dataStackPeekCell,

	   returnStackPopCell:  returnStackPopCell,
	   returnStackPushCell: returnStackPushCell,
	   returnStackPeekCell: returnStackPeekCell,

	   setBlock:            setBlock,
	   readWord:            readWord};

function execAsm (fn) {
    return new Promise(returnFromCode => {
	fn(returnFromCode, env);
    });
}

function makeAsm (str) {
    return Function('returnFromCode', 'env', str);
}

function asm_entry (name, code) {
    vocab("assembler");
    entry(name);
    writeNextCell(memory, 1);
    writeNextCell(memory, asm_vocab.p);
    asmVocabPush(makeAsm(code));
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

function readKey () {
    return new Promise(resolve => {
	receiveKey = resolve;
    });
}

let receiveLine = undefined;
rl.on('line', (line) => {
    if (receiveLine != undefined) {
	readline.moveCursor(process.stdout, -10, 0);
	let handler = receiveLine;
	receiveLine = undefined;
	handler(line);
    }
});

function readLine () {
    return new Promise(resolve => {
	receiveLine = resolve;
	rl.prompt();
    });
}

async function address_interpreter () {
    while (return_stack.p > 0) {
	let code_addr = returnStackPopCell();
	let code = readCell(memory, code_addr);
	if (code == 1) {
	    let asm_pointer = readCell(memory, code_addr + 2);
	    await execAsm(asmVocabPeek(asm_pointer));
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

function dump () {
    console.log("------------");
    let flag = dataStackPopCell();
    if (flag > 8 || flag < 1) {
	console.log("end start 1 - memory.slice(start, end)");
	console.log("          2 - asm_vocab");
	console.log("          3 - data_stack");
	console.log("          4 - return_stack");
	console.log("          5 - vocabularies");
	console.log("          6 - blk");
	console.log("          7 - blocks");
    }
    if (flag == 1) {
	let start = dataStackPopCell();
	let end   = dataStackPopCell();
	console.log(memory.slice(start, end));
    }
    if (flag == 2) {
	console.log(asm_vocab);
    }
    if (flag == 3) {
	console.log(data_stack);
    }
    if (flag == 4) {
	console.log(return_stack);
    }
    if (flag == 5) {
	console.log(vocabularies);
    }
    if (flag == 6) {
	console.log(blk);
    }
    if (flag == 7) {
	console.log(blocks);
    }
}

function code_pointer_addr (word_addr) {
    return word_addr + 1 + 2 + 2 + readCell(memory, word_addr + 1 + 2);
}

var fs = require('fs');

function load (name) {
    return new Promise(resolve => {
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

	    resolve();
	});
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
async function word_interpreter () {
    console.log("Welcome to forth interpreter prototype");
    console.log("Type 'bye' to exit");

    let message = '';

    await load('core.f');

    try {
	while (true) {
	    let word = readWord();

	    //console.log('word', word, 'line', readString(tib, 0), 'tib', tib.slice(0, 7), 'blocks', blocks, 'blk', blk);

	    if (word == '') {
		console.log(message);
		let line = await readLine();
		writeString(tib, 0, line);
		to_in = 0;
	    }

	    let word_addr = find_word(word);
	    if (word_addr != undefined && isImmediate(word_addr)) {
		returnStackPushCell(code_pointer_addr(word_addr));
		await address_interpreter();
		message = 'ok';
		continue;
	    }
	    
	    if (memory[0] == 0) {
		if (word == 'bye') {
		    break;
		} else if (word == 'dump') {
		    dump();
		    message = 'ok';
		} else if (word != '') {
		    let word_addr = find_word(word);
		    if (word_addr == undefined) {
			let integer = parseInteger(word);
			if (integer == undefined) {
			    message = 'Word is not found: ' + word;
			} else {
			    dataStackPushCell(integer);
			}
		    } else {
			returnStackPushCell(code_pointer_addr(word_addr));
			await address_interpreter();
			message = 'ok';
		    }
		} else {
		    message = 'ok';
		}
	    } else {
		if (memory[1] != 0) {
		    let word_addr = find_word(word);
		    if (word_addr == undefined) {
			memory[1].code += ' ' + word;
			message = 'compiled';
		    } else {
			returnStackPushCell(code_pointer_addr(word_addr));
			await address_interpreter();
			message = 'ok'
		    }
		} else if (memory[2] != 0) {
		    let word_addr = find_word(word);
		    if (word_addr == undefined) {
			let integer = parseInteger(word);
			if (integer == undefined) {
			    message = 'Word is not found: ' + word;
			} else {
			    writeNextCell(memory, 3);
			    writeNextCell(memory, integer);
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
	}
    } catch (err) {
	console.log("Error:", err);
    }
    process.exit();
}

writeNextByte(memory, 0); 		// compilation state
writeNextByte(memory, 0);		// first byte is empty and define an assembler word;
writeNextByte(memory, 0);		// second byte is empty and define an execute word;
writeNextByte(memory, 0);		// third byte is empty and define an literal word;
writeNextByte(memory, 0);		// compilation vocabulary

vocab("assembler");
vocab("forth");

// need to remember that last code is returnFromCode(<value>)
asm_entry("code", `
let name = env.readWord();
if (name.trim() == '') {
    throw 'Empty string for name' ;
}
console.log('new code', name);
env.memory[0] = 1;
env.memory[1] = { name: name, code: '' };
returnFromCode();
`);

asm_entry('end-code', `
if (!env.memory[1].code.includes('returnFromCode()')) {
    throw 'returnFromCode() not found!!!';
}
env.asm_entry(env.memory[1].name, env.memory[1].code);
env.memory[0] = 0;
env.memory[1] = 0;
returnFromCode();
`);

asm_entry('\\', `
env.setToIn((Math.floor(env.getToIn() / 64) + 1) * 64);
returnFromCode();
`);


word_interpreter();

// code examples
//
// code tmp console.log('from tmp'); returnFromCode(); end-code
// code tmp console.log('from tmp'); end-code

// gforth

// use blocked.fb 1 load editor
// use /Users/vyacheslavmikushev/Work/jsf/core.f

// copy block: <from-block> <to-block> cp
// clear block: <block> db
