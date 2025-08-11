
// ================== Main Initialization ================== //
$(function() {
    // Create world and default shapes
    const worldInstance = new World($("#visualization-canvas")[0], []);
    new InfiniteGrid(worldInstance);
    new Axes(worldInstance);
    
    // Bind event listeners
    $("#visualization-canvas")
        .on('mousedown', worldInstance.handleMouseDown)
        .on('mouseup mouseleave', worldInstance.handleMouseUp)
        .on('mousemove', worldInstance.handleMouseMove)
        .on('wheel', worldInstance.handleMouseScroll);
    
    $('#new-graph').on('click', function() {new FunctionGraph(worldInstance)})
    $('#new-grid').on('click', function() {new InfiniteGrid(worldInstance)})
    $('#new-axes').on('click', function() {new Axes(worldInstance)})
    $('#new-transform').on('click', function() {new Transformation(worldInstance)})

    // Initial render
    worldInstance.draw();
});