// Dimension of the whole chart. Only one size since it has to be square
const marginWhole = {top: 10, right: 10, bottom: 10, left: 10},
    sizeWhole = 800 - marginWhole.left - marginWhole.right

// Create the svg area
const svg = d3.select("#scatter-plot-matrix")
    .append("svg")
        .attr("width", sizeWhole  + marginWhole.left + marginWhole.right)
        .attr("height", sizeWhole  + marginWhole.top + marginWhole.bottom)
    .append("g")
        .attr("transform", `translate(${marginWhole.left},${marginWhole.top})`);

//d3.csv("iris.csv").then( function(data) {
d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv").then( function(data) {
    data = data.filter(d => d.class != '')
    for (let i=0; i<data.length; i++) {
        data[i].id = i;
    }

    // What are the numeric variables in this dataset? How many do I have
    const allVar = ["sepal length", "sepal width", "petal length", "petal width"]
    const numVar = allVar.length

    // Now I can compute the size of a single chart
    mar = 20
    size = sizeWhole / numVar


    // ----------------- //
    // Scales
    // ----------------- //

    // Create a scale: gives the position of each pair each variable
    const position = d3.scalePoint()
        .domain(allVar)
        .range([0, sizeWhole-size])

    // Color scale: give me a specie name, I return a color
    const color = d3.scaleOrdinal()
        .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica" ])
        .range([ "#3498CB", "#D18975", "#8FD175"])

    // create a tooltip
    var tooltip = d3.select("#scatter-plot-matrix")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "relative")
        .style("width", "150px")
        .style("height", "auto")


    // ------------------------------- //
    // Add charts
    // ------------------------------- //
    for (i in allVar){
        for (j in allVar){

        // Get current variable name
        let var1 = allVar[i]
        let var2 = allVar[j]

        // If var1 == var2 i'm on the diagonal, I skip that
        if (var1 === var2) { continue; }

        // Add X Scale of each graph
        xextent = d3.extent(data, function(d) { return +d[var1] })
        const x = d3.scaleLinear()
            .domain(xextent).nice()
            .range([ 0, size-2*mar ]);

        // Add Y Scale of each graph
        yextent = d3.extent(data, function(d) { return +d[var2] })
        const y = d3.scaleLinear()
            .domain(yextent).nice()
            .range([ size-2*mar, 0 ]);

        // Add a 'g' at the right position
        const tmp = svg
            .append('g')
            .attr("transform", `translate(${position(var1)+mar},${position(var2)+mar})`);

        // Add X and Y axis in tmp
        tmp.append("g")
            .attr("transform", `translate(0,${size-mar*2})`)
            .call(d3.axisBottom(x).ticks(3));
        tmp.append("g")
            .call(d3.axisLeft(y).ticks(3));

        const mouseover = function(event, d) {
            tooltip
                .style("opacity", 1)
                .style("left", (event.pageX-100) + "px")
                .style("top", (event.pageY-1120) + "px")
                .html(`
                    class: ${d['class']}<br>
                    sepal length: ${d['sepal length']}<br>
                    sepal width: ${d['sepal width']}<br>
                    petal length: ${d['petal length']}<br>
                    petal width: ${d['petal width']}
                `)
            d3.selectAll("circle[data-id='" + d.id + "']")
                .attr("r", 5)
                .style("stroke", "black")
                .style("stroke-width", "3")
                .style("opacity", 1)
        }
        const mouseleave = function(event, d) {
            tooltip
                .style("opacity", 0)
            
            const isActive = d3.select(this).classed("active");
            if (isActive) {
                d3.selectAll("circle[data-id='" + d.id + "']")
                    .classed("active", true)
                    .attr("r", 5)
                    .style("stroke", "orange")
                    .style("stroke-width", "3")
                    .style("opacity", 1)
            } else {
                d3.selectAll("circle[data-id='" + d.id + "']")
                    .attr("r", 2.5)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
            }
        }
        const toggleClick = function(event, d) {
            const isActive = d3.select(this).classed("active");
            if (isActive) {
                d3.selectAll("circle[data-id='" + d.id + "']")
                    .classed("active", false)
                    .attr("r", 2.5)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
            } else {
                d3.selectAll("circle[data-id='" + d.id + "']")
                    .classed("active", true)
                    .attr("r", 5)
                    .style("stroke", "orange")
                    .style("stroke-width", "3")
                    .style("opacity", 1)
            }
        }

        // Add circle
        tmp
            .selectAll("myCircles")
            .data(data)
            .join("circle")
            .attr("data-id", function(d) { return d.id })
            .attr("cx", function(d){ return x(+d[var1]) })
            .attr("cy", function(d){ return y(+d[var2]) })
            .attr("r", 2.5)
            .style("opacity", 0.8)
            .attr("fill", function(d){ return color(d.class) })
            .on("mouseover", mouseover)
            .on("mouseleave", mouseleave)
            .on("click", toggleClick)
        }
    }


    // ------------------------------- //
    // Add histograms = diagonal
    // ------------------------------- //
    for (i in allVar){
        for (j in allVar){

        // variable names
        let var1 = allVar[i]
        let var2 = allVar[j]

        // If var1 == var2 i'm on the diagonal, otherwisee I skip
        if (i != j) { continue; }

        // create X Scale
        xextent = d3.extent(data, function(d) { return +d[var1] })
        const x = d3.scaleLinear()
            .domain(xextent).nice()
            .range([ 0, size-2*mar ]);

        // Add a 'g' at the right position
        const tmp = svg
            .append('g')
            .attr("transform", `translate(${position(var1)+mar},${position(var2)+mar})`);

        // Add x axis
        tmp.append("g")
            .attr("transform", `translate(0,${size-mar*2})`)
            .call(d3.axisBottom(x).ticks(3));

        // set the parameters for the histogram
        const histogram = d3.histogram()
            .value(function(d) { return +d[var1]; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(15)); // then the numbers of bins

        // And apply this function to data to get the bins
        const bins = histogram(data);

        // Y axis: scale and draw:
        const y = d3.scaleLinear()
                .range([ size-2*mar, 0 ])
                .domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously

        // append the bar rectangles to the svg element
        tmp.append('g')
            .selectAll("rect")
            .data(bins)
            .join("rect")
                .attr("x", 1)
                .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
                .attr("width", function(d) { return x(d.x1) - x(d.x0)  ; })
                .attr("height", function(d) { return (size-2*mar) - y(d.length); })
                .style("fill", "#b8b8b8")
                .attr("stroke", "white")
        }
    }
})
