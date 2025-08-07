
// ================== Main Initialization ================== //
$(function() {
    // Create world and default shapes
    const worldInstance = new World($("#visualization-canvas")[0], []);
    InfiniteGrid.new(worldInstance);
    Axes.new(worldInstance);
    FunctionGraph.new(worldInstance);
    
    // Bind event listeners
    $("#visualization-canvas")
        .on('mousedown', worldInstance.handleMouseDown)
        .on('mouseup mouseleave', worldInstance.handleMouseUp)
        .on('mousemove', worldInstance.handleMouseMove)
        .on('wheel', worldInstance.handleMouseScroll);
    
    // Shape creation UI
    /*
    $('#new_item_select').on('change', function() {
        if (this.selectedIndex === 1) {
            worldInstance.shapes.push(
                new FunctionGraph(
                    `graph_${worldInstance.shapes.length}`, 
                    worldInstance, 
                    {function: "sin(x)"}
                )
            );
        }
        this.selectedIndex = 0;
    });
    */
    $('#new-graph').on('click', function() {FunctionGraph.new(worldInstance)})
    $('#new-grid').on('click', function() {InfiniteGrid.new(worldInstance)})
    $('#new-axes').on('click', function() {
        new Axes(worldInstance, {"name":"axes","hidden":false,"delete":false}, {});
    })
    // Initial render
    worldInstance.draw();
});