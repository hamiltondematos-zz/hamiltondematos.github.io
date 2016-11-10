var color = d3.scale.category20c();

var totalSize = 0;
var b = {
    w: 140, h: 30, s: 3, t: 10
};

var width = 700,
        sequenceWidth = 800;
height = width,
        radius = width / 2,
        x = d3.scale.linear().range([0, 2 * Math.PI]),
        y = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, radius]),
        padding = 5,
        duration = 1000;

var nodes;
var startIndexToShow = 0;
var endIndexToShow = 1;
var loadedJSON;
var fullJSON;
var path;
var text;
var textEnter;

var marginTopFirstFilterButton = 40;
var firstSliceFilterButton = 0;
var secondSliceFilterButton = 1;

loadJSON(startIndexToShow, endIndexToShow);



function loadJSON() {
    var filterButtons = d3.select("#filterButtons");

    var margin = marginTopFirstFilterButton - 30;
    filterButtons.append("div")
            .attr("class", "carteirasTitle")
            .style("margin-left", "950px")
            .style("margin-top", margin + "px")
            .style("font-weight", "normal")
            .style("position", "fixed")
            .text("Carteiras");
    ;

    d3.json("scripts/d3/carteiras.json", function (error, json) {
        loadedJSON = json;
        fullJSON = json;

        fullJSON.forEach(function (d) {
            filterButtons.append("div")
                    .text(d.name)
                    .attr("class", "filterButtons")
                    .attr("onclick", "filtraCarteiras(" + firstSliceFilterButton + "," + secondSliceFilterButton + ")")
                    .style("position", "fixed")
                    .style("margin-top", marginTopFirstFilterButton + "px")
                    .style("margin-left", "950px")
                    .style("background-color", color(d.name))
                    .style("border", "0px")
                    .style("height", "50px")
                    .style("width", "200px")
                    .style("cursor", "pointer")
                    .style("color", brightness(d3.rgb(color(d.name))) < 125 ? "#eee" : "#000")
                    ;

            marginTopFirstFilterButton += 60;
            firstSliceFilterButton++;
            secondSliceFilterButton++;
        });


        updateVisualization(startIndexToShow, endIndexToShow);
    });


}
;

var div = d3.select("#vis");

var vis;
var arc;

function updateVisualization(startIndexToShow, endIndexToShow) {

    vis = div.append("svg")
            .attr("width", width + padding * 2)
            .attr("height", height + padding * 2)
            .attr("id", "container")
            .append("g")
            .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");


// Define the div for the tooltip
    //var div2 = d3.select("body").append("div")
    //         .attr("class", "tooltip")
    //       .style("opacity", 0);

    div.select("img").remove();

    //div.remove("svg");



    var partition = d3.layout.partition()
            .sort(null)
            .value(function (d) {
                return  d.size;
            });

    arc = d3.svg.arc()
            .startAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
            })
            .endAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
            })
            .innerRadius(function (d) {
                return Math.max(0, d.y ? y(d.y) : d.y);
            })
            .outerRadius(function (d) {
                return Math.max(0, y(d.y + d.dy));
            });


    initializeBreadcrumbTrail();

    loadedJSON = fullJSON;
    loadedJSON = loadedJSON.slice(startIndexToShow, endIndexToShow);

    nodes = partition.nodes(
            {
                children: loadedJSON
            }
    );

//        nodes = nodes.filter(function (d) {
//            
//            if(d.depth === 2){
//                return d;
//            }
//            
//        });

    path = vis.selectAll("path").data(nodes);

    //  d3.selectAll("path").on('click',function(){console.log("removedlllll");});

    path.enter().append("path")
            .attr("id", function (d, i) {
                return "path-" + i;
            })
            .attr("d", arc)
            .attr("fill-rule", "evenodd")
            .style("fill", function (d) {
                return color(d.name);//color((d.children ? d : d.parent).name);
            })
//                .attr("display", function (d) {
//                    return (d.depth === 1) ? null : "none";
//                }) // hide inner
            .on("click", click)
            .on("mouseover", mouseover)
            ;

    d3.select("#container").on("mouseleave", mouseleave);

    text = vis.selectAll("text").data(nodes);
    textEnter = text.enter().append("text")
            .style("fill-opacity", 1)
            .style("fill", function (d) {
                return brightness(d3.rgb(color(d.name))) < 125 ? "#eee" : "#000";
            })
            .attr("text-anchor", function (d) {
                return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
            })
            .attr("dy", ".2em")
            .attr("transform", function (d) {
                var multiline = (d.name || "").split(" ").length > 1,
                        angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                        rotate = angle + (multiline ? -.5 : 0);
                return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
            })
            .on("click", click);
    textEnter.append("tspan")
            .attr("x", 0)
            .text(function (d) {
                return d.depth ? d.name.split(" ")[0] : "";
            });
    textEnter.append("tspan")
            .attr("x", 0)
            .attr("dy", "1em")
            .text(function (d) {
                return d.depth ? d.name.split(" ")[1] || "" : "";
            });


    totalSize = path.node().__data__.value;


}

function isParentOf(p, c) {
    if (p === c)
        return true;
    if (p.children) {
        return p.children.some(function (d) {
            return isParentOf(d, c);
        });
    }
    return false;
}

function colour(d) {
    if (d.children) {
        // There is a maximum of two children!
        var colours = d.children.map(colour),
                a = d3.hsl(colours[0]),
                b = d3.hsl(colours[1]);
        // L*a*b* might be better here...
        return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
    }
    return d.colour || "#fff";

}

function click(d) {

//            if (d.children === undefined) {
//                var valoresItem = d3.select("#valoresItem");
//                valoresItem
//                        .transition()
//                        .duration(700)
//                        .style('opacity', 0.9);
//            } else {
//                var valoresItem = d3.select("#valoresItem");
//                valoresItem
//                        .transition()
//                        .duration(700)
//                        .style('opacity', 0);
//            }

    path.transition()
            .duration(duration)
            .attrTween("d", arcTween(d));

    // Somewhat of a hack as we rely on arcTween updating the scales.
    text.style("visibility", function (e) {
        return isParentOf(d, e) ? null : d3.select(this).style("visibility");
    })
            .transition()
            .duration(duration)
            .attrTween("text-anchor", function (d) {
                return function () {
                    return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
                };
            })
            .attrTween("transform", function (d) {
                var multiline = (d.name || "").split(" ").length > 1;
                return function () {
                    var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                            rotate = angle + (multiline ? -.5 : 0);
                    return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
                };
            })
            .style("fill-opacity", function (e) {
                return isParentOf(d, e) ? 1 : 1e-6;
            })
            .each("end", function (e) {
                d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
            });
}
// Interpolate the scales!
function arcTween(d) {
    var my = maxY(d),
            xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, my]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
    return function (d) {
        return function (t) {
            x.domain(xd(t));
            y.domain(yd(t)).range(yr(t));
            return arc(d);
        };
    };
}

function maxY(d) {
    return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
}

// http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
function brightness(rgb) {
    return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
}

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

//        div2.transition()
//                .duration(200)
//                .style("opacity", .9);
//        if (d.parent) {
//            div2.html(
//                    d.name + "<br/>" + (d.children ? "" : "R" + d3.format("$,.2f")(d.size))
//                    )
//                    .style("left", (d3.event.pageX) + "px")
//                    .style("top", (d3.event.pageY - 28) + "px");
//        }
    var percentage = d3.format("$,.2f")(d.value);//(100 * d.value / totalSize).toPrecision(3);
    var percentageString = "R" + percentage;
    if (percentage < 0.1) {
        percentageString = "< 0.1%";
    }
//
//        d3.select("#percentage")
//                .text(percentageString);

//        d3.select("#explanation")
//                .style("visibility", "");

    var sequenceArray = getAncestors(d);
    updateBreadcrumbs(sequenceArray, percentageString); 

    // Fade all the segments.
    d3.selectAll("path, #vis text")
            .style("opacity", 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path, #vis text")
            .filter(function (node) {
                return (sequenceArray.indexOf(node) >= 0);
            })
            .style("opacity", 1);

}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {



//        div2.transition()
//                .duration(500)
//                .style("opacity", 0);
    // Hide the breadcrumb trail
    d3.select("#trail")
            .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", mouseover);
            });

    d3.selectAll("text")
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", mouseover);
            });

    d3.selectAll("#valoresItemSub").remove();
//        d3.select("#explanation")
//                .style("visibility", "hidden");
}
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}


function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select("#sequence").append("svg:svg")
            .attr("width", sequenceWidth)
            .attr("height", 50)
            .attr("id", "trail");
    // Add the label at the end, for the percentage.
    trail.append("svg:text")
            .attr("id", "endlabel")
            .style("fill", "#000");
}

function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

function updateBreadcrumbs(nodeArray, percentageString) {

    // Data join; key function combines name and depth (= position in sequence).
    var g = d3.select("#trail")
            .selectAll("g")
            .data(nodeArray, function (d) {
                return d.name + d.depth;
            });

    // Add breadcrumb and label for entering nodes.
    var entering = g.enter().append("svg:g");


    entering.append("svg:polygon")
            .attr("points", breadcrumbPoints)
            .style("fill", function (d) {
                return color(d.name);
            })
            ;

    entering.append("svg:text")
            .attr("x", (b.w + b.t) / 2)
            .attr("y", b.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("fill", function (d) {
                return brightness(d3.rgb(color(d.name))) < 125 ? "#eee" : "#000";
            })
            .text(function (d) {
                return d.name;
            });

    // Set position for entering and updating nodes.
    g.attr("transform", function (d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
    });

    // Remove exiting nodes.
    g.exit().remove();

    // Now move and update the percentage at the end.
    d3.select("#trail").select("#endlabel")
            .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
            .attr("y", b.h / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
            .style("visibility", "");

}

function filtraCarteiras(startIndex, endIndex) {
    d3.select("#container").remove();
    updateVisualization(startIndex, endIndex);

    var path = d3.select('#container  g  path');
    path.on('click').call(path.node(), path.datum());

}