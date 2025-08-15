const algebra = (() => {
    // Helper Functions (unchanged)
    const createArray = (func, ...dimensions) => {
        if (dimensions.length === 0) return func();
        const [first, ...rest] = dimensions;
        return Array.from(
            { length: first },
            (_, i) => createArray((...indices) => func(i, ...indices), ...rest)
        );
    };

    const equals = (a, b) => {
        if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length && 
                   a.every((elem, i) => equals(elem, b[i]));
        }
        return a === b;
    };

    const getDimensions = (array) => {
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
    };

    // Vector Classes (unchanged)
    class Vector {
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
            return new this.constructor(...this.elements.map(e => scalar * e));
        }

        add(other) {
            if (this.elements.length !== other.elements.length) {
                throw new Error("Tuple dimensions must match for addition");
            }
            return new this.constructor(
                ...this.elements.map((e, i) => e + other.elements[i])
            );
        }

        dot(other) {
            if (this.elements.length !== other.elements.length) {
                throw new Error("Tuple dimensions must match for dot product");
            }
            return this.elements.reduce(
                (sum, e, i) => sum + e * other.elements[i], 0
            );
        }

        abs() {
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
        constructor(x, y) { super(x, y); }
        get x() { return this.elements[0]; }
        get y() { return this.elements[1]; }
    }

    class ComplexNumber extends Tuple2 {
        constructor(a, b = 0) { super(a, b); }
        get a() { return this.x; }
        get b() { return this.y; }

        multiply(other) {
            return new ComplexNumber(
                this.a * other.a - this.b * other.b,
                this.a * other.b + this.b * other.a
            );
        }

        power(exponent) {
            // Implementation needed
        }
    }

    class Polynomial extends Tuple {
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
            return new this.constructor(...result);
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
                if (i === 1) term += "x";
                else if (i > 1) term += `x^${i}`;
                
                terms.push(term);
            }
            
            if (terms.length === 0) return "0";
            return terms.reverse().join(" + ").replace(/\s\+\s-/g, " - ");
        }
    }

    class LinearPolynomial extends Polynomial {
        get a() { return this.elements[1]; }
        get b() { return this.elements[0]; }

        roots() {
            return this.a === 0 ? [] : [-this.b / this.a];
        }
    }

    class QuadraticPolynomial extends Polynomial {
        get a() { return this.elements[2]; }
        get b() { return this.elements[1]; }
        get c() { return this.elements[0]; }

        roots() {
            const discriminant = this.b * this.b - 4 * this.a * this.c;
            const sqrt_discriminant = Math.sqrt(discriminant);
            return [
                (-this.b - sqrt_discriminant) / (2 * this.a),
                (-this.b + sqrt_discriminant) / (2 * this.a)
            ];
        }
    }

    class CubicPolynomial extends Polynomial {
        get a() { return this.elements[3]; }
        get b() { return this.elements[2]; }
        get c() { return this.elements[1]; }
        get d() { return this.elements[0]; }
    }

    // Matrix Implementation
    const secretToken = Symbol("MatrixSecretToken");

    class MatrixBase extends Vector {
        constructor(token, width, height, func) {
            super();
            if (token !== secretToken) {
                throw new Error("Matrix constructor is private");
            }
            this.width = width;
            this.height = height;
            this.arr = createArray(func, width, height);
        }

        // Matrix element accessors
        get a11() { return this.arr[0][0] } get a41() { return this.arr[3][0] } get a71() { return this.arr[6][0] }
        get a12() { return this.arr[1][0] } get a42() { return this.arr[4][0] } get a72() { return this.arr[7][0] }
        get a13() { return this.arr[2][0] } get a43() { return this.arr[5][0] } get a73() { return this.arr[8][0] }
        get a14() { return this.arr[3][0] } get a44() { return this.arr[6][0] } get a74() { return this.arr[9][0] }
        get a15() { return this.arr[4][0] } get a45() { return this.arr[7][0] } get a75() { return this.arr[10][0] }
        get a16() { return this.arr[5][0] } get a46() { return this.arr[8][0] } get a76() { return this.arr[11][0] }
        get a17() { return this.arr[6][0] } get a47() { return this.arr[9][0] } get a77() { return this.arr[12][0] }
        get a18() { return this.arr[7][0] } get a48() { return this.arr[10][0] } get a78() { return this.arr[13][0] }
        get a19() { return this.arr[8][0] } get a49() { return this.arr[11][0] } get a79() { return this.arr[14][0] }

        get a21() { return this.arr[0][1] } get a51() { return this.arr[3][1] } get a81() { return this.arr[6][1] }
        get a22() { return this.arr[1][1] } get a52() { return this.arr[4][1] } get a82() { return this.arr[7][1] }
        get a23() { return this.arr[2][1] } get a53() { return this.arr[5][1] } get a83() { return this.arr[8][1] }
        get a24() { return this.arr[3][1] } get a54() { return this.arr[6][1] } get a84() { return this.arr[9][1] }
        get a25() { return this.arr[4][1] } get a55() { return this.arr[7][1] } get a85() { return this.arr[10][1] }
        get a26() { return this.arr[5][1] } get a56() { return this.arr[8][1] } get a86() { return this.arr[11][1] }
        get a27() { return this.arr[6][1] } get a57() { return this.arr[9][1] } get a87() { return this.arr[12][1] }
        get a28() { return this.arr[7][1] } get a58() { return this.arr[10][1] } get a88() { return this.arr[13][1] }
        get a29() { return this.arr[8][1] } get a59() { return this.arr[11][1] } get a89() { return this.arr[14][1] }

        get a31() { return this.arr[0][2] } get a61() { return this.arr[3][2] } get a91() { return this.arr[6][2] }
        get a32() { return this.arr[1][2] } get a62() { return this.arr[4][2] } get a92() { return this.arr[7][2] }
        get a33() { return this.arr[2][2] } get a63() { return this.arr[5][2] } get a93() { return this.arr[8][2] }
        get a34() { return this.arr[3][2] } get a64() { return this.arr[6][2] } get a94() { return this.arr[9][2] }
        get a35() { return this.arr[4][2] } get a65() { return this.arr[7][2] } get a95() { return this.arr[10][2] }
        get a36() { return this.arr[5][2] } get a66() { return this.arr[8][2] } get a96() { return this.arr[11][2] }
        get a37() { return this.arr[6][2] } get a67() { return this.arr[9][2] } get a97() { return this.arr[12][2] }
        get a38() { return this.arr[7][2] } get a68() { return this.arr[10][2] } get a98() { return this.arr[13][2] }
        get a39() { return this.arr[8][2] } get a69() { return this.arr[11][2] } get a99() { return this.arr[14][2] }

        // Matrix operations
        scale(scalar) {
            return new this.constructor(
                secretToken, 
                this.width, 
                this.height, 
                (i, j) => scalar * this.arr[i][j]
            );
        }

        add(other) {
            if (this.width !== other.width || this.height !== other.height) {
                throw new Error("Matrix dimensions must match for addition");
            }
            return new this.constructor(
                secretToken,
                this.width,
                this.height,
                (i, j) => this.arr[i][j] + other.arr[i][j]
            );
        }

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
            return new Tuple(...this.arr.map(col => col[n]));
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
                ...this.rows().map(row => row.dot(tuple))
            );
        }

        multiplyMatrix(other) {
            if (this.width !== other.height) {
                throw new Error(`Incompatible dimensions: ${this.width} vs ${other.height}`);
            }
            return new this.constructor(
                secretToken,
                this.height,
                other.width,
                (i, j) => this.row(i).dot(other.column(j))
            );
        }

        toString() {
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

    // Matrix Classes
    class Matrix extends MatrixBase {
        static create(width, height, func) {
            return new this(secretToken, width, height, func);
        }

        static fromArray(arr) {
            const dimensions = getDimensions(arr);
            if (dimensions.length !== 2) {
                throw new Error(`${dimensions.length}D arrays not supported`);
            }
            const [width, height] = dimensions;
            return new this(secretToken, width, height, (i, j) => arr[i][j]);
        }

        static fromElements(width, ...vals) {
            const height = Math.floor(vals.length / width);
            if (width * height !== vals.length) {
                throw new Error(`${vals.length} values don't fit into ${width}x${height} Matrix`);
            }
            return new this(secretToken, width, height, (i, j) => vals[i + j * width]);
        }
    }

    class SquareMatrix extends Matrix {
        static create(size, func) {
            return new this(secretToken, size, size, func);
        }

        static fromArray(arr) {
            const matrix = super.fromArray(arr);
            if (matrix.width !== matrix.height) {
                throw new Error("Matrix must be square");
            }
            return matrix;
        }

        static fromElements(...vals) {
            const size = Math.sqrt(vals.length);
            if (!Number.isInteger(size)) {
                throw new Error("Number of elements must form a square");
            }
            return super.fromElements(size, ...vals);
        }

        determinant() {
            throw new Error("Abstract method: determinant must be implemented"); 
        }

        characteristicPolynomial() {
            throw new Error("Abstract method: characteristicPolynomial must be implemented"); 
        }

        eigenValues() {
            return this.characteristicPolynomial().roots().filter(root => root !== 0);
        }

        inverse() {
            throw new Error("Abstract method: inverse must be implemented"); 
        }

        static unit(size) {
            return this.create(size, (i, j) => i === j ? 1 : 0);
        }

        static basis(size, I, J) {
            return this.create(size, (i, j) => i === I && j === J ? 1 : 0);
        }

        static frobius(size, j1, j2, scalar) {
            return this.create(size, (i, j) => 
                i === j ? 1 : (i === j1 && j === j2) ? scalar : 0
            );
        }

        static swap(size, j1, j2) {
            return this.create(size, (i, j) => {
                if (i === j1 && j === j1) return 0;
                if (i === j2 && j === j2) return 0;
                if (i === j1 && j === j2) return 1;
                if (i === j2 && j === j1) return 1;
                return i === j ? 1 : 0;
            });
        }
    }

    class Matrix1 extends SquareMatrix {
        constructor(token, width, height, func) {
            super(token, width, height, func);
            if (width !== 1 || height !== 1) {
                throw new Error("Matrix1 must be 1x1");
            }
        }

        static create(a11) {
            return new this(secretToken, 1, 1, () => a11);
        }

        determinant() { 
            return this.arr[0][0]; 
        }

        inverse() {
            return Matrix1.create(1 / this.arr[0][0]);
        }

        characteristicPolynomial() {
            return new LinearPolynomial(1, -this.arr[0][0]);
        }
    }

    class Matrix2 extends SquareMatrix {
        static create(a11, a12, a21, a22) {
            return new this(secretToken, 2, 2, (i, j) => {
                if (i === 0 && j === 0) return a11;
                if (i === 1 && j === 0) return a12;
                if (i === 0 && j === 1) return a21;
                if (i === 1 && j === 1) return a22;
            });
        }

        determinant() {
            return this.a11 * this.a22 - this.a12 * this.a21;
        }

        inverse() {
            const det = this.determinant();
            return Matrix2.create(
                this.a22 / det,
                -this.a12 / det,
                -this.a21 / det,
                this.a11 / det
            );
        }

        characteristicPolynomial() {
            const trace = this.a11 + this.a22;
            return new QuadraticPolynomial(1, -trace, this.determinant());
        }
    }

    class Matrix3 extends SquareMatrix {
        static create(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
            return new this(secretToken, 3, 3, (i, j) => {
                if (i === 0 && j === 0) return a11;
                if (i === 1 && j === 0) return a12;
                if (i === 2 && j === 0) return a13;
                if (i === 0 && j === 1) return a21;
                if (i === 1 && j === 1) return a22;
                if (i === 2 && j === 1) return a23;
                if (i === 0 && j === 2) return a31;
                if (i === 1 && j === 2) return a32;
                if (i === 2 && j === 2) return a33;
            });
        }
    }

    // Special Matrix Types
    class Triangular extends SquareMatrix {}
    class Frobius extends SquareMatrix {}
    class Permutation extends SquareMatrix {}

    // Vector Spaces
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

    // Linear Transformations
    class LinearTransform {
        constructor(inputSet, outputSet, matrix) {
            if (inputSet.dimensions !== matrix.width || 
                outputSet.dimensions !== matrix.height) {
                throw new Error("Matrix dimensions must match vector spaces");
            }
            this.inputSet = inputSet;
            this.outputSet = outputSet;
            this.matrix = matrix;
        }
        
        apply(vector) {
            return this.matrix.multiplyTuple(vector);
        }
        
        kernel() {
            // Implementation needed
        }
        
        range() {
            // Implementation needed
        }
        
        rank() {
            // Implementation needed
        }
        
        toString() {
            return `LinearTransform from ${this.inputSet} to ${this.outputSet}\n` +
                   `Representation matrix:\n${this.matrix}`;
        }
    }

    class Endomorphism extends LinearTransform {
        constructor(inputSet, matrix) {
            super(inputSet, inputSet, matrix);
        }
    }

    // Public API
    return {
        // Helper functions
        createArray,
        equals,
        getDimensions,
        
        // Vector classes
        Vector,
        Tuple,
        Tuple2,
        ComplexNumber,
        Polynomial,
        LinearPolynomial,
        QuadraticPolynomial,
        CubicPolynomial,
        
        // Matrix classes
        Matrix,
        SquareMatrix,
        Matrix1,
        Matrix2,
        Matrix3,
        Triangular,
        Frobius,
        Permutation,
        
        // Spaces and transformations
        VectorSpace,
        LinearTransform,
        Endomorphism
    };
})();

// Usage Examples
// Create matrices
const m1 = algebra.Matrix1.create(5);
const m2 = algebra.Matrix2.create(1, 2, 3, 4);

// Matrix operations
const scaled = m2.scale(2);
const sum = m2.add(m2);

// Verify types
console.log(m1 instanceof algebra.Matrix1); // true
console.log(m2 instanceof algebra.Matrix2); // true
console.log(scaled instanceof algebra.Matrix2); // true
console.log(sum instanceof algebra.Matrix2); // true

// Determinant and inverse
console.log("Matrix2 determinant:", m2.determinant()); // -2
const inv = m2.inverse();
console.log("Matrix2 inverse:", inv.toString());

// Linear transformation
const vs = new algebra.VectorSpace(
    new algebra.Tuple(1, 0),
    new algebra.Tuple(0, 1)
);
const lt = new algebra.LinearTransform(
    vs,
    vs,
    algebra.Matrix2.create(2, 0, 0, 3)
);
const result = lt.apply(new algebra.Tuple(1, 1));
console.log("Linear transform result:", result.toString()); // (2, 3)