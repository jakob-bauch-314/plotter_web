
// helper functions =======================================================================

function createArray(func, ...dimensions) {
    if (dimensions.length === 0) return func();
    const [first, ...rest] = dimensions;
    return Array.from(
        { length: first },
        (_, i) => createArray((...indices) => func(i, ...indices), ...rest)
    );
};

function getEntry(arr, firstIndex, ...otherIndices) {
    if (otherIndices.length == 0) return arr[firstIndex];
    return getEntry(arr[firstIndex], ...otherIndices)
}

function isNum(e) {
    return typeof(e) === "number";
}

/* compares two 1d arrays */
function equals(arr1, arr2){
    if (arr1.length != arr2.length) return false;
    return arr1.every((e, i) => e == arr2[i]);
}

/* compares all elements in 1d array */
function hom(first, ...rest){
    return rest.every(e => e == first)
}

function combine(A0, B0) {

    if (A0.length == 0) return []
    if (B0.length == 0) return []

    const [A, ...A1] = A0;
    const [B, ...B1] = B0;

    if (isNum(A)) return [A, ...combine(A1, B0)]
    const [minA, maxA] = A;
    if (isNum(B)) return [minA + B, ...combine(A1, B1)]
    const [minB, maxB] = B;
    return [[minA + minB, minA + maxB], ...combine(A1, B1)]
}

function splice(arr, ...A0) {

    if (A0.length == 0) return arr

    const [A, ...A1] = A0;

    if (isNum(A)) return splice(arr[A], ...A1);
    const [minA, maxA] = A;
    return Array.from({length: maxA-minA}, (_, i) => splice(arr[minA+i], ...A1))
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

    add(other){throw new Error("Abstract Method")}
    subtract(other){throw new Error("Abstract Method")}
    scale(scalar){throw new Error("Abstract Method")}
}


class Tensor extends Vector{

    // constructors

    constructor(reference, field, shape) {
        super(field);
        this.shape = shape
        this.reference = reference;
    }

    static create(func, field, ...dimensions) {
        const reference = createArray(func, ...dimensions)
        const shape = dimensions.map(d=> [0, d]);
        return new this(reference, field, shape);
    }

    static ZERO(field, ...dimensions) {
        return this.create(() => field.zero, field, ...dimensions);
    }

    static IDENTITY(field, dim, size) {
        return this.create((...indices) => hom(...indices)? field.one : field.zero,
        field,
        ...Array.from({length:dim}, () => size)
        );
    }

    // helper functions

    get(...indices) {return new this.constructor(this.reference, this.field, combine(this.shape, indices))}
    get content() {return splice(this.reference, ...this.shape);}
    getEntry(...indices) {return this.get(...indices).content;}
    get dimensions() {return this.shape.filter(e => !isNum(e)).map((([min, max]) => max-min))}

    map(func, ...args) {
        if (!args.every(arg => equals(arg.dimensions, this.dimensions))) throw new Error("Dimension Mismatch");
        if (!args.every(arg => arg.field == this.field))                 throw new Error("Field Mismatch");
        if (!args.every(arg => arg.constructor == this.constructor))     throw new Error("Constructor Mismatch");

        return this.constructor.create(
            (...indices) => func(this.getEntry(...indices), ...args.map(arg => arg.getEntry(...indices))),
            this.field, 
            ...this.dimensions)
    }

    // vector functions

    negative() {return this.map(a => this.field.multiplyInvert(a));}
    add(other) {return this.map((a,b) => this.field.add(a,b), other);}
    subtract(other) {return this.map((a,b) => this.field.subtract(a,b), other);}
    scale(scalar) {return this.map(e => this.field.multiply(scalar, e));}
}

class Tuple extends Tensor{

    // constructors

    constructor(reference, field, dimensions, start) {
        super(reference, field, dimensions, start)
    }

    // helper functions

    get length() { return this.dimensions[0] };
}

class Matrix extends Tensor{

    // constructors

    constructor(reference, field, dimensions, start) {
        super(reference, field, dimensions, start)
    }

    static swapRow(size, field, j1, j2) {
        return Matrix.create(
            (i, j) => {
                if (i === j1 && j === j1) return 0;
                if (i === j2 && j === j2) return 0;
                if (i === j1 && j === j2) return 1;
                if (i === j2 && j === j1) return 1;
                return i === j ? 1 : 0;
            }, field, size, size
        );
    }

    // helper functions

    get width() { return this.dimensions[1] }
    get height() { return this.dimensions[0] }

    partition() {
        return[
            this.get([0, 1], [0, 1]),
            this.get([1, this.height], [0, 1]),
            this.get([0, 1], [1, this.width]),
            this.get([1, this.height], [1, this.width]),
        ]
    }
    
    static assemble(a, v, w, A) {
        const height = A.height + 1;
        const width = A.width + 1;
        return Matrix.create(
            (i, j) => {
                if (i === 0 && j === 0) return a.getEntry(0, 0);
                if (i === 0 && j > 0) return w.getEntry(0, j - 1);
                if (j === 0 && i > 0) return v.getEntry(i - 1, 0);
                return A.getEntry(i - 1, j - 1);
            },
            A.field,
            height,
            width
        );
    }

    LUP() {
        if (this.width !== this.height) {throw new Error("Matrix must be square for LU decomposition");}
        const size = this.width;
        const field = this.field;
        const zero = field.zero;
        const one = field.one;
        
        // Base case: 1x1 matrix
        if (size === 1) { return [
                Matrix.IDENTITY(field, 2, 1),
                Matrix.create(() => this.getEntry(0, 0), field, 1, 1),
                Matrix.IDENTITY(field, 2, 1),
                0
        ]}

        // find first non-zero row
        var i=0; for (; i < this.height; i++){if (this.getEntry(i, 0) === field.zero) continue; break;}

        const [swaps0, P0] = (i == 0)?
            [0, Matrix.IDENTITY(field, 2, size)] :
            [1, Matrix.swapRow(size, field, 0, i)];

        const [a, v, w, A] = (P0.multiply(this)).partition();

        // Compute Schur complement: S = A - (v * w^T)/a
        const scaleFactor = field.multiplyInvert(a.getEntry(0, 0));
        const schur = A.subtract(v.multiply(w).scale(scaleFactor));
        const zero_row = Matrix.ZERO(field, 1, size - 1);
        const zero_col = Matrix.ZERO(field, size - 1, 1)
        
        // Recursive decomposition
        const [L1, U1, P1, swaps1] = schur.LUP();
        
        // Construct L, U and P
        const L = Matrix.assemble(Matrix.IDENTITY(field, 2, 1), v.scale(scaleFactor), zero_row, L1);
        const U = Matrix.assemble(a, zero_col, w, U1);
        const P = Matrix.assemble(Matrix.IDENTITY(field, 2, 1), zero_col, zero_row, P1).multiply(P0);

        const swaps = swaps0 + swaps1
        
        return [L, U, P, swaps];
    }

    inverseLowerTriangular() {
        if (this.width !== this.height) {throw new Error("Matrix must be square for inversion");}

        const size = this.width;
        const zero = this.field.zero;
        const field = this.field;
        const [a, v, w, A] = this.partition();
        const a_content = a.content;
        
        // Base case: 1x1 matrix
        if (size === 1) {
            if (a_content === zero) throw new Error("Singular matrix");
            return Matrix.create(() => field.multiplyInvert(a_content), field, 1, 1);
        }

        if (a === zero) throw new Error("Singular matrix");
        const A_inv = A.inverseLowerTriangular();

        const c = A_inv.multiply(v).scale(field.multiplyInvert(-a.getEntry(0, 0)));
        const zero_row = Matrix.ZERO(field, 1, size-1);

        return Matrix.assemble(Matrix.create(() => field.multiplyInvert(a.getEntry(0,0)),field,1,1), c, zero_row, A_inv);
    }

    inverseUpperTriangular() {
        return ((this.transpose()).inverseLowerTriangular()).transpose();
    }

    // Matrix-specific functions

    multiplyTuple(tuple) {

        if (!(tuple instanceof Tuple)) {throw new TypeError("Operand must be a Tuple");}
        if (this.width !== tuple.length) {throw new Error("Matrix dimensions must match for multiplication");}
        if (this.field !== tuple.field) {throw new Error("underlying fields must match for multiplication")}

        return Tuple.create(
            i => Array.from(
                {length: this.height},
                (_, j) =>
                    this.field.multiply(this.getEntry(i, j), tuple.getEntry(j))
            ).reduce((sum, e) => this.field.add(sum, e), this.field.zero),
            this.field,
            this.height
        )
    }

    multiply(other) {
        if (!(other instanceof Matrix)) {throw new TypeError("Operand must be a Matrix");}
        if (this.width !== other.height) {throw new Error("Matrix dimensions must match for multiplication");}
        if (this.field !== other.field) {throw new Error("underlying fields must match for multiplication")}

        const field = this.field;
        return Matrix.create(
            (i, j) => {
                let sum = field.zero;
                for (let k = 0; k < this.width; k++) {
                    const product = field.multiply(
                        this.getEntry(i, k),
                        other.getEntry(k, j)
                    );
                    sum = field.add(sum, product);
                }
                return sum;
            },
            field,
            this.height,
            other.width
        );
    }

    transpose() {
        return Matrix.create(
            (i, j) => this.getEntry(j, i),
            this.field,
            this.height,
            this.width
        );
    }

    get determinant() {
        if (this.width !== this.height) {throw new Error("Matrix must be square for determinant");}

        const n = this.width;

        const [L, U, P, swaps] = this.LUP();

        const diagonal = Array.from({length: n}, (_, i) => U.getEntry(i, i));
        const result = diagonal.reduce((prod, e) => this.field.multiply(prod, e), this.field.one);
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
     * @param {*} zero - Identity element
     * @param {function} addInvert - Inversion function
     */
    constructor(contains, add, zero, addInvert) {
        super(contains);
        this.add = add;
        this.addInvert = addInvert;
        this.zero = zero;
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
     * @param {*} zero - Additive identity
     * @param {function} addInvert - Additive inverse
     * @param {function} multiply - Multiplication operation
     * @param {*} one - Multiplicative identity
     */
    constructor(contains, add, zero, addInvert, multiply, one) {
        super(contains, add, zero, addInvert);
        this.multiply = multiply;
        this.one = one;
    }
}

class Field extends Ring {
    /**
     * Creates a Field
     * @param {function} contains - Membership function
     * @param {function} add - Addition operation
     * @param {*} zero - Additive identity (0)
     * @param {function} addInvert - Additive inverse
     * @param {function} multiply - Multiplication operation
     * @param {*} one - Multiplicative identity (1)
     * @param {function} multiplyInvert - Multiplicative inverse (for non-zero)
     */
    constructor(contains, add, zero, addInvert, multiply, one, multiplyInvert) {
        super(contains, add, zero, addInvert, multiply, one);
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
    constructor(vector_set, scalar_field, add, zero, addInvert, scale) {
        super(vector_set, add, zero, addInvert);
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
        const zero = Matrix.ZERO(field, size, size);
        const addInvert = (a) => a.scale(field.addInvert(field.one));

        const multiply = (a, b) => a.multiply(b);
        const one = Matrix.IDENTITY(field, 2, size);

        super(contains, add, zero, addInvert, multiply, one);
    }
}

class GeneralLinearGroup extends Group {
    constructor(size, field) {
        const contains = (e) => 
            e instanceof Matrix && 
            e.width === size && 
            e.height === size && 
            e.field === field &&
            e.determinant() !== field.zero; // Non-zero determinant

        const multiply = (a, b) => a.multiply(b);
        const identity = Matrix.IDENTITY(field, 2, size);
        const invert = (a) => a.inverse();

        super(contains, multiply, identity, invert);
    }
}

// Structure implementations =======================================================================

const integers = new Group(
    Number.isInteger,
    (a, b) => a + b,
    0,
    e => -e
)

const reals = new Field(
    e => typeof e === 'number' && isFinite(e),
    (a, b) => a + b,
    0,
    e => -e,
    (a, b) => a * b,
    1,
    e => 1/e
);

const plane = new VectorSpace(
    e => e instanceof Tuple && e.dimensions === 2,
    reals,
    (a, b) => a.add(b),
    Tuple.ZERO(reals, 2),
    e => e.scale(-1),
    (e, l) => e.scale(l)
)

// Example usage =======================================================================

const A = Matrix.create((i, j) => Math.random() * 10 + 1, reals, 5, 5);

const A_inv = A.inverse();
console.log(A.toString());
console.log(A_inv.toString());
console.log(A.multiply(A_inv).determinant);


/*
const A = createArray((i, j) => i + j, 5, 5);
const B = Index.apply(A, [Index.all(), Index.collapse(1)]);
console.log(B);
*/