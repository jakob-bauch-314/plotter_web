// helper functions

function createArray(func, ...dimensions){
    if (dimensions.length == 0) return func();
    const [first, ...rest] = dimensions;
    return Array.from(
        {length: first},
        (v, i) => createArray((...indices) => func(i, ...indices), ...rest)
    )
}

function equals(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && 
               a.every((elem, i) => equals(elem, b[i]));
    }
    return a === b;
}

function getDimensions(array) {
    if (!Array.isArray(array)) return [];
    
    const dims = [array.length];
    if (array.length === 0) return dims;
    
    const firstChildDims = getDimensions(array[0]);
    
    for (let i = 1; i < array.length; i++) {
        const childDims = getDimensions(array[i]);
        if (!equals(firstChildDims, childDims)) {
            throw new Error('Jagged array detected');
        }
    }
    return [...dims, ...firstChildDims];
}

// vectors

class Vector {
    constructor() {}
    scale(scalar) { 
        throw new Error("Abstract method: scale must be implemented"); 
    }
    add(other) { 
        throw new Error("Abstract method: add must be implemented"); 
    }

    static sum(...vectors) {
        if (vectors.length === 0) {
            throw new Error("At least one vector required for summation");
        }
        const zero = vectors[0].scale(0);
        return vectors.reduce((acc, v) => acc.add(v), zero);
    }

    toString() {
        return "Vector";
    }
}

class Tuple extends Vector {
    constructor(...elements) {
        super();
        this.elements = elements;
    }

    scale(scalar) {
        return new Tuple(...this.elements.map(element => scalar * element));
    }

    add(other) {
        if (this.elements.length !== other.elements.length) {
            throw new Error("Tuple dimensions must match for addition");
        }
        return new Tuple(...this.elements.map((element, i) => element + other.elements[i]));
    }

    dot(other) {
        if (this.elements.length !== other.elements.length) {
            throw new Error("Tuple dimensions must match for dot product");
        }
        return this.elements.reduce((sum, element, i) => 
            sum + element * other.elements[i], 0
        );
    }

    abs(){
        return this.dot(this);
    }

    get dimensions() { 
        return this.elements.length; 
    }

    toString() {
        return `(${this.elements.join(', ')})`;
    }
}

class Tuple2 extends Tuple {
    constructor(x, y) {super(x, y)}
    get x() {return this.elements[0]}
    get y() {return this.elements[1]}
}

class ComplexNumber extends Tuple2 {
    constructor(a, b=0 ){super(a, b)}
    get a() {return this.x}
    get b() {return this.y}

    multiply(other){
        return new ComplexNumber(this.a * other.a - this.b * other.b, this.a * other.b + this.b * other.a);
    }

    power(exponent){

    }
}

class Polynomial extends Tuple {
    constructor(...elements) {
        super(...elements);
    }

    roots() {
        throw new Error("Abstract method: roots must be implemented"); 
    }

    multiply(other) {
        const deg1 = this.elements.length - 1;
        const deg2 = other.elements.length - 1;
        const result = Array(deg1 + deg2 + 1).fill(0);
        
        for (let i = 0; i <= deg1; i++) {
            for (let j = 0; j <= deg2; j++) {
                result[i + j] += this.elements[i] * other.elements[j];
            }
        }
        return new Polynomial(...result);
    }

    evaluate(x) {
        return this.elements.reduce(
            (sum, coeff, i) => sum + coeff * Math.pow(x, i), 
            0
        );
    }

    toString() {
        if (this.elements.length === 0) return "0";
        
        const terms = [];
        for (let i = 0; i < this.elements.length; i++) {
            const coeff = this.elements[i];
            if (coeff === 0) continue;
            
            let term = coeff.toString();
            if (i === 1) {
                term += "x";
            } else if (i > 1) {
                term += `x^${i}`;
            }
            terms.push(term);
        }
        
        if (terms.length === 0) return "0";
        return terms.reverse().join(" + ").replace(/\s\+\s-/g, " - ");
    }
}

class LinearPolynomial extends Polynomial {
    constructor(a, b){super(a, b)}

    get a() {return this.elements[1]}
    get b() {return this.elements[0]}

    roots() {
        return (this.a == 0)? []: [-this.b/this.a];
    }
}

class QuadraticPolynomial extends Polynomial {
    constructor(a, b, c){super(a, b, c)}

    get a() {return this.elements[2]}
    get b() {return this.elements[1]}
    get c() {return this.elements[0]}

    roots(){
        const discriminant = this.b * this.b - 4 * this.a * this.c;
        const sqrt_discriminant = math.sqrt(discriminant);
        return [(-this.b - sqrt_discriminant)/(2*this.a), (-this.b + sqrt_discriminant)/(2*this.a)]
    }
}

class CubicPolynomial extends Polynomial {
    constructor(a, b, c, d){super(a, b, c, d)}

    get a() {return this.elements[3]}
    get b() {return this.elements[2]}
    get c() {return this.elements[1]}
    get d() {return this.elements[0]}
}

// Matrices

const Matrix = () => {

    const secretToken = Symbol("secret_token")

    class Matrix extends Vector {

        // constructors

        constructor(token, width, height, func) {
            super();
            if (token !== secretToken) {
                throw new Error("Private constructor: Use child classes");
            }
            this.width = width;
            this.height = height;
            this.arr = createArray(func, width, height);
        }

        static create(width, height, func) {
            return new Matrix(width, height, func)
        }

        static fromArray(constructor, arr) {
            const dimensions = getDimensions(arr);
            if (dimensions.length !== 2) {throw new Error(`${dimensions.length}D arrays not supported`);}
            [width, height] = dimensions;
            return new constructor(width, height, (i, j) => arr[i][j])
        }

        static fromElements(constructor, width, ...vals) {
            const height = math.floor(vals.length / width);
            if (width * height != vals.length) throw new Error(`${vals.length} values dont fit into ${width}x${height} Matrix`);
            return new constructor(width, height, (i, j) => vals[i + j * width]);
        }

        // getters and setters

        get a11() {return this.arr[1][1]}; get a41() {return this.arr[4][1]}; get a71() {return this.arr[7][1]}
        get a12() {return this.arr[1][2]}; get a42() {return this.arr[4][2]}; get a72() {return this.arr[7][2]}
        get a13() {return this.arr[1][3]}; get a43() {return this.arr[4][3]}; get a73() {return this.arr[7][3]}
        get a14() {return this.arr[1][4]}; get a44() {return this.arr[4][4]}; get a74() {return this.arr[7][4]}
        get a15() {return this.arr[1][5]}; get a45() {return this.arr[4][5]}; get a75() {return this.arr[7][5]}
        get a16() {return this.arr[1][6]}; get a46() {return this.arr[4][6]}; get a76() {return this.arr[7][6]}
        get a17() {return this.arr[1][7]}; get a47() {return this.arr[4][7]}; get a77() {return this.arr[7][7]}
        get a18() {return this.arr[1][8]}; get a48() {return this.arr[4][8]}; get a78() {return this.arr[7][8]}
        get a19() {return this.arr[1][9]}; get a49() {return this.arr[4][9]}; get a79() {return this.arr[7][9]}

        get a21() {return this.arr[2][1]}; get a51() {return this.arr[5][1]}; get a81() {return this.arr[8][1]}
        get a22() {return this.arr[2][2]}; get a52() {return this.arr[5][2]}; get a82() {return this.arr[8][2]}
        get a23() {return this.arr[2][3]}; get a53() {return this.arr[5][3]}; get a83() {return this.arr[8][3]}
        get a24() {return this.arr[2][4]}; get a54() {return this.arr[5][4]}; get a84() {return this.arr[8][4]}
        get a25() {return this.arr[2][5]}; get a55() {return this.arr[5][5]}; get a85() {return this.arr[8][5]}
        get a26() {return this.arr[2][6]}; get a56() {return this.arr[5][6]}; get a86() {return this.arr[8][6]}
        get a27() {return this.arr[2][7]}; get a57() {return this.arr[5][7]}; get a87() {return this.arr[8][7]}
        get a28() {return this.arr[2][8]}; get a58() {return this.arr[5][8]}; get a88() {return this.arr[8][8]}
        get a29() {return this.arr[2][9]}; get a59() {return this.arr[5][9]}; get a89() {return this.arr[8][9]}

        get a31() {return this.arr[3][1]}; get a61() {return this.arr[6][1]}; get a91() {return this.arr[9][1]}
        get a32() {return this.arr[3][2]}; get a62() {return this.arr[6][2]}; get a92() {return this.arr[9][2]}
        get a33() {return this.arr[3][3]}; get a63() {return this.arr[6][3]}; get a93() {return this.arr[9][3]}
        get a34() {return this.arr[3][4]}; get a64() {return this.arr[6][4]}; get a94() {return this.arr[9][4]}
        get a35() {return this.arr[3][5]}; get a65() {return this.arr[6][5]}; get a95() {return this.arr[9][5]}
        get a36() {return this.arr[3][6]}; get a66() {return this.arr[6][6]}; get a96() {return this.arr[9][6]}
        get a37() {return this.arr[3][7]}; get a67() {return this.arr[6][7]}; get a97() {return this.arr[9][7]}
        get a38() {return this.arr[3][8]}; get a68() {return this.arr[6][8]}; get a98() {return this.arr[9][8]}
        get a39() {return this.arr[3][9]}; get a69() {return this.arr[6][9]}; get a99() {return this.arr[9][9]}

        // inherited functions

        scale(scalar) {
            return new this.constructor(this.width, this.height, (i, j) => scalar * this.arr[i][j]);
        }

        add(other) {
            if (this.width !== other.width || this.height !== other.height) {throw new Error("Matrix dimensions must match for addition");}
            return new this.constructor(this.width, this.height, (i, j) => this.arr[i][j] + other.arr[i][j]);
        }

        // matrix specific functions

        column(n) {
            if (n < 0 || n >= this.width) {
                throw new Error("Column index out of bounds");
            }
            return new Tuple(...this.arr[n]);
        }

        columns() {
            return Array.from(
                { length: this.width }, 
                (_, i) => this.column(i)
            );
        }

        row(n) {
            if (n < 0 || n >= this.height) {
                throw new Error("Row index out of bounds");
            }
            return new Tuple(...this.arr.map(column => column[n]));
        }

        rows() {
            return Array.from(
                { length: this.height }, 
                (_, i) => this.row(i)
            );
        }

        multiplyTuple(tuple) {
            if (this.width !== tuple.dimensions) {
                throw new Error(`Incompatible dimensions: ${this.width}x${this.height} vs ${tuple.dimensions}`);
            }
            return new Tuple(
                ...this.rows().map(row => 
                    row.dot(tuple)
                )
            );
        }

        multiplyMatrix(other) {
            if (this.width !== other.height) {throw new Error(`Incompatible dimensions: ${this.width} vs ${other.height}`);}
            return new this.constructor(this.height, other.width, (i, j) => this.row(i).dot(other.column(j)))
        }

        toString() {
            // Get the maximum width for each column for alignment
            const colWidths = Array(this.height).fill(0);
            
            for (let i = 0; i < this.height; i++) {
                for (let j = 0; j < this.width; j++) {
                    const val = this.arr[j][i].toString();
                    if (val.length > colWidths[i]) {
                        colWidths[i] = val.length;
                    }
                }
            }
            
            const rows = [];
            for (let i = 0; i < this.height; i++) {
                const row = [];
                for (let j = 0; j < this.width; j++) {
                    const val = this.arr[j][i].toString();
                    row.push(val.padStart(colWidths[i], ' '));
                }
                rows.push(`[ ${row.join(' | ')} ]`);
            }
            
            return `Matrix ${this.width}x${this.height}:\n${rows.join('\n')}`;
        }
    }
}

class SquareMatrix extends Matrix {

    // constructors

    static create(width, func){
        return new Matrix(secretToken, width, width, func)
    }

    static fromArray(array) {
        const output = Matrix.fromArray(SquareMatrix, array);
        if (output.width != output.height) throw new Error("not a square Matrix");
        else return output;
    }

    static fromElements(...vals) {
        const width = math.floor(math.sqrt(vals.length));
        return Matrix.fromElements(SquareMatrix, width, ...vals);
    }

    determinant() {
        throw new Error("Abstract method: determinant must be implemented"); 
    }

    characteristicPolynomial() {
        throw new Error("Abstract method: characteristicPolynomial must be implemented"); 
    }

    eigenValues() {
        return this.characteristicPolynomial().roots().filter(root => root != 0);
    }

    inverse() {
        throw new Error("Abstract method: inverse must be implemented"); 
    }

    static unit(width){
        return new SquareMatrix(width, width, (i, j) => (i == j)? 1 : 0);
    }

    static basis(width, I, J){
        return new SquareMatrix(width, width, (i, j) => (i == I & j == J)? 1 : 0)
    }

    static frobius(width, j1, j2, scalar){
        return new SquareMatrix(width, width, (i, j) => (i == j)? 1 : (i == j1 & j == j2)? scalar : 0)
    }

    static swap(width, j1, j2){
        return new SquareMatrix(width, width, (i, j) => (((i == j1)? j : i) == ((j == j2)? i : j))? 1 : 0)
    }
}

class Triangular extends SquareMatrix{

}

class Frobius extends SquareMatrix{

}

class Permutation extends SquareMatrix{

}

/*

class Matrix1 extends SquareMatrixBase{

    // constructors

    static fromElements(a11){
        return SquareMatrixBase.fromElements(Matrix1, a11)
    }

    // derived methods

    determinant(){
        return this.a11
    }

    inverse(){
        return new Matrix1(1, 1, (i, j) => 1/this.a11)
    }

    characteristicPolynomial(){
        return new Polynomial1(1, -this.a11)
    }
}

class Matrix2_ extends SquareMatrixBase{

    // constructors

    static fromElements(a11, a12, a21, a22){
        return SquareMatrixBase.fromElements(Matrix2_, a11, a12, a21, a22)
    }

    // derived methods

    determinant() {
        return (this.a11 * this.a22) - (this.a12 * this.a21);
    }

    inverse() {
        return new Matrix2_(this.a11, -this.a21, -this.a12, this.a22).scale(1/this.determinant())
    }

    characteristicPolynomial() {
        return new Polynomial2(1, -(this.a11+this.a22), this.a11*this.a22 - this.a12*this.a21);
    }
}

class Matrix3 extends SquareMatrixBase{

    // contructors

    static fromElements(a11, a12, a13, a21, a22, a23, a31, a32, a33){
        return SquareMatrixBase.fromElements(Matrix2_, a11, a12, a13, a21, a22, a23, a31, a32, a33)
    }

    // derived methods
}

*/

// spaces

class VectorSpace {
    constructor(...base) {
        this.base = base;
    }

    from_coordinates(coordinates) {
        const vectors = coordinates.elements.map((coord, i) => 
            this.base[i].scale(coord)
        );
        return Vector.sum(...vectors);
    }

    get dimensions() {
        return this.base.length;
    }

    toString() {
        return `VectorSpace with basis:\n${
            this.base.map((vec, i) => `  b${i+1} = ${vec}`).join('\n')
        }`;
    }
}

// linear transformations

class LinearTransform {
    constructor(inputSet, outputSet, matrix) {
        if (this.inputSet.dimensions != matrix.width | this.outputSet.dimensions != matrix.height){
            throw new Error(``)
        }
        this.inputSet = inputSet;
        this.outputSet = outputSet;
        this.Matrix = Matrix;
    }
    
    apply(vector) {}
    kernel() {}
    range() {}
    rank() {}
    
    toString() {
        return `LinearTransform from ${this.inputSet} to ${this.outputSet}\n` +
               `Representation matrix:\n${this.Matrix}`;
    }
}

class Endomorphism extends LinearTransform {
    constructor(inputSet, outputSet=inputSet, Matrix) {
        super(inputSet, outputSet, Matrix);
    }
}

// Usage example

const A = SquareMatrix.swap(6, 2, 4);
console.log(A.toString());