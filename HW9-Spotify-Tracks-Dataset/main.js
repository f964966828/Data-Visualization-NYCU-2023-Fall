
let globalData;
let artists = Array();
let selected_artists = Array();
var artist_region = document.querySelector("div.scrollable-container");

function add_artist(artist) {
    selected_artists.push(artist);
    var div = document.createElement("div");
    div.setAttribute("class", "box");
    div.setAttribute("id", artist + "-box");

    var button = document.createElement("button");
    button.setAttribute("class", "close-button");
    button.innerHTML = "&times;";
    button.addEventListener('click', function () {
        remove_artist(artist);
    })

    var p = document.createElement("p");
    p.innerHTML = artist;

    div.appendChild(button);
    div.appendChild(p);
    artist_region.appendChild(div);

    document.getElementById(artist + "-li").setAttribute("class", "selected");
    update();
}

function remove_artist(artist) {
    selected_artists.splice(selected_artists.indexOf(artist), 1);
    artist_region.removeChild(document.getElementById(artist + "-box"));

    document.getElementById(artist + "-li").setAttribute("class", "unselected");
    update();
}

function init() {
    var addButton = document.getElementById("add-btn");
    var addDropdown = document.getElementById("add-dropdown");
    addButton.addEventListener('click', function () {
        let style = addDropdown.getAttribute("style");
        if (style.includes("none")) {
            addDropdown.setAttribute("style", "display: inline-block;");
        } else {
            addDropdown.setAttribute("style", "display: none;");
        }
    })

    globalData.forEach(d => {
        d['artists'].split(';').forEach(artist => artists.push(artist));
    })
    artists = [...new Set(artists)].sort().slice(1, -1);

    var ul = addDropdown.querySelector("ul");
    artists.forEach(artist => {
        var li = document.createElement("li");
        li.setAttribute("class", "unselected");
        li.setAttribute("id", artist + "-li");
        li.innerHTML = artist;
        li.addEventListener('click', function () {
            let class_ = li.getAttribute("class");
            if (class_.includes("unselected")) {
                add_artist(artist);
            } else {
                remove_artist(artist);
            }
        })
        ul.appendChild(li);
    })

    var searchBox = document.querySelector('input');
    searchBox.addEventListener('input', function (e) {
        var searchText = e.target.value.toLowerCase();
        addDropdown.querySelectorAll("li").forEach(li => {
            var text = li.innerHTML.toLowerCase();
            if (text.includes(searchText)) {
                li.style.display = '';
            } else {
                li.style.display = 'none';
            }
        })
    });

    var resetButton = document.getElementById("reset-btn");
    resetButton.addEventListener('click', function () {
        artist_region.innerHTML = "";
        selected_artists = Array();
        addDropdown.querySelectorAll("li").forEach(li => {
            li.setAttribute("class", "unselected");
        })
        update();
    })

    artists.slice(0, 10).forEach(artist => add_artist(artist));

    update();
}

function update() {
    var data = globalData.filter(d => {
        return d['artists'].split(';').some(artist => selected_artists.includes(artist));
    })

    var artist_count = document.getElementById("artist-count");
    var song_count = document.getElementById("song-count");
    artist_count.innerHTML = `${selected_artists.length} / ${artists.length}`;
    song_count.innerHTML = `${data.length} / ${globalData.length}`;
    d3.select("#brushable-scatterplot").select("svg").remove();
    d3.select("#brushable-scatterplot").select("div").remove();
    d3.select("#pie-chart").select("svg").remove();

    if (data.length != 0) {
        brushable_scatterplot(data);
        pie_chart(data);
    }
}

function brushable_scatterplot(data) {
    // Dimension of the whole chart. Only one size since it has to be square
    var marginWhole = { top: 100, right: 100, bottom: 100, left: 100 },
        sizeWhole = 1800 - marginWhole.left - marginWhole.right

    // Create the svg area
    var svg = d3.select("#brushable-scatterplot")
        .append("svg")
        .attr("width", sizeWhole + marginWhole.left + marginWhole.right)
        .attr("height", sizeWhole + marginWhole.top + marginWhole.bottom)
        .append("g")
        .attr("transform", "translate(" + marginWhole.left + "," + marginWhole.top + ")");

    // What are the numeric variables in this dataset? How many do I have
    var allVar = ['popularity', 'duration_ms', 'danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'];
    var numVar = allVar.length

    // Now I can compute the size of a single chart
    let mar = 20
    let size = sizeWhole / numVar

    // ----------------- //
    // Scales
    // ----------------- //

    // Create a scale: gives the position of each pair each variable
    var position = d3.scalePoint()
        .domain(allVar)
        .range([0, sizeWhole - size])

    // ------------------------------- //
    // Add charts
    // ------------------------------- //
    function getRandomColor() {
        // Generate random values for red, green, and blue components
        const r = Math.floor(Math.random() * 256); // Random number between 0 and 255
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        // Convert the RGB values to hexadecimal format
        const hexR = r.toString(16).padStart(2, "0"); // Convert to hexadecimal and pad with '0' if needed
        const hexG = g.toString(16).padStart(2, "0");
        const hexB = b.toString(16).padStart(2, "0");

        // Combine the components into a hexadecimal color code
        const color = `#${hexR}${hexG}${hexB}`;

        return color;
    }

    // create a tooltip
    var tooltip = d3.select("#brushable-scatterplot")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("width", "300px")
        .style("height", "auto")

    const circle_mouseover = function (event, d) {
        let content = `<ul> <li><strong>artists:</strong> ${d['artists']}</li>`;
        allVar.forEach(var_ => {
            content += `<li><strong>${var_}:</strong> ${d[var_]}</li>`
        })
        content += "</ul>"

        tooltip
            .style("opacity", 1)
            .style("left", (event.pageX - 150) + "px")
            .style("top", (event.pageY + 30) + "px")
            .html(content)
        d3.selectAll("circle[track_id='" + d['track_id'] + "']")
            .attr("r", 5)
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", "3")
    }
    const circle_mouseleave = function (event, d) {
        tooltip
            .style("opacity", 0)
        if (!d3.select(this).classed("active")) {
            d3.selectAll("circle[track_id='" + d['track_id'] + "']")
                .attr("r", 3)
                .style("opacity", 0.5)
                .style("stroke", "none")
        } else {
            d3.selectAll("circle[track_id='" + d['track_id'] + "']")
                .style("stroke", "none")
        }
    }
    const circle_mouseclick = function (event, d) {
        if (d3.select(this).classed("active")) {
            d3.selectAll("circle[track_id='" + d['track_id'] + "']")
                .classed("active", false)
                .attr("r", 3)
                .attr("fill", "#999")
                .style("opacity", 0.5)
        } else {
            d3.selectAll("circle[track_id='" + d['track_id'] + "']")
                .classed("active", true)
                .attr("r", 5)
                .attr("fill", getRandomColor())
                .style("stroke-width", "3")
                .style("opacity", 1)
        }
    }

    for (let i in allVar) {
        for (let j in allVar) {

            // Get current variable name
            var var1 = allVar[i]
            var var2 = allVar[j]

            // If var1 == var2 i'm on the diagonal, I skip that
            if (var1 === var2) { continue; }

            // Add X Scale of each graph
            let xextent = d3.extent(data, function (d) { return +d[var1] })
            var x = d3.scaleLinear()
                .domain(xextent).nice()
                .range([0, size - 2 * mar]);

            // Add Y Scale of each graph
            let yextent = d3.extent(data, function (d) { return +d[var2] })
            var y = d3.scaleLinear()
                .domain(yextent).nice()
                .range([size - 2 * mar, 0]);

            // Add a 'g' at the right position
            var tmp = svg
                .append('g')
                .attr("transform", "translate(" + (position(var1) + mar) + "," + (position(var2) + mar) + ")");

            // Add X and Y axis in tmp
            tmp.append("g")
                .attr("transform", "translate(" + 0 + "," + (size - mar * 2) + ")")
                .call(d3.axisBottom(x).ticks(3));
            tmp.append("g")
                .call(d3.axisLeft(y).ticks(3));

            // Add circle
            tmp
                .selectAll("myCircles")
                .data(data)
                .enter()
                .append("circle")
                .attr("track_id", function (d) { return d['track_id'] })
                .attr("cx", function (d) { return x(+d[var1]) })
                .attr("cy", function (d) { return y(+d[var2]) })
                .attr("r", 3)
                .attr("fill", "#999")
                .style("opacity", 0.5)
                .on("mouseover", circle_mouseover)
                .on("mouseleave", circle_mouseleave)
                .on("click", circle_mouseclick)
        }
    }

    // ------------------------------- //
    // Add histograms = diagonal
    // ------------------------------- //
    for (let i in allVar) {
        for (let j in allVar) {

            // variable names
            var var1 = allVar[i]
            var var2 = allVar[j]

            // If var1 == var2 i'm on the diagonal, otherwisee I skip
            if (i != j) { continue; }

            // create X Scale
            let xextent = d3.extent(data, function (d) { return +d[var1] })
            var x = d3.scaleLinear()
                .domain(xextent).nice()
                .range([0, size - 2 * mar]);

            // Add a 'g' at the right position
            var tmp = svg
                .append('g')
                .attr("transform", "translate(" + (position(var1) + mar) + "," + (position(var2) + mar) + ")");

            // Add x axis
            tmp.append("g")
                .attr("transform", "translate(" + 0 + "," + (size - mar * 2) + ")")
                .call(d3.axisBottom(x).ticks(3));

            // set the parameters for the histogram
            var histogram = d3.histogram()
                .value(function (d) { return +d[var1]; })   // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(x.ticks(15)); // then the numbers of bins

            // And apply this function to data to get the bins
            var bins = histogram(data);

            // Y axis: scale and draw:
            var y = d3.scaleLinear()
                .range([size - 2 * mar, 0])
                .domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously

            // append the bar rectangles to the svg element
            tmp.append('g')
                .selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
                .attr("width", function (d) { return x(d.x1) - x(d.x0); })
                .attr("height", function (d) { return (size - 2 * mar) - y(d.length); })
                .style("fill", "#999")
                .attr("stroke", "white")
        }
    }
}

function pie_chart(data) {
    // Dimension of the whole chart. Only one size since it has to be square
    var margin = 50,
        width = 1800 - margin * 2,
        height = 600 - margin * 2

    const radius = Math.min(width / 4, height) / 2 - margin * 2;

    const svg = d3.select("#pie-chart")
        .append("svg")
        .attr("width", width + margin * 2)
        .attr("height", height + margin * 2)
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")");

    const columns = ["key", "mode", "time_signature", "track_genre"];
    const color = d3.scaleOrdinal().range(d3.schemeSet3);

    const pie = d3.pie().value(function (d) { return d[1]; });

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    for (let i = 0; i < 4; i++) {
        const column = columns[i];
        let pie_data = {};
        data.forEach(d => {
            let value = d[column];
            pie_data[String(value)] = (pie_data[String(value)] || 0) + 1;
        });
        pie_data = pie(Object.entries(pie_data));

        const pieGroup = svg.append("g")
            .attr("transform", `translate(${radius + margin * 4 + (width / 5 * i)}, ${height / 4 + margin})`);

        pieGroup.selectAll('path')
            .data(pie_data)
            .join('path')
            .attr('d', arcGenerator)
            .attr('fill', d => color(d.data[0]))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.9);

        pieGroup.selectAll('text')
            .data(pie_data)
            .join('text')
            .text(d => d.data[0])
            .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
            .style("text-anchor", "middle")
            .style("font-size", "15px")
            .style("fill", "#333");

        pieGroup.append("text")
            .attr("x", -10)
            .attr("y", -height / 2 + margin)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("fill", "#333333")
            .text(column);
    }
}


d3.csv("dataset.csv").then(function (data) {
    globalData = data;
    init();
})
