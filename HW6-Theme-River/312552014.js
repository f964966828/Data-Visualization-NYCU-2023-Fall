
// set the dimensions and margins of the graph
const margin = {top: 50, right: 60, bottom: 30, left: 50},
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

//d3.csv("ma_lga_12345.csv").then(function(data) {
d3.csv("http://vis.lab.djosix.com:2023/data/ma_lga_12345.csv").then(function(data) {
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
  console.log(riverData.map(d => d.date));
  // Add X axis
  const x = d3.scaleUtc()
    .domain(d3.extent(riverData, d => new Date(d.date)))
    .range([0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSize(-height*.7))
    .select(".domain").remove()
  // Customization
  svg.selectAll(".tick line").attr("stroke", "#b8b8b8")
  // Add X axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("font-size", "20px")
      .attr("x", width + 60)
      .attr("y", height + 10)
      .text("Time (year)");

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

  // Area generator
  const area = d3.area()
    .x(function(d) { return x(new Date(d.data.date)); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })

  // create a tooltip
  var tooltip = d3.select("#theme-river")
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

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = function(event, d) {
    tooltip.style("opacity", 1)
    d3.selectAll(".myArea").style("opacity", .2)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  var mousemove = function(event, d) {
    let index = Math.round((event.pageX - 70) / 1090 * riverData.length);
    index = Math.min(index, riverData.length - 1);
    let key = d3.select(this).attr("key");
    tooltip
      .style("left", (event.pageX-120) + "px")
      .style("top", (event.pageY-750) + "px")
      .html(`
        <label>${key}</label><br>
        Date: ${riverData[index].date}<br>
        MA: ${riverData[index][key]}
      `)
    console.log(riverData[index][key]);
  }
  var mouseleave = function(event, d) {
    tooltip.style("opacity", 0)
    d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
  }

  // Show the areas
  svg
    .selectAll("mylayers")
    .data(stackedData)
    .join("path")
      .attr("class", "myArea")
      .attr("d", area)
      .attr("key", function(d) { return d.key; })
      .style("fill", function(d) { return color(d.key); })
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)

  // Legend settings
  const legendCircleRadius = 10;  
  const legendSpacing = 150;    
  const legendYOffset = -20;     

  const legendXStart = 30;
  const legend = svg.selectAll('.legend') 
      .data(color.domain())
      .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${legendXStart + i * (legendCircleRadius * 2 + legendSpacing)}, ${legendYOffset})`)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle');

  legend.append('circle')
      .attr('r', legendCircleRadius)
      .style('fill', color)
      .style('stroke', color);

  legend.append('text')
      .attr('y', legendCircleRadius + 15) 
      .attr('dy', '0.35em')
      .attr('font-size', '15px')
      .text(d => d);
})
