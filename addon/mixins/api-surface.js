import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line


var ApiSurface = Ember.Mixin.create({
    // Selectize API surface
    // ------------------------------
    // bound values passed straight through to control
    apiPassThrough: [
      'optgroups',
      'inputClass','onInitialize','onDestroy','sortField','placeholder','copyClassesToDropdown',
      'create','createOnBlur','createFilter','highlight','persist','openOnFocus','maxOptions','maxItems','hideSelected',
      'allowEmptyOption','scrollDuration','dropdownParent','addPrecedence','selectOnTab',
      'optgroupField','optgroupValueField','optgroupLabelField',
      'score', 'closeAfterSelect'
    ],
    // Arguably not needed except for "meta" reasons; these are props which are consumed directly by a CP
    // rather than Selectize (which would receive a state change indirectly)
    apiIntermediate: [
      'valueField', 'labelField',
      'optgroupField', 'optgroupValueField', 'optgroupLabelField'
    ],
    // CP's to be used rather than bound value
    apiProcessed: [
      '_optgroupOrder', '_plugins', '_searchField', '_sortField', '_optgroup', '_bespokeRender'
    ],
    // Static mappings to API
    apiStaticMappings: {
      valueField: 'value',
      labelField: 'label',
      optgroupField: 'group'
    },
    copyClassesToDropdown: true,
    eventHandlers() {
      return {
        onInitialize: Ember.$.proxy(this._onInitialize, this),
        onOptionAdd: Ember.$.proxy(this._onOptionAdd, this),
        onOptionRemove: Ember.$.proxy(this._onOptionRemove, this),
        onChange: Ember.$.proxy(this.selectizeChanged, this),
        onLoad: Ember.$.proxy(this._onLoad, this),
        onDropdownOpen: Ember.$.proxy(this._onDropdownOpen, this),
        onDropdownClose: Ember.$.proxy(this._onDropdownClose, this),
        onItemAdd: Ember.$.proxy(this._onItemAdd, this),
        onItemRemove: Ember.$.proxy(this._onItemRemove, this),
        onType: Ember.$.proxy(this._onType, this),
      };
    },

    optgroups: null, // the array of optgroups
    optgroupField: 'group', // property name on "options" which refers to optgroupsValueField
    optgroupValueField: 'id', // the displayed name for optgroup
    optgroupLabelField: 'name', // property on "optgroups" array for the "value" which will match options property
    optgroupOrder: null, // array of optgroup keys in a particular order
    _optgroupOrder: computed('optgroupOrder', function() {
      let optgroupOrder = this.get('optgroupOrder');
      if (!optgroupOrder) {
        optgroupOrder = [];
      }

      return typeOf(optgroupOrder) === 'array' ? optgroupOrder : [optgroupOrder];
    }),
    plugins: null,
    _plugins: computed('plugins', function() {
      const plugins = this.get('plugins');
      return typeOf(plugins) === 'string' ? plugins.split(',') : plugins;
    }),

    onInitialize: null,
    onDestroy: null,
    labelField: 'name',
    valueField: 'id', // the field in the incoming hash which will be used for assigning a value to the input selector
    searchField: 'name', // property/properties to search through for a match
    _searchField: computed('searchField', function() {
      const searchField = this.get('searchField');
      return typeOf(searchField) === 'string' ? searchField.split(',') : searchField;
    }),
    searchConjunction: 'and', // when searching for multiple terms (seperated by a space)
    sortField: 'name',
    // Selectize allows "sortField" to be an array of objects or a string value;
    // we will just simplify this to the more versatile array of objects which also
    // allows the optional attribute "direction" (which is "asc" or "desc")
    _sortField: computed('sortField', function() {
      const sortField = this.get('sortField');
      const sortFields = typeOf(sortField) === 'string' ? sortField.split(',') : sortField;

      return sortFields.map( item => {
        switch(typeOf(item)) {
          case 'string':
            return {field: item};
          case 'object':
            return item;
          default:
            debug('an invalid property was passed to the sortField property: ' + JSON.stringify(item));
            return null;
        }
      }).filter( item => {
        return item !== null;
      });
    }),

    create: false, // allows user to create new items not on the list (can be true, false, or callback)
    createOnBlur: false,
    createFilter: null,
    highlight: true,
    persist: true, // options user created will show up after deselected
    openOnFocus: true,
    maxOptions: 1000,
    maxItems: 10000,
    hideSelected: false, // do not show items as option when already selected
    allowEmptyOption: false,
    scrollDuration: 60,
    dropdownParent: null,
    addPrecedence: false,
    selectOnTab: true,
    inputClass: 'form-control selectize-input',
    // callback function to score the result (default used if left as null)
    score: null,
    placeholder: 'Select tags',
    loadingMessage: 'loading ...',
    closeAfterSelect: false,

    // Component Event Handling

    _onLoad:function(data) {
      this.sendAction('onLoad', {
        items: data,
        count: data.length
      });
    },
    _onOptionAdd:function(value,valueObject) {
      this.sendAction('onOption', {
        action: 'add',
        option: value,
        context: valueObject,
        component: this
      });
    },
    _onOptionRemove:function(value) {
      this.sendAction('onOption', {
        action: 'remove',
        option: value,
        component: this
      });
    },
    _onDropdownOpen:function($dropdown) {
      this.sendAction('onDropdown', {
        action: 'open',
        component: this,
        value: get(this,'value'),
        $dropdown: $dropdown
      });
    },
    _onDropdownClose:function($dropdown) {
      this.sendAction('onDropdown', {
        action: 'close',
        component: this,
        value: get(this,'value'),
        $dropdown: $dropdown
      });
    },
    _onItemAdd:function(value, $item) {
      this.sendAction('onItem', {
        action: 'add',
        component: this,
        message: `added ${value} to the list`,
        value: value,
        $item: $item
      });
    },
    _onItemRemove:function(value) {
      this.sendAction('onItem', {
        action:'remove',
        message: `removed ${value} from the list`,
        value: value,
        component: this
      });
    },
    _onType:function(value) {
      this.sendAction('onType', {
        component: this,
        text: value
      });
    },

    selected: false,
    selectize: null,

});

// NAMED FOR EMBER INSPECTOR
ApiSurface[Ember.NAME_KEY] = 'selectize api surface';
export default ApiSurface;
