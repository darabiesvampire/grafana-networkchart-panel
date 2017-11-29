import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import rendering from './rendering';

export class NetworkChartCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope, $interpolate) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.$interpolate = $interpolate;

    var panelDefaults = {
      color_scale : "schemeCategory10",
      first_color_selector : "index",
      first_color_regexp : "(.+?)\\/",

      second_color_selector: "index",
      second_color_regexp : "(.+?)\\/",
      
      combine_active : false,
      combine_method : "min",

      dynamic_radius : false,
      node_radius : 5,

      dynamic_thickness : true,
      link_thickness : 1,


      hide_internal_relationships: false,
      
      remove_noise : false,
      noise : 100,


      nodes_remove_noise : false,
      nodes_noise : 1000

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
    var values = ["index","regular expression"];

    if(!this.columns)
      return[];

    var selectors = _.map(this.columns,"text");

    selectors.splice(-1);
    
    return values.concat(selectors);
  }

  combineOptions(){
    if(!this.columns || this.columns.length < 2)
      return[];

    return [
      this.columns[0].text ,
      this.columns[1].text ,
      ];
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

    if(! this.panel.first_term_tooltip &&  this.columns[0])
    {
     this.panel.first_term_tooltip=  "{{" + this.columns[0].text + "}}";
    }


    if(! this.panel.combine_to_show &&  this.columns[0])
    {
     this.panel.combine_to_show=  this.columns[0].text;
    }


    if(! this.panel.second_term_tooltip &&  this.columns[1])
    {
     this.panel.second_term_tooltip=  "{{" + this.columns[1].text + "}}";
    }

    this.data = data.rows; //this.parsecolumnMap(this.columnMap);
    this.render(this.data);
  }


  link(scope, elem, attrs, ctrl) {
    rendering(scope, elem, attrs, ctrl);
  }


  highlight(){
    this.render(); 
    this.prev_highlight_text =  this.highlight_text;
  }
}

NetworkChartCtrl.templateUrl = 'module.html';
