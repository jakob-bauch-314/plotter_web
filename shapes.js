// ================== SVG Shape Classes ================== //
class Shape {
    /**
     * Base class for all drawable shapes
     * @param {World} world - Reference to world instance
     * @param {Object} provided_attrs - User-provided attribute overrides
     */

    static general_attributes = {
        name:   { type: "text",     label: "name",   default: "new element" },
        hidden: { type: "checkbox", label: "hidden",  default: false },
        delete: { type: "button",   label: "delete", on_click: shape_instance => shape_instance.delete()},
        color:  { type: "color",    label: "color",  default: "#ffffff" },
        stroke: { type: "range",    label: "stroke", default: 1, min: 0.5, max: 5, step: 1 }
    };

    static specific_attributes = {};

    constructor(world, provided_attrs = {}) {
        this.world = world;
        this.id = world.id++;
        this.svg_id = `svg_${this.id}`;
        this.control_id = `control_${this.id}`;

        // Merge general + specific defaults + provided values
        this.attrs = Shape.mergeDefaults(
            this.constructor.general_attributes,
            this.constructor.specific_attributes,
            provided_attrs
        );

        // Build UI module
        const ui_module = document.createElement("div");
        ui_module.classList.add("ui-module");
        ui_module.id = this.control_id;

        const general_container = document.createElement("div");
        general_container.classList.add("attributes-section");

        const specific_container = document.createElement("div");
        specific_container.classList.add("attributes-section");

        for (const [key, meta] of Object.entries(this.constructor.general_attributes)) {
            general_container.appendChild(
                this.createAttributeUI(key, meta)
            );
        }

        for (const [key, meta] of Object.entries(this.constructor.specific_attributes)) {
            if (this.constructor.general_attributes[key] != undefined) continue;
            specific_container.appendChild(
                this.createAttributeUI(key, meta)
            );
        }

        ui_module.appendChild(general_container);
        ui_module.appendChild(specific_container);
        document.getElementById("control-panel").appendChild(ui_module);

        world.shapes.push(this);
        this.update();
    }

    static mergeDefaults(general_meta, specific_meta, provided) {
        const merged = {};
        const applyDefaults = (meta) => {
            for (const [key, def] of Object.entries(meta)) {
                merged[key] = provided[key] !== undefined ? provided[key] : def.default;
            }
        };
        applyDefaults(general_meta);
        applyDefaults(specific_meta);
        return merged;
    }

    createAttributeUI(key, meta) {

        const wrapper = document.createElement("div");
        wrapper.classList.add("attribute-row");
        const label = document.createElement("div");
        label.classList.add("attribute-label");
        label.textContent = `${meta.label}:`;
        const input_container = document.createElement("div");
        input_container.classList.add("attribute-value-container");
        const input = document.createElement("input");
        input.classList.add("attribute-value")
        input.type = meta.type;

        if (meta.type === "range") {
            if (meta.min !== undefined) input.min = meta.min;
            if (meta.max !== undefined) input.max = meta.max;
            if (meta.step !== undefined) input.step = meta.step;
        }

        if (meta.type === "checkbox") {
            input.checked = this.attrs[key];
        } else if (!(meta.type === "button")){
            input.value = this.attrs[key];
        }

        if (meta.type === "button") {
            input.addEventListener("click", (e) => meta.on_click(this))
        } else {
            input.addEventListener("input", (e) => {
                this.attrs[key] = meta.type === "checkbox" ? e.target.checked : e.target.value;
                this.update();
            });
        }

        if (meta.type === "color" || meta.type === "range" || meta.type === "checkbox") {
            input.addEventListener("change", (e) => {
                this.attrs[key] = meta.type === "checkbox" ? e.target.checked : e.target.value;
                this.update();
            });
        }

        input_container.appendChild(input);
        wrapper.appendChild(label);
        wrapper.appendChild(input_container);
        return wrapper;
    }

    delete() {
        document.getElementById(this.svg_id)?.remove();
        document.getElementById(this.control_id)?.remove();
        this.world.shapes.splice(this.world.shapes.indexOf(this), 1);
        return;
    }

    update() {
        document.getElementById(this.svg_id)?.remove();
        if (this.attrs.hidden) return;
        const svg_element = this.draw();
        svg_element.id = this.svg_id;
        this.world.svg.appendChild(svg_element);
    }

    // ===== Helpers for drawing =====
    createPath(path, stroke=this.attrs.stroke, color=this.attrs.color) {
        const pathElement = document.createElementNS(this.world.svgNS, "path");
        pathElement.setAttribute("stroke", color);
        pathElement.setAttribute("stroke-width", stroke);
        pathElement.setAttribute("fill", "none");
        let pathData = "M";
        for (const vertice of path.vertices) {
            pathData += `${vertice.x},${vertice.y} `;
        }
        pathElement.setAttribute("d", pathData);
        return pathElement;
    }

    // Override in subclasses
    draw() {
        return document.createElementNS(this.world.svgNS, "g");
    }
}

// ================== Subclasses ================== //
class InfiniteGrid extends Shape {
    static specific_attributes = {
        size: { type: "range", default: 100, min: 50, max: 500, label: "size" },
        color: { default: "#576f9b" },
        name: { default: "grid" }
    };

    draw() {
        const zoomLevel = Math.sqrt(Math.abs(this.world.worldToScreenTransform.linear.determinant()));
        const zoomLevelInt = Math.ceil(Math.log10(zoomLevel / this.attrs.size));
        const cellSize = Math.pow(0.1, zoomLevelInt);
        const visibleArea = this.world.getVisibleWorldBounds(0);
        const gridRect = visibleArea.scale(1 / cellSize).expandedToIntegerBounds();
        const gridGroup = document.createElementNS(this.world.svgNS, "g");

        for (let x = gridRect.minX; x <= gridRect.maxX; x++) {
            const lineRank = determineGridLineRank(x);
            const strokeWidth = (this.attrs.stroke / 4 + lineRank).toString();
            gridGroup.appendChild(
                this.createGridLine(
                    new Vec2(x * cellSize, gridRect.minY * cellSize),
                    new Vec2(x * cellSize, gridRect.maxY * cellSize),
                    strokeWidth,
                    this.attrs.color
                )
            );
        }

        for (let y = gridRect.minY; y <= gridRect.maxY; y++) {
            const lineRank = determineGridLineRank(y);
            const strokeWidth = (this.attrs.stroke / 4 + lineRank).toString();
            gridGroup.appendChild(
                this.createGridLine(
                    new Vec2(gridRect.minX * cellSize, y * cellSize),
                    new Vec2(gridRect.maxX * cellSize, y * cellSize),
                    strokeWidth,
                    this.attrs.color
                )
            );
        }
        return gridGroup;
    }

    createGridLine(start, end, strokeWidth, color) {
        const screenStart = this.world.worldToScreen(start);
        const screenEnd = this.world.worldToScreen(end);
        const lineElement = document.createElementNS(this.world.svgNS, "path");
        lineElement.setAttribute("d", `M${screenStart.x},${screenStart.y} L${screenEnd.x},${screenEnd.y}`);
        lineElement.setAttribute("stroke", color);
        lineElement.setAttribute("stroke-width", strokeWidth);
        lineElement.setAttribute("fill", "none");
        return lineElement;
    }
}

class Axes extends Shape {
    static specific_attributes = {
        name: {default: "axes"},
        color: {default: "#65c9b8"},
        stroke: {default: 3}
    };
    draw() {
        const screen_polygon = this.world.getVisibleWorldPolygon(30);
        const axesGroup = document.createElementNS(this.world.svgNS, "g");
        const origin = this.world.screenToWorld(this.world.getViewportRect(30.1).clip(this.world.worldToScreen(Vec2.ZERO)));

        const x_axis = this.Axis(origin, Vec2.EX, screen_polygon);
        const y_axis = this.Axis(origin, Vec2.EY, screen_polygon);

        axesGroup.appendChild(x_axis);
        axesGroup.appendChild(y_axis);
        return axesGroup;
    }

    Axis(origin, direction, area) {
        const axis_line = new Line(origin, direction);
        const intersections = area.intersectLine(axis_line);
        return this.createArrow(
            this.world.worldToScreen(intersections[0]),
            this.world.worldToScreen(intersections[1])
        );
    }

    createArrow(start, end) {
        const arrow_vector = end.subtract(start).normalized();
        const left_point = end.add(arrow_vector.complexMultiply(new Vec2(-20, 10)));
        const right_point = end.add(arrow_vector.complexMultiply(new Vec2(-20, -10)));

        const arrowElement = document.createElementNS(this.world.svgNS, "path");
        arrowElement.setAttribute("d", `M${start.x},${start.y} L${end.x},${end.y} M${left_point.x},${left_point.y} L${end.x},${end.y} L${right_point.x},${right_point.y}`);
        arrowElement.setAttribute("stroke", this.attrs.color);
        arrowElement.setAttribute("stroke-width", this.attrs.stroke);
        arrowElement.setAttribute("fill", "none");
        return arrowElement;
    }
}

class FunctionGraph extends Shape {
    static specific_attributes = {
        function: {type: "text", default: "sin(x)", label: "y"},
        name: {default: "function"},
        color: {default: "#91678b"}
    };

    draw() {
        let parsedFunction;
        try {
            parsedFunction = math.parse(this.attrs.function);
        } catch {
            parsedFunction = math.parse("x");
        }

        const visibleArea = this.world.getVisibleWorldBounds(0);
        const graphGroup = document.createElementNS(this.world.svgNS, "g");
        const pathElement = document.createElementNS(this.world.svgNS, "path");

        pathElement.setAttribute("stroke", this.attrs.color);
        pathElement.setAttribute("stroke-width", this.attrs.stroke);
        pathElement.setAttribute("fill", "none");

        let pathData = "M";
        const sampleCount = 300;
        const step = visibleArea.width / sampleCount;

        for (let x_value = visibleArea.minX; x_value <= visibleArea.maxX; x_value += step) {
            try {
                const screenPoint = this.world.worldToScreen(new Vec2(x_value, parsedFunction.evaluate({ x: x_value })));
                pathData += `${screenPoint.x},${screenPoint.y} `;
            } catch {}
        }

        pathElement.setAttribute("d", pathData);
        graphGroup.appendChild(pathElement);
        return graphGroup;
    }
}

class Transformation extends Shape {
    static specific_attributes = {
        x_func: { type: "text", default: "x*x-y*y", label: "x"},
        y_func: { type: "text", default: "2*x*y" ,  label: "y"},
        size: { type: "range",  default: 300,       label: "size", min: 50, max: 500 },
        color: {default: "#ff0088"},
        name: {default: "transform"}
    };

    draw() {
        const parsedXExpression = math.parse(this.attrs.x_func);
        const parsedYExpression = math.parse(this.attrs.y_func);
        const forwardTransform = (p) => new Vec2(
            parsedXExpression.evaluate({ x: p.x, y: p.y }),
            parsedYExpression.evaluate({ x: p.x, y: p.y })
        );
        const inverseTransform = Numerical.inverse2D(forwardTransform);

        const zoomLevel = math.sqrt(math.abs(
            Numerical.jacobian(forwardTransform)(inverseTransform(this.world.getWorldCenter())).determinant() *
            this.world.worldToScreenTransform.linear.determinant()
        ));
        const zoomLevelInt = Math.ceil(Math.log10(zoomLevel / this.attrs.size));
        const gridCellSize = Math.pow(0.1, zoomLevelInt);
        const visibleWorldPolygon = this.world.getVisibleWorldPolygon(0).subdivide(50).map(inverseTransform);
        const integerRect = visibleWorldPolygon.boundingRectangle().scale(1 / gridCellSize).expandedToIntegerBounds();

        const gridGroup = document.createElementNS(this.world.svgNS, "g");
        for (let i = 0; i <= integerRect.width; i++) {
            const x = (i + integerRect.minX) * gridCellSize;
            const lineRank = determineGridLineRank(i+integerRect.minX);
            const strokeWidth = (this.attrs.stroke / 4 + lineRank).toString();
            const gridLine = new Line(Vec2.EX.scale(x), Vec2.EY);
            const intersections = visibleWorldPolygon.intersectLine(gridLine);
            if (!intersections.length) continue;
            const linePath = new LineSegment(intersections[0], intersections.at(-1)).toPath().subdivide(50);
            const mappedPath = linePath.map(forwardTransform).map(this.world.worldToScreen);
            gridGroup.appendChild(this.createPath(mappedPath, strokeWidth));
        }

        for (let i = 0; i <= integerRect.height; i++) {
            const y = (i + integerRect.minY) * gridCellSize;
            const lineRank = determineGridLineRank(i+integerRect.minY);
            const strokeWidth = (this.attrs.stroke / 4 + lineRank).toString();
            const gridLine = new Line(Vec2.EY.scale(y), Vec2.EX);
            const intersections = visibleWorldPolygon.intersectLine(gridLine);
            if (!intersections.length) continue;
            const linePath = new LineSegment(intersections[0], intersections.at(-1)).toPath().subdivide(50);
            const mappedPath = linePath.map(forwardTransform).map(this.world.worldToScreen);
            gridGroup.appendChild(this.createPath(mappedPath, strokeWidth));
        }

        return gridGroup;
    }
}
