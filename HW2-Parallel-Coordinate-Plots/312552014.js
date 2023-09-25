
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

// Set SVG columns
const margin = {top: 30, right: 150, bottom: 30, left: 70},
      width = 820 - margin.left - margin.right,
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
let columns = ["sepal length", "sepal width", "petal length", "petal width"]

//d3.csv("iris.csv").then(loadedData => {
d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv").then(loadedData => {
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
    const attr1 = d3.select(".attribute1-group .toggle-button.active").text().toLowerCase();
    const attr2 = d3.select(".attribute2-group .toggle-button.active").text().toLowerCase();
    const attr3 = d3.select(".attribute3-group .toggle-button.active").text().toLowerCase();
    const attr4 = d3.select(".attribute4-group .toggle-button.active").text().toLowerCase();
    columns = [attr1, attr2, attr3, attr4];

    // 为每个维度创建一个缩放比例
    const y = {};
    for (let i in columns) {
        let name = columns[i];
        y[name] = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[name]))
            .range([height, 0]);
    }

    // 创建路径生成器
    function path(d) {
        return d3.line()(columns.map(p => [x(p), y[p](d[p])]));
    }

    // 为每个维度创建一个x轴的位置
    const x = d3.scalePoint()
        .range([0, width])
        .domain(columns);

    // 渲染路径
    svg.selectAll("myPath")
        .data(data)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", d => color(d.class))
        .style("opacity", 0.5)
        .on("mouseover", function() {
            d3.select(this).style("opacity", 1).style("stroke-width", "4px");
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 0.5).style("stroke-width", "1px");
        });

    // 渲染轴
    svg.selectAll("myAxis")
        .data(columns).enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", d => "translate(" + x(d) + ")")
        .each(function(d) { d3.select(this).call(d3.axisLeft(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(d => d)
        .style("font-size", "20px")
        .style("fill", "black");
}

function updatePlot() {
    svg.selectAll("path").remove(); 
    svg.selectAll(".axis").remove();
    plotData();
}

