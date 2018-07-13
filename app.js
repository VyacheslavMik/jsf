let memory = [];
let tib = [];
let vocabularies = [];

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
    readCell(stack.arr, stack.p);
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
    let count = readByte(arr, addr);
    let value = '';
    for (let i = 0; i < count; i++) {
	value += String.fromCharCode(readByte(arr, addr + i + 1));
    }
    return value;
}

function readNextString (input) {
    readString(input.arr, input.p)
}

function writeString (arr, addr, value) {
    writeByte(arr, addr++, value.length);
    let count = value.length & 0xFF;
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
//   count                  - 1 byte
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

function readWord (line) {
    line = line.trim();
    let word = '';
    for (var i = 0; i < line.length; i++) {
	let key = line.charCodeAt(i);
	if (key <= 32) {
	    return {word: word, line: line.substr(i)};
	} else {
	    word += line[i];
	}
    }
    return {word: word, line: ''};
}

function execAsm (fn) {
    return new Promise(returnFromCode => {
	fn(returnFromCode,
	   {memory: memory,
	    asm_entry: asm_entry,
	    readString: readString,
	    writeString: writeString,
	    tib: tib,
	    readWord: readWord});
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

let asmFn = makeAsm(`console.log(111);
//returnFromCode(7);
`);

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
	} else {
	    throw "Unabled to process non assembler code";
	}
    }
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

function dumpAll () {
    console.log("------------");
    console.log(memory);
    console.log(asm_vocab);
    console.log(data_stack);
    console.log(return_stack);
    console.log(vocabularies);
}

function code_pointer_addr (word_addr) {
    return word_addr + 1 + 2 + 1 + memory[word_addr + 1 + 2];
}

// implement word interpreter
// write word to tib
// first cell is a length of input
async function word_interpreter () {
    console.log("Welcome to forth interpreter prototype");
    console.log("Type 'bye' to exit");
    console.log();

    let count = 0;

    try {
	let line = await readLine();
	writeString(tib, 0, line);
	let word = '';
	while (true) {
	    let parsed = readWord(readString(tib, 0));
	    word = parsed.word;
	    line = parsed.line;

	    writeString(tib, 0, line);

	    console.log('word', word, 'line', line, 'tib', tib.slice(0, 7));

	    if (count > 5) {
		break;
	    }
	    count++;

	    if (word == 'bye') {
		break;
	    } else if (word == 'dumpall') {
		dumpAll();
	    } else if (word != '') {
		let word_addr = find_word(word);
		if (word_addr == undefined) {
		    console.log("Word is not found: " + word);
		} else {
		    returnStackPushCell(code_pointer_addr(word_addr));
		    await address_interpreter();
		    console.log('ok');
		}
	    } else {
		console.log('ok');
	    }

	    if (line == '') {
		line = await readLine();
		writeString(tib, 0, line);
	    }
	}
    } catch (err) {
	console.log("Error:", err);
    }
    process.exit();
}

writeNextByte(memory, 0); 		// zero byte is empty and nothing;
writeNextByte(memory, 0);		// first byte is empty and define an assembler word;

vocab("assembler");
vocab("forth");

// need to remember that last code is returnFromCode(<value>)
asm_entry("code",
	  `
let parsed;
if (env.memory[1] == 0) {
parsed = env.readWord(env.readString(env.tib, 0));
env.writeString(env.tib, 0, parsed.line);
env.memory[1] = {name: parsed.word, code: ''};
}

do {
parsed = env.readWord(env.readString(env.tib, 0));
env.writeString(env.tib, 0, parsed.line);
if (parsed.word == ';code') {
console.log(env.memory[1].code);
env.asm_entry(env.memory[1].name, env.memory[1].code);
env.memory[1] = 0;
break;
} else {
env.memory[1].code += ' ' + parsed.word;
}
}
while (parsed.word != '');
returnFromCode();
`);


word_interpreter();

// code examples
//
// code tmp console.log('from tmp'); returnFromCode(); ;code
// code tmp console.log('from tmp'); ;code
