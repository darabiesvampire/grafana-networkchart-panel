'use strict';

System.register(['app/plugins/sdk', 'lodash', './rendering'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, _, rendering, _createClass, NetworkChartCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_rendering) {
      rendering = _rendering.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('NetworkChartCtrl', NetworkChartCtrl = function (_MetricsPanelCtrl) {
        _inherits(NetworkChartCtrl, _MetricsPanelCtrl);

        function NetworkChartCtrl($scope, $injector, $rootScope, $interpolate, $sanitize, templateSrv, detangleSrv) {
          _classCallCheck(this, NetworkChartCtrl);

          var _this = _possibleConstructorReturn(this, (NetworkChartCtrl.__proto__ || Object.getPrototypeOf(NetworkChartCtrl)).call(this, $scope, $injector));

          _this.$rootScope = $rootScope;
          _this.$interpolate = $interpolate;
          _this.$sanitize = $sanitize;
          _this.templateSrv = templateSrv;
          _this.detangleSrv = detangleSrv;
          var panelDefaults = {
            color_scale: "schemeCategory10",
            first_color_selector: "index",
            first_color_regexp: "(.+?)\\/",

            second_color_selector: "index",
            second_color_regexp: "(.+?)\\/",

            combine_active: false,
            combine_method: "min",

            dynamic_radius: false,
            node_radius: 5,
            square_side_length: 10,

            dynamic_thickness: true,
            link_thickness: 1,

            link_distance: 20,

            hide_internal_relationships: false,

            remove_noise: false,
            noise: 0,

            nodes_remove_noise: false,
            nodes_noise: 0,

            first_filter_minumum_number_of_links: 0,
            second_filter_minumum_number_of_links: 0

          };

          _.defaults(_this.panel, panelDefaults);

          //this.events.on('render', this.onRender.bind(this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('data-error', _this.onDataError.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          return _this;
        }

        _createClass(NetworkChartCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Options', 'public/plugins/grafana-networkchart-panel/editor.html', 2);
          }
        }, {
          key: 'onDataError',
          value: function onDataError() {
            this.columnMap = [];
            this.columns = [];
            this.data = [];
            this.render();
          }
        }, {
          key: 'colorSelectOptions',
          value: function colorSelectOptions() {
            var values = ["index", "regular expression"];

            if (!this.columns) return [];

            var selectors = _.map(this.columns, "text");

            selectors.splice(-1);

            return values.concat(selectors);
          }
        }, {
          key: 'combineOptions',
          value: function combineOptions() {
            if (!this.columns || this.columns.length < 2) return [];

            return [this.columns[0].text, this.columns[1].text];
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            var data = dataList[0];

            if (!data) {
              this._error = "No data points.";
              return this.render();
            }

            if (data.type !== "table") {
              this._error = "Should be table fetch. Use terms only.";
              return this.render();
            }

            this._error = null;

            this.columnMap = data.columnMap;
            this.columns = data.columns;

            if (!this.panel.first_term_tooltip && this.columns[0]) {
              this.panel.first_term_tooltip = "{{" + this.columns[0].text + "}}";
            }

            if (!this.panel.combine_to_show && this.columns[0]) {
              this.panel.combine_to_show = this.columns[0].text;
            }

            if (!this.panel.second_term_tooltip && this.columns[1]) {
              this.panel.second_term_tooltip = "{{" + this.columns[1].text + "}}";
            }
            if (this.columns && this.columns.length >= 2) {

              var minIssues = this.templateSrv.replaceWithText('$min_issues', this.panel.scopedVars);
              if (minIssues) {
                minIssues = minIssues.trim();
              }
              var shouldApplyMinIssues = minIssues !== "" && minIssues !== '-' && minIssues !== '$min_issues';
              if (shouldApplyMinIssues) {
                this.panel.second_filter_minumum_number_of_links = minIssues;
              } else {
                this.panel.second_filter_minumum_number_of_links = 0;
              }

              var combine = this.templateSrv.replaceWithText('$combine', this.panel.scopedVars);
              if (combine) {
                combine = combine.trim();
              }
              var shouldApplyCombine = combine !== "" && combine !== '-' && combine !== '$combine';
              if (shouldApplyCombine) {
                this.panel.combine_active = combine === 'true' ? true : false;
              } else {
                this.panel.combine_active = true;
              }

              var highlightIssues = this.templateSrv.replaceWithText('$issue_title', this.panel.scopedVars);
              if (highlightIssues) {
                highlightIssues = highlightIssues.trim();
              }
              var shouldApplyIssueHighlight = highlightIssues !== "" && highlightIssues !== '-' && highlightIssues !== '$issue_title';
              if (shouldApplyIssueHighlight) {
                this.issues_highlight_text = highlightIssues;
              }
            }
            this.data = this.detangleSrv.dataFilter(dataList, this.detangleSrv.getCustomConfig(this.templateSrv, this.panel))[0].rows;
            this.render(this.data);
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            rendering(scope, elem, attrs, ctrl);
          }
        }, {
          key: 'highlight',
          value: function highlight() {
            this.render();
            this.prev_highlight_text = this.highlight_text;
          }
        }, {
          key: 'isInt',
          value: function isInt(value) {
            // tslint:disable-next-line:no-bitwise
            return !isNaN(value) && function (x) {
              return (x | 0) === x;
            }(parseFloat(value));
          }
        }]);

        return NetworkChartCtrl;
      }(MetricsPanelCtrl));

      _export('NetworkChartCtrl', NetworkChartCtrl);

      NetworkChartCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=networkchart_ctrl.js.map
