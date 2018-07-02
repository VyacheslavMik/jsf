let memory = [];
let vocabularies = [];

let dataStack = [];
let dp = 0;

let returnStack = [];
let rp = 0;

function dataStackPeek () {
    if (dp === 0) throw "Data stack is underflow";
    return dataStack[dp];
}

function dataStackPop () {
    if (dp === 0) throw "Data stack is underflow";
    return dataStack[--dp];
}

function dataStackPush (value) {
    if (dp === 1024) throw "Data stack is overflow";
    dataStack[dp++] = value;
}

function returnStackPeek () {
    if (rp === 0) throw "Return stack is underflow";
    return returnStack[rp];
}

function returnStackPop () {
    if (rp === 0) throw "Return stack is underflow";
    return returnStack[--rp];
}

function returnStackPush (value) {
    if (rp === 1024) throw "Return stack is overflow";
    returnStack[rp++] = value;
}

function byteArrayToLong (byteArray) {
    var value = 0;
    for ( var i = 0; i < byteArray.length; i++) {
        value = (value * 256) + byteArray[i];
    }
    return value;
};

function isWord (addr) {
    // TODO: need to implement this
    return true;
}

// second bit is set
function isAssembler (flags) {
    return (flags & 2) === 2;
}

function nameField (addr) {
    return addr + 1;
}

function linkField (addr) {
    let nameField = nameField(addr);
    return nameField + memory[nameField];
}

function codeField (addr) {
    return linkField(addr) + 1;
}

function execute () {
    let addr = dataStackPop();
    if (!isWord(addr)) throw "Can not execute non Word";
    let flags = memory[addr];
    if (isAssembler(flags)) {
	let codeField = codeField(addr);
	let stringCount = byteArrayToLong(memory.slice(codeField, codeField + 2));
    }
}

function fn1 (arg1, arg2) {
    console.log("arg1", arg1);
    console.log("arg2", arg2);
    memory[0] = arg1;
    memory[1] = arg2;
    memory[255] = 7;
}
console.log("first run");
dataStackPush(1);
let arr = [5, 0, 9, 3]
console.log(byteArrayToLong(arr.slice(0, 2)));
console.log(arr);

console.log(dataStackPop());
