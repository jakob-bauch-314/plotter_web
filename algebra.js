
// helper functions =======================================================================

const createArray = (func, ...dimensions) => {
    if (dimensions.length === 0) return func();
    const [first, ...rest] = dimensions;
    return Array.from(
        { length: first },
        (_, i) => createArray((...indices) => func(i, ...indices), ...rest)
    );
};

class DimensionMissmatch extends Error {
    constructor(message){
        super(message)
        this.name = "DimensionMissmatch"
    }
}

class FieldMissmatch extends Error {
    constructor(message){
        super(message)
        this.name = "FieldMissmatch"
    }
}

class ScalarMissmatch extends Error {
    constructor(message){
        super(message)
        this.name = "ScalarMissmatch"
    }
}

// Basic algebraic Datatypes =======================================================================

class Vector {
    /**
     * Creates a Vector
     * @param {Field} field - underlying Field
     */
    constructor(field){
        if (!(field instanceof Field)) {throw new TypeError("Field must be an instance of Field");}
        this.field = field;
    }

    add(other){
        if (!(other instanceof this.constructor)) {throw new TypeError("Operand must be a Vector");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for addition");}
    }

    subtract(other){
        if (!(other instanceof this.constructor)) {throw new TypeError("Operand must be a Vector");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for addition");}
    }

    scale(scalar){
        if (!this.field.contains(scalar)) {throw new Error("cant scale by factor that isn't part of underlying field");}
    }
}

class Complex {
    /**
     * Creates a Complex Number a + bi
     * @param {Number} real - real part
     * @param {Number} imag - imaginary part
     */
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    add(other) {
        return new Complex(
            this.real + other.real,
            this.imag + other.imag
        );
    }

    multiply(other) {
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    negate() {
        return new Complex(-this.real, -this.imag);
    }

    inverse() {
        const denominator = this.real * this.real + this.imag * this.imag;
        return new Complex(
            this.real / denominator,
            -this.imag / denominator
        );
    }

    equals(other) {
        return this.real === other.real && this.imag === other.imag;
    }
}

class Tuple extends Vector{

    // constructors

    /**
     * Creates a n-Tuple
     * @param {Field} field - underlying Field
     * @param {...} elements - elements
     */
    constructor(field, ...elements) {
        super(field);
        this.elements = elements;
    }

    static ZERO(field, size) {
        return new Tuple(field, ...Array(size).fill(field.addIdentity));
    }

    // helper functions

    getEntry(i) {
        if (i < 0 || i >= this.elements.length) {
            throw new Error(`Index ${i} out of bounds for tuple`);
        }
        return this.elements[i];
    }

    get dimensions() { return this.elements.length }

    // vector-specific functions

    add(other) {
        if (!(other instanceof Tuple)) {throw new TypeError("Operand must be a Tuple");}
        if (this.dimensions !== other.dimensions) {throw new Error("Tuple dimensions must match for addition");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for addition")}

        return new Tuple(this.field, ...this.elements.map((e, i) => this.field.add(e, other.elements[i])));
    }

    subtract(other) {
        if (!(other instanceof Tuple)) {throw new TypeError("Operand must be a Tuple");}
        if (this.dimensions !== other.dimensions) {throw new Error("Tuple dimensions must match for subtraction");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for subtraction")}

        const field = this.field;
        const dimensions = this.dimensions;

        return new Tuple(field, ...this.elements.map((e, i) => field.subtract(e, other.elements[i])));
    }

    scale(scalar) {
        if (!this.field.contains(scalar)) {throw new Error("cant scale by factor that isn't part of underlying field")}

        const field = this.field;

        return new Tuple(field, ...this.elements.map(e => field.multiply(scalar, e)));
    }

    // tuple-specific functions

    outerProduct(other) {
        if (!(other instanceof Tuple)) {throw new TypeError("Operand must be a Tuple");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for outer Product")}

        const field = this.field;
        const width = other.dimensions;
        const height = this.dimensions;

        return new Matrix(width, height, field, (i, j) => field.multiply(this.getEntry(i), other.getEntry(j)));
    }

    innerProduct(other) {

        if (!(other instanceof Tuple)) {throw new TypeError("Operand must be a Tuple");}
        if (this.dimensions !== other.dimensions) {throw new Error("Tuple dimensions must match for inner Product");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for inner Product")}

        const dimensions = this.dimensions;
        const field = this.field;

        return this.elements.reduce((sum, e, i) => field.add(sum, field.multiply(e, other.getEntry(i))), field.addIdentity);
    }
}

class Matrix extends Vector{

    // constructors

    /**
     * Creates a Tuple
     * @param {Number} width - Matrix width
     * @param {Number} height - Matrix height
     * @param {Field} field - underlying Field
     * @param {Function} f - maps (i, j) to Entry
     */
    constructor(width, height, field, f) {
        super(field);
        this.width = width;
        this.height = height;
        this.arr = createArray((i, j) => f(i, j), height, width);
    }

    static swapRow(size, field, j1, j2) {
        return new Matrix(
            size, size, field, (i, j) => {
                if (i === j1 && j === j1) return 0;
                if (i === j2 && j === j2) return 0;
                if (i === j1 && j === j2) return 1;
                if (i === j2 && j === j1) return 1;
                return i === j ? 1 : 0;
        });
    }

    static ZERO(width, height, field) {
        return new Matrix(width, height, field, () => field.addIdentity);
    }

    static IDENTITY(size, field) {
        return new Matrix(size, size, field, (i, j) => 
            i === j ? field.multiplyIdentity : field.addIdentity
        );
    }

    // helper functions

    getEntry(i, j) {
        if (i < 0 || i >= this.height || j < 0 || j >= this.width) {
            throw new Error(`Index (${i},${j}) out of bounds`);
        }
        return this.arr[i][j];
    }

    partition() {
        const a = this.getEntry(0, 0);
        const v = new Tuple(
            this.field,
            ...Array.from({length: this.height - 1}, (_, i) => this.getEntry(i + 1, 0))
        );
        const w = new Tuple(
            this.field,
            ...Array.from({length: this.width - 1}, (_, i) => this.getEntry(0, i + 1))
        );
        const A = new Matrix(
            this.width - 1,
            this.height - 1,
            this.field,
            (i, j) => this.getEntry(i + 1, j + 1)
        );
        return [a, v, w, A];
    }
    
    static assemble(a, v, w, A) {
        const height = A.height + 1;
        const width = A.width + 1;
        return new Matrix(
            width,
            height,
            A.field,
            (i, j) => {
                if (i === 0 && j === 0) return a;
                if (i === 0 && j > 0) return w.getEntry(j - 1);
                if (j === 0 && i > 0) return v.getEntry(i - 1);
                return A.getEntry(i - 1, j - 1);
            }
        );
    }

    LUP() {
        if (this.width !== this.height) {throw new Error("Matrix must be square for LU decomposition");}
        const size = this.width;
        const field = this.field;
        const zero = field.addIdentity;
        const one = field.multiplyIdentity;
        
        // Base case: 1x1 matrix
        if (size === 1) { return [
                Matrix.IDENTITY(1, field),
                new Matrix(1, 1, field, () => this.getEntry(0, 0)),
                Matrix.IDENTITY(1, field),
                0
        ]}

        // find first non-zero row
        var j=0; for (; j < this.height; j++){if (this.getEntry(0, j) === zero) continue; break;}

        const [swaps0, P0] = (j == 0)?
            [0, Matrix.IDENTITY(size, field)] :
            [1, Matrix.swapRow(size, field, 0, j)];

        const [a, v, w, A] = (P0.multiply(this)).partition();

        // Compute Schur complement: S = A - (v * w^T)/a
        const scaleFactor = field.multiplyInvert(a);
        const schur = A.subtract(v.outerProduct(w).scale(scaleFactor));
        const zero_tuple = Tuple.ZERO(field, size - 1);
        
        // Recursive decomposition
        const [L1, U1, P1, swaps1] = schur.LUP();
        
        // Construct L, U and P
        const L = Matrix.assemble(field.multiplyIdentity, v.scale(scaleFactor), zero_tuple, L1);
        const U = Matrix.assemble(a, zero_tuple, w, U1);
        const P = Matrix.assemble(one, zero_tuple, zero_tuple, P1).multiply(P0);
        const swaps = swaps0 + swaps1
        
        return [L, U, P, swaps];
    }

    inverseLowerTriangular() {
        if (this.width !== this.height) {throw new Error("Matrix must be square for inversion");}

        const size = this.width;
        const zero = this.field.addIdentity;
        const field = this.field;
        const [a, v, w, A] = this.partition();
        
        // Base case: 1x1 matrix
        if (size === 1) {
            if (a === zero) throw new Error("Singular matrix");
            return new Matrix(1, 1, this.field, () => field.multiplyInvert(a));
        }

        if (a === zero) throw new Error("Singular matrix");
        const A_inv = A.inverseLowerTriangular();
        const c = A_inv.multiplyTuple(v).scale(field.multiplyInvert(-a));
        return Matrix.assemble(field.multiplyInvert(a), c, Tuple.ZERO(field, size-1), A_inv);
    }

    inverseUpperTriangular() {
        return ((this.transpose()).inverseLowerTriangular()).transpose();
    }

    // vector-specific functions

    add(other) {
        if (!(other instanceof Matrix)) {throw new TypeError("Operand must be a Matrix");}
        if (this.width !== other.width || this.height !== other.height) {throw new Error("Matrix dimensions must match for addition");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for addition")}

        const field = this.field;
        const width = this.width;
        const height = this.height;

        return new Matrix(width, height, field, (i, j) => field.add(this.getEntry(i, j), other.getEntry(i, j)));
    }

    subtract(other) {
        if (!(other instanceof Matrix)) {throw new TypeError("Operand must be a Matrix");}
        if (this.width !== other.width || this.height !== other.height) {throw new Error("Matrix dimensions must match for subtraction");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for subtraction")}

        const field = this.field;
        const width = this.width;
        const height = this.height;

        return new Matrix(width, height, field, (i, j) => this.field.subtract(this.getEntry(i, j), other.getEntry(i, j)));
    }

    scale(scalar) {
        if (!this.field.contains(scalar)) {throw new Error("cant scale by factor that isn't part of underlying field")}

        return new Matrix(
            this.width,
            this.height,
            this.field,
            (i, j) => this.field.multiply(scalar, this.getEntry(i, j))
        );
    }

    // Matrix-specific functions

    multiplyTuple(tuple) {
        if (!(tuple instanceof Tuple)) {throw new TypeError("Operand must be a tuple");}
        if (this.width !== tuple.dimensions) {throw new Error("Matrix dimensions must match for multiplication");}
        if (this.field !== tuple.field) {throw new Error("underlying fields must match for multiplication")}

        const field = this.field;
        return new Tuple(
            field,
            ...Array.from({length: this.height}, (_, i) => {
                let sum = field.addIdentity;
                for (let j = 0; j < this.width; j++) {
                    const product = field.multiply(
                        this.getEntry(i, j),
                        tuple.getEntry(j)
                    );
                    sum = field.add(sum, product);
                }
                return sum;
            })
        );
    }

    multiply(other) {
        if (!(other instanceof Matrix)) {throw new TypeError("Operand must be a tuple");}
        if (this.width !== other.height || this.height !== other.height) {throw new Error("Matrix dimensions must match for multiplication");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for multiplication")}

        const field = this.field;
        return new Matrix(
            other.width,
            this.height,
            field,
            (i, j) => {
                let sum = field.addIdentity;
                for (let k = 0; k < this.width; k++) {
                    const product = field.multiply(
                        this.getEntry(i, k),
                        other.getEntry(k, j)
                    );
                    sum = field.add(sum, product);
                }
                return sum;
            }
        );
    }

    transpose() {
        return new Matrix(
            this.height,
            this.width,
            this.field,
            (i, j) => this.getEntry(j, i)
        );
    }

    get determinant() {
        if (this.width !== this.height) {
            throw new Error("Matrix must be square for LU decomposition");
        }
        const n = this.width;
        const [L, U, P, swaps] = this.LUP();
        const diagonal = Array.from({length: n}, (_, i) => U.getEntry(i, i));
        const result = diagonal.reduce((prod, e) => this.field.multiply(prod, e), this.field.multiplyIdentity);
        return ((swaps % 2) == 0)? result : this.field.addInvert(result);
    }

    inverse() {
        const [L, U, P] = this.LUP();
        const L_inv = L.inverseLowerTriangular();
        const U_inv = U.inverseUpperTriangular();
        return U_inv.multiply(L_inv).multiply(P);
    }

    toString() {
        // Calculate max width for each column
        const colWidths = Array(this.width).fill(0);
        for (let j = 0; j < this.width; j++) {
            for (let i = 0; i < this.height; i++) {
                const val = this.getEntry(i, j).toString();
                if (val.length > colWidths[j]) {
                    colWidths[j] = val.length;
                }
            }
        }
        
        // Build row strings
        const rows = [];
        for (let i = 0; i < this.height; i++) {
            const row = [];
            for (let j = 0; j < this.width; j++) {
                const val = this.getEntry(i, j).toString();
                row.push(val.padStart(colWidths[j], ' '));
            }
            rows.push(`[ ${row.join(' | ')} ]`);
        }
        
        return `Matrix ${this.width}x${this.height}:\n${rows.join('\n')}`;
    }

    equals(other) {
        if (!(other instanceof Matrix)) return false;
        if (this.width !== other.width || this.height !== other.height) return false;
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.getEntry(i, j) !== other.getEntry(i, j)) return false;
            }
        }
        return true;
    }
}

// Basic algebraic Structures =======================================================================

class Set {
    /**
     * Creates a Set
     * @param {function} contains - Membership function
     */
    constructor(contains) {
        this.contains = contains;
    }

    intersect(other) {
        return new Set(e => this.contains(e) && other.contains(e));
    }

    union(other) {
        return new Set(e => this.contains(e) || other.contains(e));
    }

    invert() {
        return new Set(e => !this.contains(e));
    }
}

class Group extends Set {
    /**
     * Creates a Group
     * @param {function} contains - Membership function
     * @param {function} add - Group operation (binary)
     * @param {*} addIdentity - Identity element
     * @param {function} addInvert - Inversion function
     */
    constructor(contains, add, addIdentity, addInvert) {
        super(contains);
        this.add = add;
        this.addInvert = addInvert;
        this.addIdentity = addIdentity;
    }

    subtract(a, b){
        return this.add(a, this.addInvert(b));
    }
}

class Ring extends Group {
    /**
     * Creates a Ring
     * @param {function} contains - Membership function
     * @param {function} add - Addition operation
     * @param {*} addIdentity - Additive identity
     * @param {function} addInvert - Additive inverse
     * @param {function} multiply - Multiplication operation
     * @param {*} multiplyIdentity - Multiplicative identity
     */
    constructor(contains, add, addIdentity, addInvert, multiply, multiplyIdentity) {
        super(contains, add, addIdentity, addInvert);
        this.multiply = multiply;
        this.multiplyIdentity = multiplyIdentity;
    }
}

class Field extends Ring {
    /**
     * Creates a Field
     * @param {function} contains - Membership function
     * @param {function} add - Addition operation
     * @param {*} addIdentity - Additive identity (0)
     * @param {function} addInvert - Additive inverse
     * @param {function} multiply - Multiplication operation
     * @param {*} multiplyIdentity - Multiplicative identity (1)
     * @param {function} multiplyInvert - Multiplicative inverse (for non-zero)
     */
    constructor(contains, add, addIdentity, addInvert, multiply, multiplyIdentity, multiplyInvert) {
        super(contains, add, addIdentity, addInvert, multiply, multiplyIdentity);
        this.multiplyInvert = multiplyInvert;
    }

    divide(a, b){
        return this.multiply(a, this.multiplyInvert(b));
    }
}

// Linear algebra =======================================================================

class VectorSpace extends Group{
    /**
     * Creates a Vector Space
     * @param {Set} vectors - Set of vectors
     * @param {Field} scalars - Field of scalars
     * @param {function} add - Vector addition
     * @param {function} scale - Scalar multiplication
     */
    constructor(vector_set, scalar_field, add, addIdentity, addInvert, scale) {
        super(vector_set, add, addIdentity, addInvert);
        this.scalar_field = scalar_field,
        this.add = add;
        this.scale = scale;
    }
}

class MatrixRing extends Ring {
    constructor(size, field) {
        const contains = (e) => 
            e instanceof Matrix && 
            e.width === size && 
            e.height === size && 
            e.field === field;

        const add = (a, b) => a.add(b);
        const addIdentity = Matrix.ZERO(size, size, field);
        const addInvert = (a) => a.scale(field.addInvert(field.multiplyIdentity));

        const multiply = (a, b) => a.multiply(b);
        const multiplyIdentity = Matrix.IDENTITY(size, field);

        super(contains, add, addIdentity, addInvert, multiply, multiplyIdentity);
    }
}

class GeneralLinearGroup extends Group {
    constructor(size, field) {
        const contains = (e) => 
            e instanceof Matrix && 
            e.width === size && 
            e.height === size && 
            e.field === field &&
            e.determinant() !== field.addIdentity; // Non-zero determinant

        const multiply = (a, b) => a.multiply(b);
        const identity = Matrix.IDENTITY(size, field);
        const invert = (a) => a.inverse();

        super(contains, multiply, identity, invert);
    }
}

// Structure implementations =======================================================================

const reals = new Field(
    e => typeof e === 'number' && isFinite(e),
    (a, b) => a + b,
    0,
    e => -e,
    (a, b) => a * b,
    1,
    e => 1/e
);

const complex = new Field(
    e => e instanceof Complex,
    (a, b) => a.add(b),
    new Complex(0, 0),
    e => e.negate(),
    (a, b) => a.multiply(b),
    new Complex(1, 0),
    e => e.inverse()
);

// Example usage =======================================================================

const A = new Matrix(10, 10, reals, (i, j) => Math.random() * 10 + 1);
const A_inv = A.inverse();

console.log(A.toString());
console.log(A_inv);
console.log(A.multiply(A_inv).determinant);