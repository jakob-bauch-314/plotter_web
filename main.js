
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
    
    $('#new-graph').on('click', function() {FunctionGraph.new(worldInstance)})
    $('#new-grid').on('click', function() {InfiniteGrid.new(worldInstance)})
    $('#new-axes').on('click', function() {Axes.new(worldInstance)})
    $('#new-transform').on('click', function() {Transformation.new(worldInstance)})

    // Initial render
    worldInstance.draw();
});