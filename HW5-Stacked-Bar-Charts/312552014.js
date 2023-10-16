// Dimension of the whole chart. Only one size since it has to be square
const marginWhole = {top: 10, right: 10, bottom: 10, left: 10},
    sizeWhole = 800 - marginWhole.left - marginWhole.right

// Create the svg area
const svg = d3.select("#stacked-bar-chart")
    .append("svg")
        .attr("width", sizeWhole  + marginWhole.left + marginWhole.right)
        .attr("height", sizeWhole  + marginWhole.top + marginWhole.bottom)
    .append("g")
        .attr("transform", `translate(${marginWhole.left},${marginWhole.top})`);