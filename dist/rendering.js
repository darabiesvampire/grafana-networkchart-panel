'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _;

  function link(scope, elem, attrs, ctrl) {
    var data, columns, panel, svgWrapper, highlight_text;
    var tooltipEle = elem.find('.tooltip');
    var captionEle = elem.find('.caption');

    var theme = grafanaBootData.user.lightTheme ? '-light' : '-dark';

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
      svgWrapper = svg.select('.svg-wrapper');

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

    var tooltipEvals = [];

    function parseTooltip(tooltip, columnTexts) {
      var regExp = /{{(.*?)}}/g;
      var tooltipEval = tooltip;
      var match;
      do {
        match = regExp.exec(tooltip);
        if (match) {
          var index = columnTexts.indexOf(match[1]);
          var replaceWith = index !== -1 ? 'd[' + index + ']' : "";

          tooltipEval = tooltipEval.replace(match[1], replaceWith);
        }
      } while (match);

      return tooltipEval;
    }

    function createTooltipEvals(columnTexts) {

      var firstTooltip = ctrl.panel.first_term_tooltip;

      var tooltipEvalText1 = firstTooltip && columnTexts && columnTexts.length ? parseTooltip(firstTooltip, columnTexts) : "{{d[0]}}";
      tooltipEvals[0] = ctrl.$interpolate(tooltipEvalText1);

      var secondTooltip = ctrl.panel.second_term_tooltip;

      var tooltipEvalText2 = secondTooltip && columnTexts && columnTexts.length ? parseTooltip(secondTooltip, columnTexts) : "{{d[1]}}";
      tooltipEvals[1] = ctrl.$interpolate(tooltipEvalText2);
    }

    function combineFieldIndex(columnTexts) {
      if (ctrl.panel.combine_to_show) {
        var showWhichIndex = columnTexts.indexOf(ctrl.panel.combine_to_show);

        if (showWhichIndex !== -1) return showWhichIndex;
      }

      return 0;
    }

    function addNetworkChart() {
      if (typeof d3 == 'undefined') return;

      var width = elem.width();
      var height = elem.height();

      var color = d3.scaleOrdinal(d3[ctrl.panel.color_scale]);

      var noise = ctrl.panel.remove_noise ? ctrl.panel.noise : 3;
      var nodes_noise = ctrl.panel.nodes_remove_noise ? ctrl.panel.nodes_noise : 0;

      //************************ Init Caption and Colors Data *************************/
      var colorSelections = {};
      var columns = [];
      var columnTexts = _.map(ctrl.columns, "text");

      var default_index1;
      var color_regexp1;
      var color_data_index1 = null;

      var default_index2;
      var color_regexp2;
      var color_data_index2 = null;

      var selector = ctrl.panel.first_color_selector;
      if (selector === 'index') {
        default_index1 = columns.length;
        columns.push(ctrl.columns[0]);
      } else if (selector === 'regular expression') color_regexp1 = new RegExp(ctrl.panel.first_color_regexp);else color_data_index1 = columnTexts.indexOf(selector);

      selector = ctrl.panel.second_color_selector;
      if (selector === 'index') {
        default_index2 = columns.length;
        columns.push(ctrl.columns[1]);
      } else if (selector === 'regular expression') color_regexp2 = new RegExp(ctrl.panel.first_color_regexp);else color_data_index2 = columnTexts.indexOf(selector);

      //************************ Tooltips *************************/

      createTooltipEvals(columnTexts);

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

      var totals = {};
      var linkData = [];
      var nodesData = [];

      if (ctrl.panel.combine_active) {
        var sourceIndex = combineFieldIndex(columnTexts);
        var targetIndex = +!sourceIndex;

        var allSources = {};
        var allTargets = {};

        _.forEach(data, function (d) {

          var value = d[d.length - 1];
          //No value
          if (!value || value < noise) return;

          var source = d[sourceIndex];
          var target = d[targetIndex];

          initHash(allSources, source);
          initHash(allTargets, target);

          allSources[source][target] = value;
          allTargets[target][source] = value;

          allSources[source].tooltip = tooltipEvals[sourceIndex]({ d: d });

          if (color_data_index1 !== null || color_regexp1) allSources[source].group = getGroup(d, sourceIndex);
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

              if (ctrl.panel.hide_internal_relationships && allSources[source].group === allSources[sourceFromTarget].group) continue;

              if (!currentRel[sourceFromTarget]) currentRel[sourceFromTarget] = 0;

              var param = [value, allTargets[target][sourceFromTarget]];
              currentRel[sourceFromTarget] += combineMethod(param);
            }
          }
        }

        for (var relation1 in relations) {
          for (var relation2 in relations[relation1]) {

            var value = relations[relation1][relation2];

            setTotalsHash(totals, relation1, value);
            setTotalsHash(totals, relation2, value);
          }
        }

        for (var relation1 in relations) {
          for (var relation2 in relations[relation1]) {
            var addFirst = totals[relation1].value > nodes_noise;
            var addSecond = totals[relation2].value > nodes_noise;

            if (!addFirst && !addSecond) continue;

            nodesData.push({
              id: relation1,
              group: allSources[relation1].group,
              tooltip: allSources[relation1].tooltip + getTotalTooltip(relation1)
            });

            nodesData.push({
              id: relation2,
              group: allSources[relation2].group,
              tooltip: allSources[relation2].tooltip + getTotalTooltip(relation2)
            });

            var value = relations[relation1][relation2];

            linkData.push({
              id: relation1 + relation2,
              source: relation1,
              target: relation2,
              value: value,
              tooltip: relation1 + ' <=> ' + relation2 + '<br>' + value
            });
          }
        }
      } else {
        _.forEach(data, function (d) {
          var value = d[d.length - 1];

          if (!value || value < noise) return;

          setTotalsHash(totals, d[0], value);
          setTotalsHash(totals, d[1], value);
        });

        _.forEach(data, function (d) {
          var value = d[d.length - 1];

          if (!value || value < noise) return;

          var firstNode = d[0];
          var secondNode = d[1];

          if (nodes_noise) {
            var addFirst = totals[firstNode].value > nodes_noise;
            var addSecond = totals[secondNode].value > nodes_noise;

            if (!addFirst && !addSecond) return;
          }

          linkData.push({
            id: firstNode + secondNode,
            source: firstNode,
            target: secondNode,
            value: value,
            tooltip: firstNode + " <=> " + secondNode + " <br> " + value
          });

          nodesData.push({
            id: firstNode,
            group: getGroup(d, 0),
            tooltip: tooltipEvals[0]({ d: d }) + getTotalTooltip(firstNode)
          }); //columns[i].text

          nodesData.push({
            id: secondNode,
            group: getGroup(d, 1),
            tooltip: tooltipEvals[1]({ d: d }) + getTotalTooltip(secondNode)
          }); //columns[i].text
        });
      }

      nodesData = _.uniqBy(nodesData, function (d) {
        return d.id;
      });

      //************************ Links d3 *************************/


      var linkUpdate = svg.select(".links").selectAll("line").data(linkData, function (d) {
        return d.id;
      });

      // EXIT
      // Remove old elements as needed.
      linkUpdate.exit().remove();

      // ENTER
      // Create new elements as needed.  
      var enter = linkUpdate.enter().append("line").attr("class", "line" + theme).on("mouseover", showTooltip).on("mouseout", hideTooltip);

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

      //************************ NODES d3 *************************/


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

      //************************ Add Caption Colors *************************/
      var captions = d3.select(captionEle[0]);

      var columnsSorted = _.sortBy(columns, "text");

      var captionsUpdate = captions.selectAll("g").data(columnsSorted, function (d, i) {
        return d.text + i;
      });

      // EXIT
      // Remove old elements as needed.
      captionsUpdate.exit().remove();

      // ENTER
      // Create new elements as needed.  
      var captionsEnter = captionsUpdate.enter().append("g");

      captionsEnter.append("circle").attr("r", 10).attr("cx", 15).attr("cy", y);

      captionsEnter.append("text").attr("class", "captions-text" + theme).attr("x", 25).attr("y", y_plus_5);

      var colorTexts = _.map(columns, "text");

      // ENTER + UPDATE
      captionsUpdate.merge(captionsEnter).selectAll('circle')
      //.attr("fill", (d,i) => color(i)  )
      .attr("fill", function (d) {
        return color(colorTexts.indexOf(d.text));
      });

      captionsUpdate.merge(captionsEnter).selectAll('text').text(function (d) {
        return d.text;
      });

      function checkHighlight(d) {
        return d.tooltip.toLowerCase().indexOf(highlight_text) !== -1;
      }

      if (ctrl.highlight_text) {

        highlight_text = ctrl.highlight_text.toLowerCase();

        //stop simiulation
        simulation.alphaTarget(0);

        var cx, cy;

        nodeUpdate.transition().duration(1000).delay(2000).attr("r", function (d) {
          return checkHighlight(d) ? radius * 7 : radius;
        }).attr("stroke", function (d) {
          return checkHighlight(d) ? "lightblue" : "";
        }).attr("stroke-width", function (d) {
          return checkHighlight(d) ? 2 : "";
        }).transition().duration(1000).delay(1000).attr("r", radius);
      } else if (ctrl.prev_highlight_text) {
        nodeUpdate.attr("stroke", "").attr("stroke-width", "");
      }

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
        if (!hash[key]) {
          hash[key] = {};
          return true;
        }

        return false;
      }

      function setTotalsHash(hash, key, value) {
        if (initHash(hash, key)) {
          hash[key].count = 0;
          hash[key].value = 0;
        }
        hash[key].value += value;
        hash[key].count++;
      }

      function getGroup(d, index) {
        var group;
        var default_index = index === 0 ? default_index1 : default_index2;
        var selector = index === 0 ? color_data_index1 : color_data_index2;
        var regExp = index === 0 ? color_regexp1 : color_regexp2;

        var selectorData;

        if (selector !== null) selectorData = d[selector];

        if (regExp) {
          var result = regExp.exec(d[index]);

          if (result.length) selectorData = result[result.length - 1];
        }

        if (selectorData) {
          group = colorSelections[selectorData];
          if (group === undefined) {
            group = colorSelections[selectorData] = columns.length;
            columns.push({
              text: selectorData
            });
          }
        } else group = default_index;

        return group;
      }

      function getTotalTooltip(key) {
        var totalObj = totals[key];
        return "<br/> Total:" + totalObj.value + "&nbsp;&nbsp; Edge Count:" + totalObj.count;
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
