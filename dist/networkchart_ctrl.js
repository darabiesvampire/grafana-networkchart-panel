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

        function NetworkChartCtrl($scope, $injector, $rootScope) {
          _classCallCheck(this, NetworkChartCtrl);

          var _this = _possibleConstructorReturn(this, (NetworkChartCtrl.__proto__ || Object.getPrototypeOf(NetworkChartCtrl)).call(this, $scope, $injector));

          _this.$rootScope = $rootScope;

          var panelDefaults = {
            networkType: 'network',
            legend: {
              show: true, // disable/enable legend
              values: true
            },
            links: [],
            datasource: null,
            maxDataPoints: 3,
            interval: null,
            targets: [{}],
            cacheTimeout: null,
            nullPointMode: 'connected',
            legendType: 'Under graph',
            aliasColors: {},
            format: 'short',
            valueName: 'current',
            strokeWidth: 1,
            fontSize: '80%',
            combine: {
              threshold: 0.0,
              label: 'Others'
            }
          };

          _.defaults(_this.panel, panelDefaults);
          _.defaults(_this.panel.legend, panelDefaults.legend);

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
            //this.unitFormats = kbn.getUnitFormats();
          }
        }, {
          key: 'onDataError',
          value: function onDataError() {
            this.columnMap = [];
            this.columns = [];
            this.render();
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            var data = dataList[0];
            if (data.type !== "table") {
              //TODO: show a better explanation 
              return console.error("Should be table fetch. Use terms only.");
            }

            this.columnMap = data.columnMap;
            this.columns = data.columns;
            this.data = data.rows; //this.parsecolumnMap(this.columnMap);
            this.render(this.data);
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            rendering(scope, elem, attrs, ctrl);
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
