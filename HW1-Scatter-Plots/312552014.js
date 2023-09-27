
// Add event listener on buttons
document.querySelectorAll(".toggle-button").forEach(button => {
    button.addEventListener("click", function() {
        // Find the parent group of the clicked button
        let parentGroup = this.parentElement
        
        // Cancel all active buttons within the same group
        parentGroup.querySelectorAll(".toggle-button.active").forEach(activeButton => {
            activeButton.classList.remove("active");
        });

        // Activate the clicked button
        this.classList.add("active");
        
        updatePlot();
    });
});

// Set SVG dimensions
const margin = {top: 30, right: 150, bottom: 30, left: 30},
      width = 620 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create SVG element and set its size
const svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Create a scaleOrdinal object to map class names to colors
const color = d3.scaleOrdinal()
    .domain(['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'])
    .range(['#FF0000', '#00FF00', '#0000FF']);

// Create a legend
const legend = svg.selectAll(".legend")
    .data(color.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

legend.append("rect")
    .attr("x", width + 10)
    .attr("y", 20)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

legend.append("text")
    .attr("x", width + 30)
    .attr("y", 29)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(d => d);

let data;
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxis = svg.append("g");

// Load and process the data
//d3.csv("iris.csv").then(loadedData => {
d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv").then(loadedData => {
    const columns = ["sepal length", "sepal width", "petal length", "petal width"];
    data = loadedData.map(d => {
        d["sepal length"] = +d["sepal length"];
        d["sepal width"] = +d["sepal width"];
        d["petal length"] = +d["petal length"];
        d["petal width"] = +d["petal width"];
        return d;
    }).filter(d => 
        !columns.every(column => d[column] == 0)
    );

    plotData();
});

function plotData() {
    const xAttribute = d3.select(".X-attribute-group .toggle-button.active").text().toLowerCase();
    const yAttribute = d3.select(".Y-attribute-group .toggle-button.active").text().toLowerCase();

    x.domain([d3.min(data, d => d[xAttribute]), d3.max(data, d => d[xAttribute])]);
    y.domain([d3.min(data, d => d[yAttribute]), d3.max(data, d => d[yAttribute])]);

    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y));

    svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d[xAttribute]))
        .attr("cy", d => y(d[yAttribute]))
        .attr("r", 3.5)
        .style("fill", d => color(d.class));
}

function updatePlot() {
    svg.selectAll("circle").remove();  // Clear previous dots
    plotData();
}
