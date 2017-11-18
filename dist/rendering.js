'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _;

  function link(scope, elem, attrs, ctrl) {
    var data, columns, panel;
    var tooltipEle = elem.find('.tooltip');
    var captionEle = elem.find('.caption');

    elem = elem.find('.networkchart-panel');

    ctrl.events.on('render', function () {
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
      } catch (e) {
        // IE throws errors sometimes
        return false;
      }
    }

    function showError(errorText) {
      var noData = elem.find(".no-data");
      if (errorText) {
        noData.text(errorText);
        noData.show();
      } else noData.hide();
    }

    function addZoom(svg) {
      var svgWrapper = svg.select('.svg-wrapper');

      svg.call(d3.zoom().on('zoom', function () {

        var scale = d3.event.transform.k,
            translate = [d3.event.transform.x, d3.event.transform.y];

        svgWrapper.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
      }));
    }

    function y(d, i) {
      return 25 * (i + 1);
    }

    function y_plus_5(d, i) {
      return y(d, i) + 5;
    }

    function addNetworkChart() {
      if (typeof d3 == 'undefined') return;

      var width = elem.width();
      var height = elem.height();

      var color = d3.scaleOrdinal(d3[ctrl.panel.color_scale]);

      //************************ Add Caption Colors *************************/

      var columns = _.filter(ctrl.columns, function (e) {
        return e.filterable;
      });

      var captions = d3.select(captionEle[0]);

      var captionsUpdate = captions.selectAll("g").data(columns, function (d) {
        return d.text;
      });

      // EXIT
      // Remove old elements as needed.
      captionsUpdate.exit().remove();

      // ENTER
      // Create new elements as needed.  
      var captionsEnter = captionsUpdate.enter().append("g");

      captionsEnter.append("circle").attr("r", 10).attr("cx", 15).attr("cy", y);

      captionsEnter.append("text").attr("fill", "white").attr("x", 25).attr("y", y_plus_5);

      var columnTexts = _.map(ctrl.columns, "text");

      // ENTER + UPDATE
      captionsUpdate.merge(captionsEnter).selectAll('circle')
      //.attr("fill", (d,i) => color(i)  )
      .attr("fill", function (d) {
        return color(columnTexts.indexOf(d.text));
      });

      captionsUpdate.merge(captionsEnter).selectAll('text').text(function (d) {
        return d.text;
      });

      //************************ Tooltips *************************/

      var tooltip = d3.select(tooltipEle[0]).style("opacity", 0);

      function showTooltip(d) {
        tooltip.transition().duration(200).style("opacity", .8);

        tooltip.html(d.tooltip).style("width", d.tooltip.length * 7 + "px").style("left", d3.event.pageX + "px").style("top", d3.event.pageY - 28 + "px");
      }

      function hideTooltip(d) {
        tooltip.transition().duration(500).style("opacity", 0);
      }

      //************************ Main Graph *************************/

      var svg = d3.select(elem[0]);

      addZoom(svg);

      //************************ Links between nodes *************************/
      var linkData = [];
      var nodesData = [];

      if (!ctrl.panel.combine_active) {
        linkData = _.reduce(data, function (all, d) {

          //No value
          if (!d[2]) return all;

          all.push({
            id: d[0] + d[1],
            source: d[0],
            target: d[1],
            value: d[2],
            tooltip: d[0] + ' <=> ' + d[1] + '<br>' + d[2]
          });
          return all;
        }, []);
      } else {
        var allSources = {};
        var allTargets = {};

        _.forEach(data, function (d) {
          //No value
          if (!d[2]) return;

          var source = d[0];
          var target = d[1];

          initHash(allSources, source);
          initHash(allTargets, target);

          allSources[source][target] = d[2];
          allTargets[target][source] = d[2];
        });

        var combineMethod = _[ctrl.panel.combine_method];

        var relations = {};

        for (var source in allSources) {

          initHash(relations, source);
          var currentRel = relations[source];

          for (var target in allSources[source]) {

            var value = allSources[source][target];

            for (var sourceFromTarget in allTargets[target]) {

              //Already calculated at the other end
              if (relations[sourceFromTarget]) continue;

              if (!currentRel[sourceFromTarget]) currentRel[sourceFromTarget] = 0;

              var param = [value, allTargets[target][sourceFromTarget]];
              currentRel[sourceFromTarget] += combineMethod(param);
            }
          }
        }

        for (var relation1 in relations) {
          for (var relation2 in relations[relation1]) {
            var value = relations[relation1][relation2];

            linkData.push({
              id: relation1 + relation2,
              source: relation1,
              target: relation2,
              value: value,
              tooltip: relation1 + ' <=> ' + relation2 + '<br>' + value
            });

            nodesData.push({
              id: relation1,
              tooltip: relation1
            });

            nodesData.push({
              id: relation2,
              tooltip: relation2
            });
          }
        }
      }

      var linkUpdate = svg.select(".links").selectAll("line").data(linkData, function (d) {
        return d.id;
      });

      // EXIT
      // Remove old elements as needed.
      linkUpdate.exit().remove();

      // ENTER
      // Create new elements as needed.  
      var enter = linkUpdate.enter().append("line").on("mouseover", showTooltip).on("mouseout", hideTooltip);

      /*
      enter    
        .append("title")
        .text(d => d.id)
      */

      var link_thickness = ctrl.panel.link_thickness;

      if (ctrl.panel.dynamic_thickness) link_thickness = function link_thickness(d) {
        return Math.log(d.value);
      };

      // ENTER + UPDATE
      linkUpdate = linkUpdate.merge(enter)
      //.selectAll("line")
      .attr("stroke-width", link_thickness);

      var maxValueLogged = _.reduce(linkData, function (max, d) {
        var log = Math.log(d.value);
        if (log > max) return log;

        return max;
      }, 0);

      //************************ NODES *************************/

      if (!ctrl.panel.combine_active) nodesData = _.reduce(data, function (all, d) {
        if (!d[2]) return all;

        for (var i = 0; i < d.length - 1; i++) {
          all.push({
            id: d[i],
            group: i,
            tooltip: d[i]
          });
        } //columns[i].text

        return all;
      }, []);

      nodesData = _.uniqBy(nodesData, function (d) {
        return d.id;
      });

      var nodeUpdate = svg.select(".nodes").selectAll('circle').data(nodesData, function (d) {
        return d.id + '-node';
      });

      // EXIT
      // Remove old elements as needed.
      nodeUpdate.exit().remove();

      // ENTER
      // Create new elements as needed.  
      var nodeEnter = nodeUpdate.enter().append("circle").on("mouseover", showTooltip).on("mouseout", hideTooltip).call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

      /*                    
      nodeEnter   
          .append("title")
          .text(d => d.id);
      */

      var radius = ctrl.panel.node_radius;

      // ENTER + UPDATE
      nodeUpdate = nodeUpdate.merge(nodeEnter)
      //.selectAll("circle")
      .attr("r", radius) // TODO use cummulative value for this
      .attr("fill", function (d) {
        return d.group ? color(d.group) : color(0);
      });

      var simulation = d3.forceSimulation().force("link", d3.forceLink().id(function (d) {
        return d.id;
      }).strength(function (d) {

        if (!d.value) return 0.01;

        var strength = Math.log(d.value) / maxValueLogged;
        if (strength < 0.01) return 0.01;

        return strength;
      })).force("charge", d3.forceManyBody()).force("center", d3.forceCenter(width / 2, height / 2));

      simulation.nodes(nodesData).on("tick", ticked);

      simulation.force("link").links(linkData);

      function ticked() {
        linkUpdate.attr("x1", function (d) {
          return d.source.x;
        }).attr("y1", function (d) {
          return d.source.y;
        }).attr("x2", function (d) {
          return d.target.x;
        }).attr("y2", function (d) {
          return d.target.y;
        });

        nodeUpdate.attr("cx", function (d) {
          return d.x;
        }).attr("cy", function (d) {
          return d.y;
        });
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

      function initHash(hash, key) {
        if (!hash[key]) hash[key] = {};
      }
    }

    function render() {
      data = ctrl.data;
      columns = ctrl.columns;
      panel = ctrl.panel;

      if (setElementHeight()) if (ctrl._error || !data || !data.length) {

        showError(ctrl._error || "No data points");

        data = [];
        addNetworkChart();
      } else {
        addNetworkChart();
        showError(false);
      }

      ctrl.renderingCompleted();
    }
  }

  _export('default', link);

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=rendering.js.map
