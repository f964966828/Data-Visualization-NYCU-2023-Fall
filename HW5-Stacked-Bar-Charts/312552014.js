
// Add event listener on buttons
document.querySelectorAll(".toggle-button").forEach(button => {
    button.addEventListener("click", function() {
        // Find the parent group of the clicked button
        let parentGroup = this.parentElement.parentElement
        
        // Cancel all active buttons within the same group
        parentGroup.querySelectorAll(".toggle-button.active").forEach(activeButton => {
            activeButton.classList.remove("active");
        });

        // Activate the clicked button
        this.classList.add("active");
        
        updatePlot();
    });
});

var svgWidth = 1500, svgHeight = 40000;
var margin = {top: 100, right: 30, bottom: 30, left: 300};
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create the svg area
const svg = d3.select("#stacked-bar-chart")
    .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// create a tooltip
var tooltip = d3.select("#stacked-bar-chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "relative")
    .style("width", "200px")
    .style("height", "auto")

var data;

function plotLegend(z) {
    // Legend settings
    const legendCircleRadius = 10;  
    const legendSpacing = 200;    
    const legendYOffset = -50;     

    const legendXStart = (width - (5 * (legendCircleRadius * 2 + legendSpacing) - legendSpacing)) / 2;
    const legend = svg.selectAll('.legend') 
        .data(z.domain())
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${legendXStart + i * (legendCircleRadius * 2 + legendSpacing)}, ${legendYOffset})`)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle');

    legend.append('circle')
        .attr('r', legendCircleRadius)
        .style('fill', z)
        .style('stroke', z);

    legend.append('text')
        .attr('y', legendCircleRadius + 15) 
        .attr('dy', '0.35em')
        .attr('font-size', '15px')
        .text(d => d);
}

function updatePlot() {
    svg.selectAll("*").remove(); 

    const sort_order = d3.select(".toggle-button.active").node().parentNode.getAttribute("attr");
    const attr = d3.select(".toggle-button.active").attr("attr");
    
    if (sort_order == "asc") {
        data.sort((a, b) => a[attr] - b[attr]);
    } else if (sort_order == "desc") {
        data.sort((a, b) => b[attr] - a[attr]);
    }

    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([0, height]).padding(0.1);
    var z = d3.scaleOrdinal(d3.schemeCategory10);  // Color scheme

    const keys = ["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"];
    const stack = d3.stack().keys(keys)(data);
    
    x.domain([0, d3.max(stack, d => d3.max(d, d => d[1]))]).nice();
    y.domain(data.map(d => d.name));
    z.domain(keys);

    const mouseover = function(event, d) {
        let name = d.data.name;
        currentData = data.filter(d => d.name == name)[0];
        
        tooltip
            .style("opacity", 1)
            .html(`
                <label>${currentData.name}</label><br>
                Rank: ${currentData.rank}<br>
                Overall: ${currentData.scores_overall}<br>
                Teaching: ${currentData.scores_teaching}<br>
                Citations: ${currentData.scores_citations}<br>
                Industry: ${currentData.scores_industry_income}<br>
                International: ${currentData.scores_international_outlook}
            `)

        d3.select(this)
            .style("stroke", "black")
    }
    const mousemove = function(event, d) {
        tooltip
            .style("left", (event.pageX-100) + "px")
            .style("top", (event.pageY-40250) + "px")
    }
    const mouseleave = function(event, d) {
        tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
    }

    svg.selectAll("g")
        .data(stack)
        .enter().append("g")
        .attr("fill", d => z(d.key))
        .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("y", d => y(d.data.name))
            .attr("x", d => x(d[0]))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d[1]) - x(d[0]))
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
        
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))       

    plotLegend(z);
}

d3.csv("TIMES_WorldUniversityRankings_2024.csv").then( function(loadedData) {
    data = loadedData
        .filter(d => d['scores_overall'] != 'n/a')
        .map((d, index) => {
            d.index = -index;
            return d;
        });

    updatePlot();
})
        