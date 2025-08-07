/**
 * 2D Vector implementation
 */
class Vec2 {
    /**
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /** 
     * Vector addition 
     * @param {Vec2} other - Vector to add
     * @returns {Vec2} New vector
     */
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    
    /** 
     * Scalar multiplication 
     * @param {number} scalar - Scaling factor
     * @returns {Vec2} New vector
     */
    scale(scalar) {
        return new Vec2(scalar * this.x, scalar * this.y);
    }
    
    /** 
     * Complex number multiplication (treating vectors as complex numbers)
     * @param {Vec2} other - Vector to multiply with
     * @returns {Vec2} New vector
     */
    complexMultiply(other) {
        return new Vec2(
            this.x * other.x - this.y * other.y,
            this.x * other.y + this.y * other.x
        );
    }
    
    /** 
     * Dot product 
     * @param {Vec2} other - Vector to dot with
     * @returns {number} Dot product result
     */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    
    /** 
     * Vector magnitude 
     * @returns {number} Magnitude
     */
    magnitude() {
        return Math.sqrt(this.dot(this));
    }
    
    /** 
     * Angle in radians 
     * @returns {number} Angle in radians
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }
    
    /** 
     * Complex exponentiation (treating vector as complex number)
     * @param {number} exponent - Exponent
     * @returns {Vec2} New vector
     */
    power(exponent) {
        const r = this.magnitude();
        const abs = Math.pow(r, exponent);
        const phi = this.angle();
        return new Vec2(
            Math.cos(exponent * phi), 
            Math.sin(exponent * phi)
        ).scale(abs);
    }

    /** 
     * Normalized vector (unit vector) 
     * @returns {Vec2} New normalized vector
     * @throws {Error} If magnitude is zero
     */
    normalized() {
        const mag = this.magnitude();
        if (mag === 0) throw new Error("Cannot normalize zero vector");
        return this.scale(1 / mag);
    }

    /** 
     * Negative vector 
     * @returns {Vec2} New negative vector
     */
    negative() {
        return new Vec2(-this.x, -this.y);
    }

    static EX() {
        return new Vec2(1, 0);
    }

    static EY() {
        return new Vec2(0, 1);
    }

    static Zero(){
        return new Vec2(0, 0);
    }
}


/**
 * 2x2 Transformation matrix
 */
class Matrix2 {
    /**
     * @param {number} a - Element (1,1)
     * @param {number} b - Element (1,2)
     * @param {number} c - Element (2,1)
     * @param {number} d - Element (2,2)
     */
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    static fromColumns(v1, v2){
        return new Matrix2(v1.x, v2.x, v1.y, v2.y);
    }

    static fromRows(v1, v2){
        return new Matrix2(v1.x, v1.y, v2.x, v2.y);
    }
    
    /** 
     * Apply matrix to vector 
     * @param {Vec2} vector - Input vector
     * @returns {Vec2} Transformed vector
     */
    apply(vector) {
        return new Vec2(
            vector.x * this.a + vector.y * this.b,
            vector.x * this.c + vector.y * this.d
        );
    }
    
    /** 
     * Scalar multiplication 
     * @param {number} scalar - Scaling factor
     * @returns {Matrix2} New matrix
     */
    scale(scalar) {
        return new Matrix2(
            scalar * this.a,
            scalar * this.b,
            scalar * this.c,
            scalar * this.d
        );
    }
    
    /** 
     * Matrix determinant 
     * @returns {number} Determinant value
     */
    determinant() {
        return this.a * this.d - this.b * this.c;
    }
    
    /** 
     * Matrix inverse 
     * @returns {Matrix2} Inverse matrix
     * @throws {Error} If matrix is singular
     */
    inverse() {
        const det = this.determinant();
        if (det === 0) throw new Error("Matrix is singular");
        return new Matrix2(this.d, -this.b, -this.c, this.a)
               .scale(1 / det);
    }
    
    /** 
     * Matrix multiplication 
     * @param {Matrix2} other - Matrix to multiply with
     * @returns {Matrix2} New matrix product
     */
    multiply(other) {
        return new Matrix2(
            this.a * other.a + this.b * other.c,
            this.a * other.b + this.b * other.d,
            this.c * other.a + this.d * other.c,
            this.c * other.b + this.d * other.d
        );
    }

    /** 
     * First row as vector 
     * @returns {Vec2} First row vector
     */
    firstRowVector() {
        return new Vec2(this.a, this.b);
    }

    /** 
     * Second row as vector 
     * @returns {Vec2} Second row vector
     */
    secondRowVector() {
        return new Vec2(this.c, this.d);
    }

    /** 
     * First column as vector 
     * @returns {Vec2} First column vector
     */
    firstColumnVector() {
        return new Vec2(this.a, this.c);
    }

    /** 
     * Second column as vector 
     * @returns {Vec2} Second column vector
     */
    secondColumnVector() {
        return new Vec2(this.b, this.d);
    }

    /**
     * Create rotation matrix
     * @param {number} phi - Rotation angle in radians
     * @returns {Matrix2} Rotation matrix
     */
    static rotationMatrix(phi) {
        return new Matrix2(
            Math.cos(phi), -Math.sin(phi),
            Math.sin(phi), Math.cos(phi)
        );
    }
}


/**
 * Affine Transformation (linear transformation + translation)
 */
class AffineTransformation {
    /**
     * @param {Matrix2} matrix - Linear transformation matrix
     * @param {Vec2} vector - Translation vector
     */
    constructor(matrix, vector) {
        this.matrix = matrix;
        this.vector = vector;
    }
    
    /** 
     * Apply transformation to vector 
     * @param {Vec2} vector - Input vector
     * @returns {Vec2} Transformed vector
     */
    apply(vector) {
        return this.matrix.apply(vector).add(this.vector);
    }
    
    /** 
     * Inverse transformation 
     * @returns {AffineTransformation} Inverse transformation
     * @throws {Error} If matrix is singular
     */
    inverse() {
        const invMatrix = this.matrix.inverse();
        return new AffineTransformation(
            invMatrix,
            invMatrix.apply(this.vector.negative())
        );
    }
    
    /** 
     * Compose with another transformation (this ∘ other)
     * @param {AffineTransformation} other - Other transformation
     * @returns {AffineTransformation} Composed transformation
     */
    compose(other) {
        return new AffineTransformation(
            this.matrix.multiply(other.matrix),
            this.matrix.apply(other.vector).add(this.vector)
        );
    }
    
    /** 
     * Clip point to unit rectangle in transformed space
     * @param {Vec2} point - Point to clip
     * @returns {Vec2} Clipped point
     */
    clip(point) {
        const inversePoint = this.inverse().apply(point);
        const clippedInverse = Rectangle.unitRectangle().clip(inversePoint);
        return this.apply(clippedInverse);
    }
    
    /** 
     * Get axis-aligned bounding box of transformed unit rectangle
     * @returns {Rectangle} Bounding rectangle
     */
    boundingRectangle() {
        const corners = [
            this.vector,
            this.apply(new Vec2(1, 0)),
            this.apply(new Vec2(0, 1)),
            this.apply(new Vec2(1, 1))
        ];
        
        const xs = corners.map(v => v.x);
        const ys = corners.map(v => v.y);
        
        return new Rectangle(
            Math.min(...xs),
            Math.min(...ys),
            Math.max(...xs),
            Math.max(...ys)
        );
    }
}
/*
class Rectangle {

    constructor(x1, y1, x2, y2) {
        this.x1 = Math.min(x1, x2);
        this.y1 = Math.min(y1, y2);
        this.x2 = Math.max(x1, x2);
        this.y2 = Math.max(y1, y2);
    }

    width() { return this.x2 - this.x1 }
    

    height() { return this.y2 - this.y1 }


    scale(scalar) {
        return new Rectangle(
            scalar * this.x1, 
            scalar * this.y1, 
            scalar * this.x2, 
            scalar * this.y2
        );
    }


    outer() {
        return new Rectangle(
            Math.floor(this.x1), 
            Math.floor(this.y1), 
            Math.ceil(this.x2), 
            Math.ceil(this.y2)
        );
    }

    toParallelogram(){
        return new Parallelogram(new Vec2(this.x1, this.y1), new Vec2(this.x1, this.y2), new Vec2(this.x2, this.y1));
    }

    toAffineTransform(){
        return new AffineTransformation(new Matrix2(this.x2-this.x1, 0, 0, this.y2-this.y1), new Vec2(this.x1, this.y1));
    }


    clip(point){
        return new Vec2(clip(point.x, this.x1, this.x2), clip(point.y, this.y1, this.y2))
    }

    static unit_rectangle = new Rectangle(0, 0, 1, 1);
}
*/

/**
 * Axis-aligned rectangle representation
 */
class Rectangle {
    /**
     * @param {number} x1 - First x coordinate
     * @param {number} y1 - First y coordinate
     * @param {number} x2 - Second x coordinate
     * @param {number} y2 - Second y coordinate
     */
    constructor(x1, y1, x2, y2) {
        this.x1 = Math.min(x1, x2);
        this.y1 = Math.min(y1, y2);
        this.x2 = Math.max(x1, x2);
        this.y2 = Math.max(y1, y2);
    }

    /** 
     * Rectangle width 
     * @returns {number} Width
     */
    width() { 
        return this.x2 - this.x1; 
    }
    
    /** 
     * Rectangle height 
     * @returns {number} Height
     */
    height() { 
        return this.y2 - this.y1; 
    }

    /** 
     * Scale rectangle 
     * @param {number} scalar - Scaling factor
     * @returns {Rectangle} New scaled rectangle
     */
    scale(scalar) {
        return new Rectangle(
            scalar * this.x1, 
            scalar * this.y1, 
            scalar * this.x2, 
            scalar * this.y2
        );
    }

    /** 
     * Expanded rectangle with integer boundaries 
     * @returns {Rectangle} Expanded rectangle
     */
    expandedToIntegerBounds() {
        return new Rectangle(
            Math.floor(this.x1), 
            Math.floor(this.y1), 
            Math.ceil(this.x2), 
            Math.ceil(this.y2)
        );
    }

    /** 
     * Contracted rectangle with integer boundaries 
     * @returns {Rectangle} Contracted rectangle
     */
    contractedToIntegerBounds() {
        return new Rectangle(
            Math.ceil(this.x1), 
            Math.ceil(this.y1), 
            Math.floor(this.x2), 
            Math.floor(this.y2)
        );
    }

    /** 
     * Convert to parallelogram representation 
     * @returns {Object} Parallelogram object
     */
    toParallelogram() {
        return {
            origin: new Vec2(this.x1, this.y1),
            pointY: new Vec2(this.x1, this.y2),
            pointX: new Vec2(this.x2, this.y1)
        };
    }

    /** 
     * Convert to affine transformation 
     * @returns {AffineTransformation} Affine transformation
     */
    toAffineTransform() {
        return new AffineTransformation(
            new Matrix2(this.width(), 0, 0, this.height()),
            new Vec2(this.x1, this.y1)
        );
    }

    /** 
     * Expand rectangle boundaries 
     * @param {number} d - Expansion amount
     * @returns {Rectangle} New expanded rectangle
     */
    expand(d) {
        return new Rectangle(
            this.x1 - d, 
            this.y1 - d, 
            this.x2 + d, 
            this.y2 + d
        );
    }

    /** 
     * Shrink rectangle boundaries 
     * @param {number} d - Shrink amount
     * @returns {Rectangle} New shrunk rectangle
     */
    shrink(d) {
        return this.expand(-d);
    }

    /** 
     * Clip point to rectangle boundaries 
     * @param {Vec2} point - Input point
     * @returns {Vec2} Clipped point
     */
    clip(point) {
        return new Vec2(
            Math.max(this.x1, Math.min(point.x, this.x2)),
            Math.max(this.y1, Math.min(point.y, this.y2))
        );
    }

    expand(d){
        return new Rectangle(this.x1-d, this.y1-d, this.x2+d, this.y2+d);
    }

    shrink(d){
        return this.expand(-d);
    }

    /** 
     * Create unit rectangle [0,0] to [1,1]
     * @returns {Rectangle} Unit rectangle
     */
    static unitRectangle() {
        return new Rectangle(0, 0, 1, 1);
    }
}