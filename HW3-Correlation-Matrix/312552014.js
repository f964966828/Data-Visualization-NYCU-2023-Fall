
let data;
const columns = ["Sex", "Length", "Diameter", "Height", "Whole_weight", "Shucked_weight", "Viscera_weight", "Shell_weight", "Rings"];

d3.csv("abalone.data").then(loadedData => {
    const old_columns = loadedData.columns;
    data = loadedData.map(d => {
        for (let i = 0; i  < 9; i++) {
            if (columns[i] == "Sex") {
                d[columns[i]] = d[old_columns[i]]; 
            } else {
                d[columns[i]] = +d[old_columns[i]]; 
            }
            delete d[old_columns[i]];
        }  
        return d;
    })

    const new_data = Object.assign({}, data[0]);
    new_data["Sex"] = old_columns[0];
    for (let i = 1; i < 9; i++) {
        new_data[columns[i]] = +old_columns[i];
    }
    data.unshift(new_data);

    //console.log(data.filter(d => d["Sex"] == "M"));

    plotData();
});

function plotData() {
    // Filter the columns to exclude "Sex"
    const filteredColumns = columns.filter(column => column !== "Sex");

    // Select the HTML container for the correlation matrix
    const container = d3.select("#correlation-matrix");

    // Set the dimensions of the correlation matrix visualization
    const width = 400;
    const height = 400;

    // Create an SVG container
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a color scale for the correlation values
    const colorScale = d3.scaleLinear()
        .domain([-1, 1])
        .range(["red", "green"]);

    // Create a grid of rectangles to represent the correlation matrix
    const cellSize = width / filteredColumns.length;
    const cells = svg.selectAll("rect")
        .data(filteredColumns)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * cellSize)
        .attr("y", (d, j) => j * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", function(d) {
            // Calculate the correlation coefficient between the current column and "Sex"
            const correlationCoefficient = d3.mean(data, row => row[d] * row["Sex"]);
            console.log(correlationCoefficient)
            return colorScale(correlationCoefficient);
        });

    // Add text labels (optional)
    const labels = svg.selectAll("text")
        .data(filteredColumns)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * cellSize + cellSize / 2)
        .attr("y", (d, j) => j * cellSize + cellSize / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .text(d => d); // Display column names
}
