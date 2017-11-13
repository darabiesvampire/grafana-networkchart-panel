import _ from 'lodash';
import * as d3 from 'd3';
//import {event as currentEvent} from './d3-selection';

export default function link(scope, elem, attrs, ctrl) {
  var data,columns, panel,tooltipEle;
  tooltipEle = elem.find('.tooltip');
  elem = elem.find('.networkchart-panel');


  ctrl.events.on('render', function() {
    render();
  });

  function setElementHeight() {
    try {
      var height = ctrl.height || panel.height || ctrl.row.height;
      if (_.isString(height)) {
        height = parseInt(height.replace('px', ''), 10);
      }

      height -= 5; // padding
      height -= panel.title ? 24 : 9; // subtract panel title bar

      elem.css('height', height + 'px');

      return true;
    } catch(e) { // IE throws errors sometimes
      return false;
    }
  }


  function noDataPoints(display) {
    var noData = elem.find(".no-data");
    if(display)
      noData.show();
    else
      noData.hide();
  }


  function addNetworkChart() {
    var width = elem.width();
    var height = elem.height();

    var svg = d3.select(elem[0]);
    
    var color = d3.scaleOrdinal(d3.schemeCategory10);


    var tooltip = d3.select(tooltipEle[0])
                  .style("opacity", 0);


    //************************ Links between nodes *************************/

    var linkData = _.reduce(data, (all,d) => {
          all.push({
              id: d[0]+ ' <-> ' + d[1], 
              source: d[0],
              target: d[1],
              value:  d[2]
            });
        return all;
      }
      , []);

    var linkUpdate = svg.select(".links")
                    .selectAll("line")
                    .data(linkData, d => d.id);

    // EXIT
    // Remove old elements as needed.
    linkUpdate.exit().remove();

    // ENTER
    // Create new elements as needed.  
    var enter = linkUpdate.enter().append("line");

    /*
    enter    
      .append("title")
      .text(d => d.id)
    */

    // ENTER + UPDATE
    linkUpdate =linkUpdate.merge(enter)
                //.selectAll("line")
                .attr("stroke-width", d => Math.log(d.value) );


    var maxValueLogged = _.reduce(linkData, (max, d) =>{
      var log = Math.log(d.value);
      if(log > max)
        return log;

      return max;
    },0);

    //************************ NODES *************************/


    var nodesData = _.reduce(data, (all,d) => {

        for(var i=0; i < d.length-1 ; i++)
          all.push({id: d[i], group: i}); //columns[i].text

        return all;
      }
      , []);

    nodesData = _.uniqBy(nodesData, d => d.id);


    var nodeUpdate = svg.select(".nodes")
                    .selectAll('circle')
                    .data(nodesData, d => d.id + '-node');

    // EXIT
    // Remove old elements as needed.
    nodeUpdate.exit().remove();

    // ENTER
    // Create new elements as needed.  
    var nodeEnter = nodeUpdate.enter().append("circle")
                    .attr("fill", d => color(d.group))
                    .on("mouseover", function(d) {    
                      tooltip.transition()    
                          .duration(200)    
                          .style("opacity", .9);    

                      tooltip.html(d.id)  
                          .style("width",  (d.id.length * 7) + "px")
                          .style("left",  (d3.event.pageX) + "px")   
                          .style("top",   (d3.event.pageY - 28) + "px")
                      })

                    .on("mouseout", function(d) {   
                        tooltip.transition()    
                            .duration(500)    
                            .style("opacity", 0); 
                    })

                    .call(d3.drag()
                      .on("start", dragstarted)
                      .on("drag", dragged)
                      .on("end", dragended));

    /*                    
    nodeEnter   
        .append("title")
        .text(d => d.id);
    */

    // ENTER + UPDATE
    nodeUpdate = nodeUpdate.merge(nodeEnter)
      //.selectAll("circle")
      .attr("r", 10); // TODO use cummulative value for this
      

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink()
        .id(d => d.id) 
        .strength(d => { 

        if(!d.value)
          return 0.01;

        var strength = Math.log(d.value)/maxValueLogged;
        if(strength < 0.01)
          return 0.01;

        return strength;
        })
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulation
      .nodes(nodesData)
      .on("tick", ticked);

    simulation.force("link")
          .links(linkData);

    function ticked() {
      linkUpdate
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      nodeUpdate
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }


  function render() {
    data = ctrl.data;
    columns = ctrl.columns;
    panel = ctrl.panel;

    if (setElementHeight()) {
      if (ctrl.data && ctrl.data.length){
        addNetworkChart();
        noDataPoints(false);
      }
      else 
        noDataPoints(true);
    }
    
    ctrl.renderingCompleted();
  }
}

