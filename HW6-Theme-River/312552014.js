
// set the dimensions and margins of the graph
const margin = {top: 20, right: 30, bottom: 0, left: 10},
    width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#theme-river")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

function dmy_to_ymd(date) {
  let parts = date.split("/");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

d3.csv("ma_lga_12345.csv").then(function(data) {
  data = data.map(d => {
    d['saledate'] = dmy_to_ymd(d['saledate']);
    d['type'] = d['type'] + "_" + d['bedrooms'];
    d['MA'] = +d['MA'];
    delete d['bedrooms'];
    return d;
  })
  
  let saledates = data.map(d => d['saledate']);
  saledates = [...new Set(saledates)];
  saledates.sort((a, b) => a.localeCompare(b));

  const keys = [...new Set(data.map(d => d['type']))]
  let riverData = [];
  saledates.forEach(date => {
    d = {'date': date};
    keys.forEach(key => d[key] = 0);
    riverData.push(d)
  })

  data.forEach(d => {
    let index = saledates.indexOf(d['saledate']);
    riverData[index][d['type']] += d['MA'];
  })
  riverData = riverData.filter(obj => !Object.values(obj).some(val => val === 0));

  // Add X axis
  const x = d3.scaleUtc()
    .domain(d3.extent(riverData, d => new Date(d.date)))
    .range([0, width]);

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([-2500000, 2500000])
    .range([ height, 0 ]);

  // color palette
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeDark2);

  //stack the data
  const stackedData = d3.stack()
    .offset(d3.stackOffsetSilhouette)
    .keys(keys)
    (riverData);
  //console.log(keys, riverData[0], stackedData[0]);

  // Area generator
  const area = d3.area()
    .x(function(d) { return x(new Date(d.data.date)); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })

  // create a tooltip
  var Tooltip = svg
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .style("opacity", 0)
    .style("font-size", 17)

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = function(event, d) {
    console.log(d);
    Tooltip.style("opacity", 1)
    d3.selectAll(".myArea").style("opacity", .2)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  var mouseleave = function(event, d) {
    Tooltip.style("opacity", 0)
    d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
   }

  // Show the areas
  svg
    .selectAll("mylayers")
    .data(stackedData)
    .join("path")
      .attr("class", "myArea")
      .style("fill", function(d) { return color(d.key); })
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mouseleave", mouseleave)
})
