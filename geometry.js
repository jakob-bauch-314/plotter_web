/**
 * 2D Vector implementation
 */
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /** Vector addition */
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    negative() {
        return new Vec2(-this.x, -this.y)
    }

    /** Scalar multiplication */
    scale(scalar) {
        return new Vec2(scalar * this.x, scalar * this.y);
    }

    /** Complex number multiplication */
    complexMultiply(other) {
        return new Vec2(
            this.x * other.x - this.y * other.y,
            this.x * other.y + this.y * other.x
        );
    }

    /** Dot product */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    /** Vector magnitude */
    magnitude() {
        return Math.sqrt(this.dot(this));
    }

    /** Angle in radians */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /** Complex exponentiation */
    power(exponent) {
        const r = Math.pow(this.magnitude(), exponent);
        const phi = this.angle();
        return new Vec2(
            r * Math.cos(exponent * phi),
            r * Math.sin(exponent * phi)
        );
    }

    /** Normalized vector */
    normalized() {
        const mag = this.magnitude();
        if (mag < Number.EPSILON) {
            throw new Error("Cannot normalize zero vector");
        }
        return this.scale(1 / mag);
    }

    /** Vector subtraction */
    subtract(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    /** Distance to another vector */
    distanceTo(other) {
        return this.subtract(other).magnitude();
    }

    static get EX() { return new Vec2(1, 0); }
    static get EY() { return new Vec2(0, 1); }
    static get ZERO() { return new Vec2(0, 0); }
}

/**
 * 2x2 Matrix implementation
 */
class Matrix2 {
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    /** Create from column vectors */
    static fromColumns(col1, col2) {
        return new Matrix2(
            col1.x, col2.x,
            col1.y, col2.y
        );
    }

    /** Create from row vectors */
    static fromRows(row1, row2) {
        return new Matrix2(
            row1.x, row1.y,
            row2.x, row2.y
        );
    }

    /** Apply to vector */
    apply(vector) {
        return new Vec2(
            this.a * vector.x + this.b * vector.y,
            this.c * vector.x + this.d * vector.y
        );
    }

    /** Scalar multiplication */
    scale(scalar) {
        return new Matrix2(
            this.a * scalar, this.b * scalar,
            this.c * scalar, this.d * scalar
        );
    }

    /** Matrix determinant */
    determinant() {
        return this.a * this.d - this.b * this.c;
    }

    /** Matrix inverse */
    inverse() {
        const det = this.determinant();
        if (Math.abs(det) < Number.EPSILON) {
            throw new Error("Matrix is singular");
        }
        return new Matrix2(
            this.d, -this.b,
            -this.c, this.a
        ).scale(1 / det);
    }

    /** Matrix multiplication */
    multiply(other) {
        return new Matrix2(
            this.a * other.a + this.b * other.c,
            this.a * other.b + this.b * other.d,
            this.c * other.a + this.d * other.c,
            this.c * other.b + this.d * other.d
        );
    }

    /** Matrix transpose */
    transpose() {
        return new Matrix2(
            this.a, this.c,
            this.b, this.d
        );
    }

    /** Create rotation matrix */
    static rotation(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix2(
            cos, -sin,
            sin, cos
        );
    }

    static get IDENTITY() {
        return new Matrix2(1, 0, 0, 1);
    }
}

/**
 * Affine Transformation implementation
 */
class AffineTransform {
    constructor(linear = Matrix2.IDENTITY, translation = Vec2.ZERO) {
        this.linear = linear;
        this.translation = translation;
    }

    /** Apply to vector */
    apply(vector) {
        return this.linear.apply(vector).add(this.translation);
    }

    /** Inverse transformation */
    inverse() {
        const invLinear = this.linear.inverse();
        return new AffineTransform(
            invLinear,
            invLinear.apply(this.translation).scale(-1)
        );
    }

    /** Compose transformations */
    compose(other) {
        return new AffineTransform(
            this.linear.multiply(other.linear),
            this.linear.apply(other.translation).add(this.translation)
        );
    }

    /** Create translation transform */
    static translation(vector) {
        return new AffineTransform(Matrix2.IDENTITY, vector);
    }

    /** Create rotation transform */
    static rotation(angle, center = Vec2.ZERO) {
        const linear = Matrix2.rotation(angle);
        const translation = center.subtract(linear.apply(center));
        return new AffineTransform(linear, translation);
    }
}

/**
 * Rectangle implementation
 */
class Rectangle {
    constructor(x1, y1, x2, y2) {
        this.minX = Math.min(x1, x2);
        this.minY = Math.min(y1, y2);
        this.maxX = Math.max(x1, x2);
        this.maxY = Math.max(y1, y2);
    }

    get width() { return this.maxX - this.minX; }
    get height() { return this.maxY - this.minY; }
    get center() {
        return new Vec2(
            (this.minX + this.maxX) / 2,
            (this.minY + this.maxY) / 2
        );
    }

    /** Scale rectangle */
    scale(factor) {
        return new Rectangle(
            factor * this.minX, factor * this.minY,
            factor * this.maxX, factor * this.maxY
        );
    }

    /** Expand boundaries */
    expand(delta) {
        return new Rectangle(
            this.minX - delta, this.minY - delta,
            this.maxX + delta, this.maxY + delta
        );
    }

    /** Shrink boundaries */
    shrink(delta) {
        return this.expand(-delta);
    }

    /** Convert to polygon */
    toPolygon() {
        return new Polygon([
            new Vec2(this.minX, this.minY),
            new Vec2(this.maxX, this.minY),
            new Vec2(this.maxX, this.maxY),
            new Vec2(this.minX, this.maxY)
        ]);
    }

    /** 
     * Expanded rectangle with integer boundaries 
     * @returns {Rectangle} Expanded rectangle
     */
    expandedToIntegerBounds() {
        return new Rectangle(
            Math.floor(this.minX), 
            Math.floor(this.minY), 
            Math.ceil(this.maxX), 
            Math.ceil(this.maxY)
        );
    }

    /** 
     * Contracted rectangle with integer boundaries 
     * @returns {Rectangle} Contracted rectangle
     */
    contractedToIntegerBounds() {
        return new Rectangle(
            Math.ceil(this.minX), 
            Math.ceil(this.minY), 
            Math.floor(this.maxX), 
            Math.floor(this.maxY)
        );
    }

    /** Clip point to rectangle */
    clip(point) {
        return new Vec2(
            Math.max(this.minX, Math.min(point.x, this.maxX)),
            Math.max(this.minY, Math.min(point.y, this.maxY))
        );
    }

    populate(density){
        const points = []
        for (var i = 0; i <= density; i++){
            for (var j = 0; j <= density; j++){
                points.push(new Vec2(i * this.width / density + this.minX, j * this.height / density + this.minY));
            }
        }
        return points;
    }

    static bounds(points){
        return new Rectangle(
            Math.min(...points.map(point => point.x)),
            Math.min(...points.map(point => point.y)),
            Math.max(...points.map(point => point.x)),
            Math.max(...points.map(point => point.y))
        )
    }

    /** Create unit rectangle */
    static get UNIT() {
        return new Rectangle(0, 0, 1, 1);
    }
}

/**
 * Line implementation
 */
class Line {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction.normalized();
    }

    /** Intersect with another line */
    intersectLine(other) {
        const matrix = Matrix2.fromColumns(
            this.direction, 
            other.direction.scale(-1)
        );
        
        try {
            const solution = matrix.inverse().apply(
                other.origin.subtract(this.origin)
            );
            return this.origin.add(this.direction.scale(solution.x));
        } catch (e) {
            return null; // Parallel lines
        }
    }
}

/**
 * Line Segment implementation
 */
class LineSegment {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    get direction() {
        return this.end.subtract(this.start);
    }

    /** Intersect with line */
    intersectLine(line) {
        const segmentVec = this.direction;
        const matrix = Matrix2.fromColumns(
            segmentVec, 
            line.direction.scale(-1)
        );
        
        try {
            const solution = matrix.inverse().apply(
                line.origin.subtract(this.start)
            );
            const t = solution.x;
            
            if (t >= 0 && t <= 1) {
                return [this.start.add(segmentVec.scale(t))];
            }
        } catch (e) {
            // Lines are parallel
        }
        return [];
    }

    toPath(){
        return new Path([this.start, this.end]);
    }
}

/**
 * Path implementation
 */

class Path {
    constructor(points) {
        this.vertices = points;
    }

    /** Transform polygon */
    transform(transform) {
        return new Path(
            this.vertices.map(v => transform.apply(v))
        );
    }

    /** Calculate bounding rectangle */
    boundingRectangle() {
        const xs = this.vertices.map(v => v.x);
        const ys = this.vertices.map(v => v.y);
        return new Rectangle(
            Math.min(...xs), Math.min(...ys),
            Math.max(...xs), Math.max(...ys)
        );
    }

    /** Intersect with line */
    intersectLine(line){
        var scalar_array = [];
        for (var i = 0; i < this.vertices.length-1; i++){
            const start = this.vertices[i % this.vertices.length];
            const end = this.vertices[(i+1) % this.vertices.length]
            const direction = end.subtract(start);
            const basis_change_matrix = Matrix2.fromColumns(line.direction, direction.negative());
            if (basis_change_matrix.determinant() == 0) continue;
            const scalars = (basis_change_matrix.inverse().apply(start.subtract(line.origin)));
            if ((scalars.y < 0) | (scalars.y >= 1)) continue;
            scalar_array.push(scalars.x);
        }
        return scalar_array.sort().map(scalar => line.origin.add(line.direction.scale(scalar)))
    }

    subdivide(n) {
        return new Path(
            this.vertices.flatMap((v, i) => {
                if (i === this.vertices.length - 1) {
                    // Last vertex — don't connect to first
                    return [v];
                }
                const next = this.vertices[i + 1];
                return Array.from({ length: n }, (_, j) =>
                    v.add(
                        next
                            .subtract(v)
                            .scale(j / n)
                    )
                );
            })
        );
    }


    closed(){
        return new Polygon(this.vertices);
    }

    map(f){
        return new Path(this.vertices.map(f));
    }
}

/**
 * Polygon implementation
 */
class Polygon {
    constructor(points) {
        this.vertices = points;
    }

    /** Transform polygon */
    transform(transform) {
        return new Polygon(
            this.vertices.map(v => transform.apply(v))
        );
    }

    /** Calculate bounding rectangle */
    boundingRectangle() {
        const xs = this.vertices.map(v => v.x);
        const ys = this.vertices.map(v => v.y);
        return new Rectangle(
            Math.min(...xs), Math.min(...ys),
            Math.max(...xs), Math.max(...ys)
        );
    }

    /** Intersect with line */
    intersectLine(line){
        var scalar_array = [];
        for (var i = 0; i < this.vertices.length; i++){
            const start = this.vertices[i % this.vertices.length];
            const end = this.vertices[(i+1) % this.vertices.length]
            const direction = end.subtract(start);
            const basis_change_matrix = Matrix2.fromColumns(line.direction, direction.negative());
            if (basis_change_matrix.determinant() == 0) continue;
            const scalars = (basis_change_matrix.inverse().apply(start.subtract(line.origin)));
            if ((scalars.y < 0) | (scalars.y >= 1)) continue;
            scalar_array.push(scalars.x);
        }
        return scalar_array.sort().map(scalar => line.origin.add(line.direction.scale(scalar)))
    }

    subdivide(n) {
        return new Polygon(
            this.vertices.flatMap((v, i) => 
                Array.from({length: n}, (_, j) => 
                    v.add(
                        this.vertices[(i+1) % this.vertices.length]
                            .subtract(v)
                            .scale(j/n)
                    )
                )
            )
        );
    }

    map(f){
        return new Polygon(this.vertices.map(f));
    }
}

/**
 * Numerical Utilities
 */
const Numerical = {
    /** Calculate Jacobian matrix */
    jacobian(f) {
        const h = 1e-5;
        return function(v) {
            const fx = (dx) => f(new Vec2(v.x + dx, v.y));
            const fy = (dy) => f(new Vec2(v.x, v.y + dy));
            
            return new Matrix2(
                (fx(h).x - f(v).x) / h, (fy(h).x - f(v).x) / h,
                (fx(h).y - f(v).y) / h, (fy(h).y - f(v).y) / h
            );
        };
    },

    /** Find 2D root using Newton's method */
    findRoot2D(f, initial = new Vec2(1, 1), maxIterations = 20, tolerance = 1e-7) {
        let x = initial;
        
        for (let i = 0; i < maxIterations; i++) {
            const y = f(x);
            if (y.magnitude() < tolerance) break;
            
            try {
                const J = this.jacobian(f)(x);
                const delta = J.inverse().apply(y);
                x = x.subtract(delta);
            } catch (e) {
                break; // Singular matrix
            }
        }
        return x;
    },

    /** Inverse of 2D function */
    inverse2D(f) {
        return y => this.findRoot2D(x => f(x).subtract(y));
    }
};