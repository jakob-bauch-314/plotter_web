// ================== World Management Class ================== //
class World {
    /**
     * Manages the SVG viewport and all contained shapes
     * @param {SVGElement} svgElement - Reference to SVG element
     * @param {Shape[]} shapes - Initial shapes array
     */
    constructor(svgElement, shapes) {
        this.id = 0;
        this.svgNS = "http://www.w3.org/2000/svg";
        this.svg = svgElement;
        const rect = svgElement.getBoundingClientRect();
        this.viewportSize = new Vec2(rect.width, rect.height);
        this.zoomFactorMatrix = new Matrix2(1.3, 0, 0, 1.3);
        this.rotationFactorMatrix = Matrix2.rotation(Math.PI/32);
        this.shapes = shapes;
        this.isDragging = false;
        this.currentMousePosition = new Vec2(0, 0);
        this.lastMousePosition = new Vec2(0, 0);
        
        this.worldToScreenTransform = new AffineTransform(
            new Matrix2(50, 0, 0, -50),     // Initial zoom
            this.viewportSize.scale(0.5)     // Center view
        );

        // Bind event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseScroll = this.handleMouseScroll.bind(this);
        this.worldToScreen = this.worldToScreen.bind(this);
        this.screenToWorld = this.screenToWorld.bind(this);
    }

    // ================== Event Handlers ================== //
    handleMouseDown(event) {
        this.isDragging = true;
        this.lastMousePosition = this.getMousePosition(event);
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        this.currentMousePosition = this.getMousePosition(event);
        const dragDelta = this.currentMousePosition.subtract(this.lastMousePosition);
        
        // Apply panning transformation
        this.worldToScreenTransform = new AffineTransform(
            this.worldToScreenTransform.linear,
            this.worldToScreenTransform.translation.add(dragDelta)
        );
        
        this.lastMousePosition = this.currentMousePosition;
        this.draw();
    }

    handleMouseScroll(event) {
        event.preventDefault();
        
        const isRotation = event.originalEvent.shiftKey;
        const transformation = isRotation ? 
            this.rotationFactorMatrix : 
            this.zoomFactorMatrix;
        
        const zoomCenter = this.screenToWorld(
            this.getMousePosition(event.originalEvent)
        );
        const zoomDirection = event.originalEvent.deltaY;

        try {
            if (zoomDirection < 0) {  // Zoom in
                this.applyZoom(transformation, zoomCenter);
            } 
            else if (zoomDirection > 0) {  // Zoom out
                this.applyZoom(transformation.inverse(), zoomCenter);
            }
        } catch (error) {
            console.error("Zoom operation failed:", error);
        }
        
        this.draw();
    }

    // ================== Rendering Methods ================== //
    /** Draw all shapes in the world */
    draw() {
        // Clear existing content
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        
        // Render all shapes
        for (const shape of this.shapes) {
            shape.update(this);
        }
    }

    // ================== Coordinate Transforms ================== //
    /** Convert world coordinates to screen coordinates */
    worldToScreen(vector) {
        return this.worldToScreenTransform.apply(vector);
    }

    /** Convert screen coordinates to world coordinates */
    screenToWorld(vector) {
        return this.worldToScreenTransform.inverse().apply(vector);
    }

    /** Get viewport boundaries */
    getViewportRect(margin) {
        const rect = this.svg.getBoundingClientRect();
        return new Rectangle(0, 0, rect.width, rect.height).shrink(margin);
    }

    getViewportPolygon(margin) {
        return this.getViewportRect(margin).toPolygon();
    }

    /** Get current visible area in world coordinates */
    getVisibleWorldPolygon(margin) {
        return this.getViewportPolygon(margin).transform(this.worldToScreenTransform.inverse());
    }

    /** Get axis-aligned bounding box of visible world area */
    getVisibleWorldBounds(margin) {
        return this.getVisibleWorldPolygon(margin).boundingRectangle();
    }

    getWorldCenter(){
        return this.screenToWorld(this.getViewportRect(0).center);
    }

    // ================== Utility Methods ================== //
    /** Get mouse position relative to SVG */
    getMousePosition(event) {
        const rect = this.svg.getBoundingClientRect();
        return new Vec2(event.clientX - rect.left, event.clientY - rect.top);
    }

    /** Find shape by ID */
    getShapeById(id) {
        return this.shapes.find(shape => shape.id === id);
    }

    // ================== Internal Helpers ================== //
    /**
     * Apply zoom/rotation transformation
     * @param {Matrix2} transformation - Transformation matrix to apply
     * @param {Vec2} fixedPoint - World point that should remain fixed
     */
    applyZoom(transformation, fixedPoint) {
        const currentMatrix = this.worldToScreenTransform.linear;
        const currentVector = this.worldToScreenTransform.translation;
        
        const newMatrix = currentMatrix.multiply(transformation);
        const fixedScreen = currentMatrix.apply(fixedPoint).add(currentVector);
        const newFixedScreen = newMatrix.apply(fixedPoint).add(currentVector);
        const offset = fixedScreen.subtract(newFixedScreen);
        
        this.worldToScreenTransform = new AffineTransform(
            newMatrix,
            currentVector.add(offset)
        );
    }
}