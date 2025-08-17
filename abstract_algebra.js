const createArray = (func, ...dimensions) => {
    if (dimensions.length === 0) return func();
    const [first, ...rest] = dimensions;
    return Array.from(
        { length: first },
        (_, i) => createArray((...indices) => func(i, ...indices), ...rest)
    );
};

/**
 * Represents a mathematical set defined by a characteristic function.
 * @param {function} contains - Function that returns true if element is in set
 */
class Set {
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

// Basic algebraic structures
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
}

// Linear algebra
class VectorSpace {
    /**
     * Creates a Vector Space
     * @param {Set} vectors - Set of vectors
     * @param {Field} scalars - Field of scalars
     * @param {function} add - Vector addition
     * @param {function} scale - Scalar multiplication
     */
    constructor(vectors, scalars, add, scale) {
        this.vectors = vectors;
        this.scalars = scalars;
        this.add = add;
        this.scale = scale;
    }
}

class Tuple {
    /**
     * Creates a Tuple (vector) over a field
     * @param {Field} field - Underlying field
     * @param  {...*} elements - Tuple components
     */
    constructor(field, ...elements) {
        this.elements = elements;
        this.field = field;
    }

    getEntry(i) {
        if (i < 0 || i >= this.elements.length) {
            throw new Error(`Index ${i} out of bounds for tuple`);
        }
        return this.elements[i];
    }

    get dimensions() { return this.elements.length }

    add(other) {
        if (!(other instanceof Tuple)) {
            throw new TypeError("Operand must be a Tuple");
        }
        if (this.dimensions !== other.dimensions) {
            throw new Error("Tuple dimensions must match for addition");
        }
        return new Tuple(
            this.field, 
            ...this.elements.map((e, i) => this.field.add(e, other.elements[i]))
        );
    }

    subtract(other) {
        if (!(other instanceof Tuple)) {
            throw new TypeError("Operand must be a Tuple");
        }
        if (this.dimensions !== other.dimensions) {
            throw new Error("Tuple dimensions must match for subtraction");
        }
        return new Tuple(
            this.field,
            ...this.elements.map((e, i) => this.field.add(e, this.field.addInvert(other.elements[i])))
        );
    }

    scale(scalar) {
        return new Tuple(this.field, ...this.elements.map(e => this.field.multiply(scalar, e)));
    }

    outerProduct(other) {
        return new Matrix(
            other.dimensions,
            this.dimensions,
            this.field,
            (i, j) => this.field.multiply(this.getEntry(i), other.getEntry(j))
        );
    }

    innerProduct(other) {
        if (this.dimensions !== other.dimensions) {
            throw new Error("Tuple dimensions must match for inner product");
        }
        return this.elements.reduce(
            (sum, e, i) => this.field.add(sum, this.field.multiply(e, other.getEntry(i))),
            this.field.addIdentity
        );
    }

    static ZERO(field, size) {
        return new Tuple(field, ...Array(size).fill(field.addIdentity));
    }
}

class Matrix {
    /**
     * Creates a Matrix
     * @param {number} width - Number of columns
     * @param {number} height - Number of rows
     * @param {Field} field - Underlying field
     * @param {function} f - Function (i, j) => element at row i, column j
     */
    constructor(width, height, field, f) {
        if (!(field instanceof Field)) {
            throw new TypeError("Field must be an instance of Field");
        }
        this.width = width;
        this.height = height;
        this.field = field;
        this.arr = createArray((i, j) => f(i, j), height, width);
    }

    getEntry(i, j) {
        if (i < 0 || i >= this.height || j < 0 || j >= this.width) {
            throw new Error(`Index (${i},${j}) out of bounds`);
        }
        return this.arr[i][j];
    }

    add(other) {
        if (!(other instanceof Matrix)) {
            throw new TypeError("Operand must be a Matrix");
        }
        if (this.width !== other.width || this.height !== other.height) {
            throw new Error("Matrix dimensions must match for addition");
        }
        return new Matrix(
            this.width, 
            this.height, 
            this.field, 
            (i, j) => this.field.add(
                this.getEntry(i, j), 
                other.getEntry(i, j)
            )
        );
    }

    subtract(other) {
        if (!(other instanceof Matrix)) {
            throw new TypeError("Operand must be a Matrix");
        }
        if (this.width !== other.width || this.height !== other.height) {
            throw new Error("Matrix dimensions must match for subtraction");
        }
        return new Matrix(
            this.width,
            this.height,
            this.field,
            (i, j) => this.field.add(
                this.getEntry(i, j),
                this.field.addInvert(other.getEntry(i, j))
            )
        );
    }

    multiply(other) {
        if (!(other instanceof Matrix)) {
            throw new TypeError("Operand must be a Matrix");
        }
        if (this.width !== other.height) {
            throw new Error("Inner dimensions must match for matrix multiplication");
        }
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

    scale(scalar) {
        return new Matrix(
            this.width,
            this.height,
            this.field,
            (i, j) => this.field.multiply(scalar, this.getEntry(i, j))
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

    /**
     * Partitions matrix into components:
     * [ a | w ]
     * [---|----]
     * [ v | A ]
     * @returns [a, v, w, A]
     */
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

    /**
     * Constructs matrix from partitioned components
     * @param {*} a - Top-left element
     * @param {Tuple} v - Left column vector (height-1)
     * @param {Tuple} w - Top row vector (width-1)
     * @param {Matrix} A - Submatrix (height-1 x width-1)
     * @returns {Matrix} Assembled matrix
     */
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

    /**
     * LU Decomposition (without pivoting)
     * @returns [L, U] lower and upper triangular matrices
     */
    decompose() {
        if (this.width !== this.height) {
            throw new Error("Matrix must be square for LU decomposition");
        }
        const n = this.width;
        
        // Base case: 1x1 matrix
        if (n === 1) {
            const L = Matrix.IDENTITY(1, this.field);
            const U = new Matrix(1, 1, this.field, () => this.getEntry(0, 0));
            return [L, U];
        }

        const [a, v, w, A] = this.partition();
        const zero = this.field.addIdentity;
        
        // Check for zero pivot
        if (a === zero) {
            throw new Error("Zero pivot encountered in LU decomposition");
        }

        // Compute Schur complement: S = A - (v * w^T)/a
        const scaleFactor = this.field.multiplyInvert(a);
        const schur = A.subtract(v.outerProduct(w).scale(scaleFactor));
        
        // Recursive decomposition
        const [L1, U1] = schur.decompose();
        
        // Construct L and U
        const L = Matrix.assemble(
            this.field.multiplyIdentity,  // 1
            v.scale(scaleFactor),         // v/a
            Tuple.ZERO(this.field, n - 1),
            L1
        );
        
        const U = Matrix.assemble(
            a,
            Tuple.ZERO(this.field, n - 1),
            w,
            U1
        );
        
        return [L, U];
    }

    static ZERO(width, height, field) {
        return new Matrix(width, height, field, () => field.addIdentity);
    }

    static IDENTITY(size, field) {
        return new Matrix(size, size, field, (i, j) => 
            i === j ? field.multiplyIdentity : field.addIdentity
        );
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

// Complex number implementation
class Complex {
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

// Field implementations
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

// Example usage
const A = new Matrix(3, 3, reals, (i, j) => [[1, 2, 3], [4, 5, 6], [7, 8, 9]][i][j]);
try {
    const [L, U] = A.decompose();
    console.log(L);
    console.log(U);
} catch (error) {
    console.error("Decomposition error:", error.message);
}