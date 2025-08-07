
// ================== SVG Shape Classes ================== //
class Shape {
    /**
     * Base class for all drawable shapes
     * @param {World} world - Reference to world instance
     * @param {Object} attrs - Key-value pairs for shape attributes
     */

    static general_attributes = {
        "name": "text",
        "hidden": "checkbox",
        "delete": "button",
        /*"stroke-width": "",*/
        /*"color": "" */
    }

    static default_general_attributes = {
        "name": "new element",
        "hidden": false,
        "delete": false,
    }

    static specific_attributes = {}
    static default_specific_attributes = {}

    static new(world){
        return new this(world, this.default_general_attributes, this.default_specific_attributes);
    }

    create_attribute_ui(attribute_key, attribute_type, attribute_value){
        const attribute = document.createElement("div");
        const attribute_name = document.createElement("div");
        const attribute_input_container = document.createElement("div");
        const attribute_input = document.createElement("input");
        attribute_input.setAttribute("type", attribute_type);
        switch(attribute_type){
            case "text":
                attribute_input.value = attribute_value
                attribute_input.addEventListener("input", (event) => {
                    this[attribute_key] = event.target.value;
                    this.update();
                });
                break;
            case "checkbox":
                attribute_input.checked = attribute_value
                attribute_input.addEventListener("change", (event) => {
                    this[attribute_key] = event.target.checked;
                    this.update();
                });
                break;
            case "button":
                attribute_input.checked = attribute_value
                attribute_input.addEventListener("click", (event) => {
                    this[attribute_key] = !this[attribute_key];
                    this.update();
                });
                break;
        }

        attribute_input.classList.add("attribute-value");
        attribute_name.classList.add("attribute-label");
        attribute.classList.add("attribute-row");
        attribute_input_container.classList.add("attribute_value_container");

        attribute_name.innerHTML = `${attribute_key}:`;
        attribute_input_container.appendChild(attribute_input);
        attribute.appendChild(attribute_name);
        attribute.appendChild(attribute_input_container);
        return attribute;
    }

    constructor(world, general_attrs, specific_attrs) {
        this.world = world;
        this.id = world.id;
        this.svg_id = `svg_${this.id}`;
        this.control_id = `control_${this.id}`;
        world.id++;
        const ui_module = document.createElement("div");
        const general_attributes_container = document.createElement("div");
        const specific_attributes_container = document.createElement("div");

        ui_module.classList.add("ui-module");
        ui_module.setAttribute("id", this.control_id);
        general_attributes_container.classList.add("attributes-section");
        specific_attributes_container.classList.add("attributes-section");

        // Create UI controls for each specific_attribute
        for (const [key, value] of Object.entries(specific_attrs)) {
            const attribute = this.create_attribute_ui(key, this.constructor.specific_attributes[key], value);
            specific_attributes_container.appendChild(attribute);
            this[key] = value;
        }

        for (const [key, value] of Object.entries(general_attrs)) {
            const attribute = this.create_attribute_ui(key, Shape.general_attributes[key], value);
            general_attributes_container.appendChild(attribute);
            this[key] = value;
        }

        ui_module.appendChild(general_attributes_container);
        ui_module.appendChild(specific_attributes_container);
        document.getElementById("control-panel").appendChild(ui_module);
        world.shapes.push(this);
    }

    update() {
        $(`#${this.svg_id}`).remove();
        if (this.delete){
            this.world.shapes.splice(this.world.shapes.indexOf(this),1);
            $(`#${this.control_id}`).remove();
            return;
        }
        if (this.hidden){return}
        const svg_element = this.draw();
        svg_element.setAttribute("id", this.svg_id)
        this.world.svg.appendChild(svg_element);
    }

    /** To be implemented by subclasses */
    draw() {}
}

class InfiniteGrid extends Shape {
    /**
     * Infinite coordinate grid implementation
     * @param {World} world - World reference
     * @param {Object} attrs - Shape attributes
     */

    static specific_attributes = {}
    static default_specific_attributes = {}

    constructor(world, general_attrs, specific_attrs) {
        super(world, general_attrs, specific_attrs);
    }

    /** Main grid drawing method */
    draw() {
        const zoomLevel = Math.sqrt(Math.abs(this.world.worldToScreenTransform.matrix.determinant()));
        const zoomLevelInt = Math.ceil(Math.log10(zoomLevel / 100));
        const cellSize = Math.pow(0.1, zoomLevelInt);
        const visibleArea = this.world.getVisibleWorldBounds(0);
        const gridRect = visibleArea.scale(1 / cellSize).expandedToIntegerBounds();
        const gridGroup = document.createElementNS(this.world.svgNS, "g");
        gridGroup.id = this.id;

        // Draw vertical grid lines
        for (let x = gridRect.x1; x <= gridRect.x2; x++) {
            const lineRank = determineGridLineRank(x);
            const strokeWidth = (lineRank + 0.25).toString();
            const color = "rgb(62, 55, 107)";
            
            gridGroup.appendChild(
                this.createGridLine(
                    new Vec2(x * cellSize, gridRect.y1 * cellSize),
                    new Vec2(x * cellSize, gridRect.y2 * cellSize),
                    strokeWidth,
                    color
                )
            );
        }

        // Draw horizontal grid lines
        for (let y = gridRect.y1; y <= gridRect.y2; y++) {
            const lineRank = determineGridLineRank(y);
            const strokeWidth = (lineRank + 0.25).toString();
            const color = "rgb(62, 55, 107)";
            
            gridGroup.appendChild(
                this.createGridLine(
                    new Vec2(gridRect.x1 * cellSize, y * cellSize),
                    new Vec2(gridRect.x2 * cellSize, y * cellSize),
                    strokeWidth,
                    color
                )
            );
        }

        return gridGroup;
    }

    /**
     * Creates SVG line element for grid
     * @param {Vec2} start - World coordinates start point
     * @param {Vec2} end - World coordinates end point
     * @param {string} strokeWidth - Line thickness
     * @param {string} color - Line color
     */
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

class Axes extends Shape{
    /**
     * coordinate axes
     * @param {World} world - World reference
     * @param {Object} attrs - Shape attributes
     */

    static specific_attributes = {}
    static default_specific_attributes = {}

    constructor(world, general_attrs, specific_attrs) {
        super(world, general_attrs, specific_attrs);
    }

    draw(){
        const screen_polygon = this.world.getVisibleWorldPolygon(30);
        const axesGroup = document.createElementNS(this.world.svgNS, "g");
        const origin = this.world.screenToWorld(this.world.getViewportRect(30.1).clip(this.world.worldToScreen(Vec2.Zero())));

        // axes

        const x_axis = this.Axis(origin, Vec2.EX(), screen_polygon);
        const y_axis = this.Axis(origin, Vec2.EY(), screen_polygon);

        // rest

        axesGroup.setAttribute("id", this.id);
        axesGroup.appendChild(x_axis);
        axesGroup.appendChild(y_axis);
        return axesGroup;
    }

    Axis(origin, direction, area){
        const axis_line = new Line(origin, direction);
        const axis_intersections = area.intersectLine(axis_line);
        const axis_start = axis_intersections[0];
        const axis_end = axis_intersections[1];

        const axis = this.createArrow(
            this.world.worldToScreen(axis_start),
            this.world.worldToScreen(axis_end));
        
        return axis;
    }

    createArrow(start, end){
        
        const arrow_vector = end.add(start.negative()).normalized();
        const left_point = end.add(arrow_vector.complexMultiply(new Vec2(-20,10)));
        const right_point = end.add(arrow_vector.complexMultiply(new Vec2(-20,-10)));

        const arrowElement = document.createElementNS(this.world.svgNS, "path");
        
        arrowElement.setAttribute("d", `
            M${start.x},${start.y} 
            L${end.x},${end.y}
            M${left_point.x},${left_point.y} 
            L${end.x},${end.y} 
            L${right_point.x},${right_point.y}`);
        arrowElement.setAttribute("stroke", "rgb(154, 150, 218)");
        arrowElement.setAttribute("stroke-width", "2");
        arrowElement.setAttribute("fill", "none");
        
        return arrowElement;
    }
}

class FunctionGraph extends Shape {
    /**
     * Function graph renderer
     * @param {World} world - World reference
     * @param {Object} attrs - Shape attributes (requires 'func')
     */

    static specific_attributes = {"function":"text"}
    static default_specific_attributes = {"function":"sin(x)"}

    constructor(world, general_attrs, specific_attrs) {
        super(world, general_attrs, specific_attrs);
    }

    /** Draws the function graph */
    draw() {
        var parsedFunction;
        try {
            parsedFunction = math.parse(this.function);
        } catch {
            parsedFunction = math.parse("x");
        }
        const visibleArea = this.world.getVisibleWorldBounds(0);
        const graphGroup = document.createElementNS(this.world.svgNS, "g");
        graphGroup.id = this.id;
        const pathElement = document.createElementNS(this.world.svgNS, "path");
        
        pathElement.setAttribute("stroke", "rgb(95, 194, 86)");
        pathElement.setAttribute("stroke-width", "1");
        pathElement.setAttribute("fill", "none");
        
        // Build path data by sampling function
        let pathData = "M";
        const sampleCount = 300;
        const step = visibleArea.width() / sampleCount;
        
        for (let x_value = visibleArea.x1; x_value <= visibleArea.x2; x_value += step) {
            try {
                const screenPoint = this.world.worldToScreen(new Vec2(x_value, parsedFunction.evaluate({x:x_value})));
                pathData += `${screenPoint.x},${screenPoint.y} `;
            } catch (e) {
                // Skip invalid points
            }
        }
        
        pathElement.setAttribute("d", pathData);
        graphGroup.appendChild(pathElement);
        return graphGroup;
    }
}

class Transformation extends Shape {
    /**
     * 2d Transformation graph renderer
     * @param {World} world - World reference
     * @param {Object} attrs - Shape attributes (requires 'func')
     */

    static specific_attributes = {"x_func":"text","y_func":"text"}
    static default_specific_attributes = {"x_func":"x+sin(y)","y_func":"y+sin(x)"}

    constructor(world, general_attrs, specific_attrs) {
        super(world, general_attrs, specific_attrs);
    }

    /** Draws the transformed Grid */
    draw() {
        const parsed_x_func = math.parse(this.x_func);
        const parsed_y_func = math.parse(this.y_func);
        const func = (v => new Vec2(parsed_x_func.evaluate({x:v.x,y:v.y}), parsed_y_func.evaluate({x:v.x,y:v.y})));
        const inverseFunc = inverse2(func);

        const graphGroup = document.createElementNS(this.world.svgNS, "g");
        const samples = 5;
        const size = 10;

        // vertical lines

        for (var x_val = -size; x_val <= size; x_val++){
            const pathElement = document.createElementNS(this.world.svgNS, "path");
            pathElement.setAttribute("stroke", "rgb(149, 81, 194)");
            pathElement.setAttribute("stroke-width", "1");
            pathElement.setAttribute("fill", "none");
            let pathData = "M";
            for (var y_val = -10; y_val <= 10; y_val+=1/samples){
                const screenPoint = this.world.worldToScreen(new Vec2(
                    parsed_x_func.evaluate({x:x_val,y:y_val}),
                    parsed_y_func.evaluate({x:x_val,y:y_val})));
                pathData += `${screenPoint.x},${screenPoint.y} `
            }
            pathElement.setAttribute("d", pathData);
            graphGroup.appendChild(pathElement)
        }

        // horizontal lines

        for (var y_val = -size; y_val <= size; y_val++){
            const pathElement = document.createElementNS(this.world.svgNS, "path");
            pathElement.setAttribute("stroke", "rgb(149, 81, 194)");
            pathElement.setAttribute("stroke-width", "1");
            pathElement.setAttribute("fill", "none");
            let pathData = "M";
            for (var x_val = -10; x_val <= 10; x_val+=1/samples){
                const screenPoint = this.world.worldToScreen(new Vec2(
                    parsed_x_func.evaluate({x:x_val,y:y_val}),
                    parsed_y_func.evaluate({x:x_val,y:y_val})));
                pathData += `${screenPoint.x},${screenPoint.y} `
            }
            pathElement.setAttribute("d", pathData);
            graphGroup.appendChild(pathElement)
        }
    
        return graphGroup;

        /*
        const visibleArea = this.world.getVisibleWorldBounds();
        const graphGroup = document.createElementNS(this.world.svgNS, "g");
        graphGroup.id = this.id;
        const pathElement = document.createElementNS(this.world.svgNS, "path");
        
        pathElement.setAttribute("stroke", "rgb(95, 194, 86)");
        pathElement.setAttribute("stroke-width", "1");
        pathElement.setAttribute("fill", "none");
        
        // Build path data by sampling function
        let pathData = "M";
        const sampleCount = 300;
        const step = visibleArea.width() / sampleCount;
        
        for (let x_value = visibleArea.x1; x_value <= visibleArea.x2; x_value += step) {
            try {
                const screenPoint = this.world.worldToScreen(new Vec2(x_value, parsedFunction.evaluate({x:x_value})));
                pathData += `${screenPoint.x},${screenPoint.y} `;
            } catch (e) {
                // Skip invalid points
            }
        }
        
        pathElement.setAttribute("d", pathData);
        graphGroup.appendChild(pathElement);
        return graphGroup;
        */
    }
}