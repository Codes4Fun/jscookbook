
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

// variable string reducer
// reduces by repeatedly removing the last element, by cross multiplying and combining equations
function reduceVariables(v) {
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

// generates a function that solves n variables
function generateSolver(n) {
	var pn = Math.pow(2, n-1);
	var funcBody = "";
	funcBody += "  let d = v.d;\n";
	funcBody += "  let o = v.o;\n";
	funcBody += "  console.assert(d.length == "+pn+");\n";
	funcBody += "  return [\n";
	for (let i = 0; i < n; i++) {
		var v = generateVariables(n,i);
		v = reduceVariables(v);
		funcBody += "    "+v.o[0]+" / "+v.d[0][0]+",\n";
	}
	funcBody += "  ];\n";
	return new Function("v",funcBody);
}

// generates data to test a solver
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
			let dji = Math.random()*2;
			oj += s[i]*dji;
			dj.push(dji);
		}
		o.push(oj);
		d.push(dj);
	}
	return {o:o, d:d};
}

// tests a generated solver against random data set
// given variable array s, should recalculate s
function testSolving(s) {
	let solver = generateSolver(s.length);
	let data = generateRandomData(s);
	return solver(data);
}

// generates data to test a solver
// only generates the minimum data to solve
function generateRandomMinimumData(s) {
	let n = s.length;
	let d = []; // minimum inputs
	let o = []; // minimum outputs
	for (let j = 0; j < n; j++) {
		let dj = [];
		let oj = 0;
		for (let i = 0; i < n; i++) {
			let dji = Math.random()*2;
			oj += s[i]*dji;
			dj.push(dji);
		}
		o.push(oj);
		d.push(dj);
	}
	return {o:o, d:d};
}

// expands minimum data to fit a solver
function expandData(v) {
	if (v.o.length <= 2) {
		return v;
	}
	let d = [];
	let o = [];
	let j = 0;
	for (; j < 2; j++) {
		o.push(v.o[j]);
		d.push(v.d[j]);
	}
	for (; j < v.o.length; j++) {
		let o2 = [];
		let d2 = [];
		for (let i = 0; i < o.length; i++) {
			o2.push(o[i]);
			o2.push(v.o[j]);
			d2.push(d[i]);
			d2.push(v.d[j]);
		}
		o = o2;
		d = d2;
	}
	return {d:d, o:o};
}

// tests a generated solver against a random minimum data set
// given variable array s, should recalculate s
function testSolvingMinimum(s) {
	let solver = generateSolver(s.length);
	let data = generateRandomMinimumData(s);
	data = expandData(data);
	return solver(data);
}

// a reduction algorithm that can fail from precision loss
// r - rotates data, changes the remaining data, r=0 reduces to 0, r=1 reduces to 1, etc
function reduce(v, r) {
	let d = v.d;
	let o = v.o;
	while (d.length > 1) {
		var d2 = [];
		var o2 = [];
		for (let j = 0; j < d.length; j+=2) {
			let d2j = [];
			let a = d[j];
			let b = d[j+1];
			let e = (a.length - 1 + r) % a.length; // eliminate last one
			let e_a = a[e];
			let e_b = b[e];
			for (let i = 0; i < a.length; i++) {
				let i2 = (i + r) % a.length;
				if (i2 == e) continue; // skip the eliminated
				d2j.push(a[i2]*e_b - b[i2]*e_a);
			}
			o2.push(o[j]*e_b - o[j+1]*e_a);
			d2.push(d2j);
		}
		r = 0; // only rotate the initial input
		d = d2;
		o = o2;
	}
	return {d:d, o:o};
}

// a reduction algorithm that normalizes to maximize precision
// r - rotates data, changes the remaining data, r=0 reduces to 0, r=1 reduces to 1, etc
function normalizingReduce(v, r) {
	let d = v.d;
	let o = v.o;
	//let scalar = 1;
	while (d.length > 1) {
		var d2 = [];
		var o2 = [];
		for (let j = 0; j < d.length; j+=2) {
			let d2j = [];
			let a = d[j];
			let b = d[j+1];
			let e = (a.length - 1 + r) % a.length; // eliminate last one
			let e_a = a[e];
			let e_b = b[e];
			for (let i = 0; i < a.length; i++) {
				let i2 = (i + r) % a.length;
				if (i2 == e) continue; // skip the eliminated
				d2j.push(a[i2]*e_b - b[i2]*e_a);
			}
			o2.push(o[j]*e_b - o[j+1]*e_a);
			d2.push(d2j);
		}
		r = 0; // only rotate the initial input
		d = d2;
		o = o2;
		// get absolute max value
		let absmax = 0;
		for (let j = 0; j < d.length; j++) {
			for (let i = 0; i < d[j].length; i++) {
				let absd = Math.abs(d[j][i]);
				if (absd > absmax)
					absmax = absd;
			}
			let abso = Math.abs(o[j]);
			if (abso > absmax)
				absmax = abso;
		}
		if (absmax == 0) throw "absmax = 0";
		// normalize to absolute max value
		for (let j = 0; j < d.length; j++) {
			for (let i = 0; i < d[j].length; i++) {
				d[j][i] /= absmax;
			}
			o[j] /= absmax;
		}
	}
	return {d:d, o:o};
}

// generic solver, works with almost any number of unsolved variables
function genericSolver(v) {
	let n = v.d[0].length; // dimensions of an input
	let pn = Math.pow(2, n-1); // number of inputs
	if (v.d.length != pn) throw "inadequate data set";
	let s = [];
	for (let i = 0; i < n; i++) {
		let v2 = normalizingReduce(v, i);
		console.assert(v2.d[0][0]);
		s.push(v2.o[0] / v2.d[0][0]);
	}
	return s;
}

// tests the generic solver against a random data set
// given variable array s, should recalculate s
function testGenericSolver(s) {
	console.log("generating data");
	let data = generateRandomData(s);
	console.log("solving");
	return genericSolver(data);
}

// tests the generic solver against a random minimum data set
// given variable array s, should recalculate s
function testGenericSolverMinimumData(s) {
	console.log("generating data");
	let data = generateRandomMinimumData(s);
	//let data = generateMinimumData(s);
	console.log("expanding data");
	data = expandData(data);
	console.log("solving");
	return genericSolver(data);
}
