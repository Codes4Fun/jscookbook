// generates strings for array of n-dimension input and an output element
// r is an offset that rotates the input variables
function generateVariables(n,r) {
	console.assert(n > 0);
	if (r == undefined) r = 0;
	var pn = Math.pow(2, n-1);
	var d = [];
	var o = [];
	for (let j = 0; j < pn; j++) {
		let dj = [];
		for (let i = 0; i < n; i++) {
			let i2 = (i + r) % n;
			dj.push("d["+j+"]["+i2+"]");
		}
		d.push(dj);
		o.push("o["+j+"]");
	}
	return {d:d, o:o};
}

// reduces by repeatedly removing the last element, by cross multiplying and combining equations
function reduce(v) {
	let d = v.d;
	let o = v.o;
	while (d.length > 1) {
		var d2 = [];
		var o2 = [];
		for (let j = 0; j < d.length; j+=2) {
			let d2j = [];
			let a = d[j];
			let b = d[j+1];
			let last = a.length - 1;
			let last_a = a[last];
			let last_b = b[last];
			for (let i = 0; i < last; i++) {
				d2j.push("("+a[i]+"*"+last_b+" - "+b[i]+"*"+last_a+")");
			}
			o2.push("("+o[j]+"*"+last_b+" - "+o[j+1]+"*"+last_a+")");
			d2.push(d2j);
		}
		d = d2;
		o = o2;
	}
	return {d:d, o:o};
}

function generateSolver(n) {
	var pn = Math.pow(2, n-1);
	var funcBody = "";
	funcBody += "  let d = v.d;\n";
	funcBody += "  let o = v.o;\n";
	funcBody += "  console.assert(d.length == "+pn+");\n";
	funcBody += "  return [\n";
	for (let i = 0; i < n; i++) {
		var v = generateVariables(n,i);
		v = reduce(v);
		funcBody += "    "+v.o[0]+" / "+v.d[0][0]+",\n";
		//console.log(v.o[0]+" / "+v.d[0][0]);
	}
	funcBody += "  ];\n";
	return new Function("v",funcBody);
	//return funcBody;
}

// used to test a generated solver
// given variable array s, generate d,o
// example: generateSolver(2)(generateRandomData([1,2]))
function generateRandomData(s) {
	let n = s.length;
	var pn = Math.pow(2, n-1);
	let d = [];
	let o = [];
	for (let j = 0; j < pn; j++) {
		let dj = [];
		let oj = 0;
		for (let i = 0; i < n; i++) {
			let dji = Math.random();
			oj += s[i]*dji;
			dj.push(dji);
		}
		o.push(oj);
		d.push(dj);
	}
	return {o:o, d:d};
}

// given variable array s, should also output s
function testSolving(s) {
	let solver = generateSolver(s.length);
	let data = generateRandomData(s);
	return solver(data);
}
