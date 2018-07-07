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

function readNextString (input) {
    let count = readNextByte(input);
    let value = "";
    for (let i = 0; i < count; i++) {
	value += String.fromCharCode(readNextByte(input));
    }
    return value;
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
// link to code field       - 1 cell
// link to parameters field - 1 cell
// name
//   count                  - 1 byte
//   string                 - <count> bytes
// code                     - cells for end of entry
// parameters               - cells for end of entry
function entry (name, flags) {
    let lastWord = vocabularies[0].word;
    vocabularies[0].word = memory.length;
    writeNextByte(memory, 2);
    writeNextCell(memory, lastWord);
    writeNextString(memory, name);
}

function asmEntry (name, code) {
    vocab("assembler");
    entry(name, 2);
    writeNextCell(memory, asm_vocab.p);
    asmVocabPush(code);
}

function execAsm (fn) {
    return new Promise(returnFromCode => {
	fn(returnFromCode);
    });
}

function makeAsm (str) {
    return Function('returnFromCode', str);
}

let asmFn = makeAsm(`console.log(111);
//returnFromCode(7);
`);

async function address_interpreter () {
    while (return_stack.p > 0) {
	let code_addr = returnStackPopCell();
	let parm_addr = returnStackPopCell();

	let code = readCell(memory, code_addr);
	if (parm_addr > 0) {
	    parm = readCell(memory, parm_addr);
	}

	if (code == 1) {
	    let _ = await execAsm(asmVocabPeek(parm));
	} else if (code == 2) {
	} else {
	}

	// if (!isWord(addr))
	//     throw "Can not interpret non-Word";

	let cf = codeField(addr);
	let asm_addr = readCell(memory, cf);
	let js_fun = asmVocabPeek(asm_addr);
	js_fun();
    }
}

writeNextByte(memory, 0); 		// zero byte is empty and nothing;
writeNextByte(memory, 0);		// first byte is empty and define an assembler word;
writeNextByte(memory, 0);		// second byte is empty and define constant;

vocab("assembler");
vocab("forth");

asmEntry("here", "dataStackPushCell(memory.length)");
asmEntry("+", "dataStackPushCell(dataStackPopCell() + dataStackPopCell())");
asmEntry(".", "console.log(dataStackPopCell())");

function dumpAll () {
    // console.log("------------");
    // console.log(memory);
    // console.log(asm_vocab);
    // console.log(data_stack);
    // console.log(return_stack);
    // console.log(vocabularies);
}

const readline = require('readline');
let receiveKey = undefined;
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
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

async function waitAsm () {
    console.log(await execAsm(asmFn));
}

waitAsm();


async function mainLoop() {
    let isActive = true;
    while (isActive) {
	let key = await readKey();
	console.log(key);
	if (key == 13) {
	    isActive = false;
	}
    }
    process.exit();
}

mainLoop();

// asyncCode();
// finish();

//console.log(readKey());

//console.log(memory);

// dataStackPushCell(1);
// dumpAll();
// execute();

// dataStackPushCell(1);
// dumpAll();
// execute();

// dataStackPushCell(11);
// dumpAll();
// execute();

// dataStackPushCell(18);
// dumpAll();
// execute();

// dumpAll();
