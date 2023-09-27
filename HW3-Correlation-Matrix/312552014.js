
let matrix = {};
const columns = ["Sex", "Length", "Diameter", "Height", "Whole_weight", "Shucked_weight", "Viscera_weight", "Shell_weight", "Rings"];

function correlation(arr1, arr2) {
    let mean1 = arr1.reduce((a, b) => a + b) / arr1.length;
    let mean2 = arr2.reduce((a, b) => a + b) / arr2.length;

    let numerator = arr1.map((v, i) => (v - mean1) * (arr2[i] - mean2)).reduce((a, b) => a + b);
    let denominator = Math.sqrt(arr1.map(v => Math.pow(v - mean1, 2)).reduce((a, b) => a + b)) *
                      Math.sqrt(arr2.map(v => Math.pow(v - mean2, 2)).reduce((a, b) => a + b));
    
    return numerator / denominator;
}

function correlation_matrix(data, sex) {
    let formatData = {};
    data.filter(d => d["Sex"] == sex).forEach(item => {
        for (let key in item) {
            if (key == "Sex") {
                continue;
            }
            if (!formatData[key]) {
                formatData[key] = [item[key]];
            } else {
                formatData[key].push(item[key]);    
            }        
        }
    });

    let keys = Object.keys(formatData);
    return keys.map((key1) => {
        return keys.map((key2) => {
            return correlation(formatData[key1], formatData[key2]);
        });
    });
}

d3.csv("abalone.data").then(data => {
    const old_columns = data.columns;
    data = data.map(d => {
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

    matrix["M"] = correlation_matrix(data, "M");
    matrix["F"] = correlation_matrix(data, "F");
    matrix["I"] = correlation_matrix(data, "I");
    
    plotData();
})

const margin = {top: 60, right: 60, bottom: 60, left: 60},
    width = 520 - margin.left - margin.right,
    height = 520 - margin.top - margin.bottom;

const titles = {
    "M": "Male",
    "F": "Female",
    "I": "Infant"
}

function plotData() {   
    let keys = Object.keys(titles);
    keys.forEach(key => {
        let svg = d3.select("#correlation-matrix").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        plotMatrix(svg, key);
        plotTicks(svg);
        plotColorBar(svg);
    })
}

function plotMatrix(svg, key) {
    let cellSize = width / 8;
    let rows = svg.selectAll(".row")
        .data(matrix[key])
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", (d, i) => "translate(0," + i * cellSize + ")");

    let cells = rows.selectAll(".cell")
        .data(d => d)
        .enter().append("g") 
        .attr("class", "cell")
        .attr("transform", (d, i) => "translate(" + i * cellSize + ",0)");

    cells.append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", d => d3.interpolateRdBu(0.5 - d/2));

    cells.append("text")
        .attr("x", cellSize / 2) 
        .attr("y", cellSize / 2)
        .attr("dy", ".35em") 
        .attr("text-anchor", "middle")  
        .attr("fill", d => (Math.abs(d) > 0.5 ? "white" : "black"))
        .text(d => d.toFixed(2));

    // Add title
    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -20) // Adjust vertical position of the title
        .style("text-anchor", "middle")
        .style("font-size", "40px")
        .text(titles[key]);
}

function plotTicks(svg) {
    // Add x-axis ticks for columns
    let xScale = d3.scaleBand().domain(d3.range(0, 8)).range([0, width]);
    let xAxis = d3.axisTop(xScale).tickSize(0).tickFormat(i => `Attr ${i + 1}`);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .attr("dy", "+1.5em"); // Adjust vertical distance of tick labels from axis line

    // Add y-axis ticks for rows
    let yScale = d3.scaleBand().domain(d3.range(0, 8)).range([0, height]);
    let yAxis = d3.axisLeft(yScale).tickSize(0).tickFormat(i => `Attr ${i + 1}`);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(0,0)`)
        .call(yAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", "16px")
        .attr("dx", "-0.5em"); // Adjust horizontal distance of tick labels from axis line
}

function plotColorBar(svg) {
    // Define the size and position of the colorbar
    let colorbarWidth = 20;
    let colorbarHeight = 350;
    let colorbarX = width + 20; // Adjust position as needed
    let colorbarY = (height - colorbarHeight) / 2;

    // Create scales for the colorbar
    let colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain([1, -1]); // Assuming correlation range is -1 to 1
    let yScale = d3.scaleLinear()
        .domain([1, -1])
        .range([0, colorbarHeight]);

    // Create the colorbar group
    let colorbar = svg.append("g")
        .attr("transform", `translate(${colorbarX},${colorbarY})`);

    // Draw the colorbar
    let numOfGradients = 1000; // number of gradient steps
    colorbar.selectAll("rect")
        .data(d3.range(-1, 1, 2 / numOfGradients))
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", d => yScale(d))
        .attr("width", colorbarWidth)
        .attr("height", colorbarHeight / numOfGradients)
        .attr("fill", d => colorScale(d));
}
