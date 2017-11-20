import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import rendering from './rendering';

export class NetworkChartCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope) {
    super($scope, $injector);
    this.$rootScope = $rootScope;

    var panelDefaults = {
      color_scale : "schemeCategory10",
      first_color_selector : "index",
      second_color_selector: "index",
      
      combine_active : false,
      combine_method : "min",

      dynamic_radius : false,
      node_radius : 5,

      dynamic_thickness : true,
      link_thickness : 1,

      remove_noise : false,
      noise : 10
      

    };

    _.defaults(this.panel, panelDefaults);

    //this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/grafana-networkchart-panel/editor.html', 2);
  }


  onDataError() {
    this.columnMap = [];
    this.columns = [];
    this.data = [];
    this.render();
  }


  colorSelectOptions(){
    var values = ["index"];

    if(!this.columns)
      return[];

    var selectors = _.map(this.columns,"text");

    selectors.splice(-1);
    
    return values.concat(selectors);
  }


  /*
  onRender() {
    this.data = this.parsecolumnMap(this.columnMap);
  }
  */

  onDataReceived(dataList) {
    let data = dataList[0];

    if(!data)
    {
      this._error = "No data points.";
      return this.render();
    }

    if(data.type !== "table")
    {
      this._error = "Should be table fetch. Use terms only.";
      return this.render();
    }

    this._error = null;

    this.columnMap = data.columnMap; 
    this.columns = data.columns; 
    this.data = data.rows; //this.parsecolumnMap(this.columnMap);
    this.render(this.data);
  }


  link(scope, elem, attrs, ctrl) {
    rendering(scope, elem, attrs, ctrl);
  }
}

NetworkChartCtrl.templateUrl = 'module.html';
