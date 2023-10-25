
// Add event listener on buttons
document.querySelectorAll(".toggle-button").forEach(button => {
    button.addEventListener("click", function () {
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

let map = {};
let dates = [];
let data = [];
let tooltip = undefined;
let pollutions = ['SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM2.5'];
let scheme = {
    'SO2': d3.schemeBlues,
    'NO2': d3.schemeGreens,
    'O3': d3.schemeOranges,
    'CO': d3.schemePurples,
    'PM10': d3.schemeReds,
    'PM2.5': d3.shemeGreys,
};
d3.csv("air-pollution.csv").then(function (rawData) {
    let uniqueDistricts = new Set();
    let districts = rawData.map(d => {
        let obj = {
            'Station code': d['Station code'],
            'Address': d['Address'],
            'Latitude': d['Latitude'],
            'Longitude': d['Longitude']
        };
        return obj;
    }).filter(d => {
        const key = JSON.stringify(d);
        if (!uniqueDistricts.has(key)) {
            uniqueDistricts.add(key);
            return true;
        }
        return false;
    });
    dates = [... new Set(rawData.map(d => d['Measurement date'].split(' ')[0]))];

    districts.forEach(district => {
        let code = district['Station code'];
        map[code] = {};
        dates.forEach(date => {
            let obj = { ...district };
            obj['date'] = date;
            obj['count'] = 0;
            pollutions.forEach(p => obj[p] = obj[p + '_count'] = 0);
            map[code][date] = obj;
        })
    })

    rawData.forEach((d, i) => {
        let code = d['Station code'];
        let date = d['Measurement date'].split(' ')[0];
        pollutions.forEach(p => {
            if (d[p] != "-1.0") {
                map[code][date][p] += +d[p];
                map[code][date][p + '_count'] += 1;
            }
        })
    })

    districts.forEach(district => {
        let code = district['Station code'];
        dates.forEach(date => {
            pollutions.forEach(p => {
                let count = map[code][date][p + '_count'];
                if (count != 0) {
                    map[code][date][p] /= count;
                }
                map[code][date][p + '_src'] = map[code][date][p];
            });
            data.push(map[code][date]);
        })
    })

    pollutions.forEach(p => {
        let mu = d3.mean(data, d => d[p]);
        let sigma = d3.deviation(data, d => d[p]);
        let mx = d3.max(data, d => (d[p] - mu) / sigma);
        let mn = d3.min(data, d => (d[p] - mu) / sigma);
        while (Math.abs(Math.abs(mx) - Math.abs(mn)) > 2) {
            data = data.map(d => {
                d[p] = Math.log2(d[p] + 1);
                return d;
            })
            mu = d3.mean(data, d => d[p]);
            sigma = d3.deviation(data, d => d[p]);
            mx = d3.max(data, d => (d[p] - mu) / sigma);
            mn = d3.min(data, d => (d[p] - mu) / sigma);
        }
    })

    updatePlot();
})

function updatePlot() {
    document.getElementById('horizon-chart').innerHTML = '';

    const year = d3.select(".year-button .toggle-button.active").text();
    const bands = d3.select(".band-button .toggle-button.active").text();
    pollutions.forEach(p => {
        let chart = HorizonChart(data.filter(d => d['date'].split('-')[0] == year), {
            x: d => new Date(d['date']),
            y: d => d[p],
            z: d => d['Station code'],
            scheme: scheme[p],
            marginTop: 70,
            marginBottom: 30,
            marginLeft: 50,
            marginRight: 50,
            size: 20,
            width: 1500,
            bands: +bands,
            title: p,
        });

        // Append the generated SVG to the container
        document.getElementById('horizon-chart').appendChild(chart);
    })

    tooltip = d3.select("#horizon-chart")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "fixed")
        .style("width", "350px")
        .style("height", "auto")
}

var mouseover = function (event, d) {
    tooltip.style("opacity", 1);
    d3.select(this)
      .style("stroke", "black")
}
var mousemove = function (event, d) {
    let code = d[0];

    const year = d3.select(".year-button .toggle-button.active").text();
    let year_dates = dates.filter(date => date.split('-')[0] == year);
    let index = Math.floor((event.pageX - 70) / 1400 * year_dates.length);
    let date = year_dates[index];
    tooltip
        .style("left", (event.x - 100) + "px")
        .style("top", (event.y + 30) + "px")
        .html(`
            <label class="tooltip-label">${map[code][date]['Address']}</label><br>
            Station code: ${map[code][date]['Station code']}<br>
            Latitude: ${map[code][date]['Latitude']}<br>
            Longitude: ${map[code][date]['Longitude']}<br>
            Date: ${map[code][date]['date']}<br>
            SO2: ${map[code][date]['SO2_src']}<br>
            NO2: ${map[code][date]['NO2_src']}<br>
            O3: ${map[code][date]['O3_src']}<br>
            CO: ${map[code][date]['CO_src']}<br>
            PM10: ${map[code][date]['PM10_src']}<br>
            PM2.5: ${map[code][date]['PM2.5_src']}<br>
        `)
}
var mouseleave = function (event, d) {
    tooltip.style("opacity", 0)
    d3.select(this)
        .style("stroke", "none")
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/horizon-chart
function HorizonChart(data, {
    x = ([x]) => x, // given d in data, returns the (temporal) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    z = () => 1, // given d in data, returns the (categorical) z-value
    defined, // for gaps in data
    curve = d3.curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 0, // right margin, in pixels
    marginBottom = 0, // bottom margin, in pixels
    marginLeft = 0, // left margin, in pixels
    width = 640, // outer width, in pixels
    size = 25, // outer height of a single horizon, in pixels
    bands = 3, // number of bands
    padding = 1, // separation between adjacent horizons
    xType = d3.scaleUtc, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [size, size - bands * (size - padding)], // [bottom, top]
    zDomain, // array of z-values
    scheme = d3.schemeGreys, // color scheme; shorthand for colors
    colors = scheme[Math.max(3, bands)], // an array of colors
    title = "Title",
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const Z = d3.map(data, z);
    if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
    const D = d3.map(data, defined);
    // Compute default domains, and unique the z-domain.
    if (xDomain === undefined) xDomain = d3.extent(X);
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];
    if (zDomain === undefined) zDomain = Z;
    zDomain = new d3.InternSet(zDomain);

    // Omit any data not present in the z-domain.
    const I = d3.range(X.length).filter(i => zDomain.has(Z[i]));

    // Compute height.
    const height = zDomain.size * size + marginTop + marginBottom;

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisTop(xScale).ticks(width / 80).tickSizeOuter(0);

    // A unique identifier for clip paths (to avoid conflicts).
    const uid = `O-${Math.random().toString(16).slice(2)}`;

    // Construct an area generator.
    const area = d3.area()
        .defined(i => D[i])
        .curve(curve)
        .x(i => xScale(X[i]))
        .y0(yScale(0))
        .y1(i => yScale(Y[i]));

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

    // Append the title to the SVG
    svg.append("text")
        .attr("x", width / 2)  // position the title in the center of the SVG
        .attr("y", 30)         // position the title 20 pixels from the top
        .attr("text-anchor", "middle")  // ensure the text is centered
        .attr("font-weight", "bold")    // make the title bold
        .attr("font-size", "30px")
        .text(title);

    const g = svg.selectAll("g")
        .data(d3.group(I, i => Z[i]))
        .join("g")
        .attr("transform", (_, i) => `translate(0,${i * size + marginTop})`);

    const defs = g.append("defs");

    defs.append("clipPath")
        .attr("id", (_, i) => `${uid}-clip-${i}`)
        .append("rect")
        .attr("y", padding)
        .attr("width", width)
        .attr("height", size - padding);

    defs.append("path")
        .attr("id", (_, i) => `${uid}-path-${i}`)
        .attr("d", ([, I]) => area(I))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    g
        .attr("clip-path", (_, i) => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
        .selectAll("use")
        .data((d, i) => new Array(bands).fill(i))
        .join("use")
        .attr("fill", (_, i) => colors[i + Math.max(0, 3 - bands)])
        .attr("transform", (_, i) => `translate(0,${i * size})`)
        .attr("xlink:href", (i) => `${new URL(`#${uid}-path-${i}`, location)}`);

    g.append("text")
        .attr("x", marginLeft - 30)
        .attr("y", (size + padding) / 2)
        .attr("dy", "0.35em")
        .text(([z]) => z);

    // Since there are normally no left or right margins, don’t show ticks that
    // are close to the edge of the chart, as these ticks are likely to be clipped.
    svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(xAxis)
        .call(g => g.selectAll(".tick")
            .filter(d => xScale(d) < 10 || xScale(d) > width - 10)
            .remove())
        .call(g => g.select(".domain").remove());

    return svg.node();
}
