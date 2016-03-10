import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const { RSVP: {Promise, all, race, resolve, defer} } = Ember; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line


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
        onChange: Ember.$.proxy(this._onChange, this),
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
    searchFields: computed.alias('searchField'),
    _searchField: computed('searchField', function() {
      const searchField = this.get('searchField');
      return typeOf(searchField) === 'string' ? searchField.split(',') : searchField;
    }),
    searchConjunction: 'and', // when searching for multiple terms (seperated by a space)
    sortField: computed('labelField', {
      set(_, name) {
        return name;
      },
      get() {
        return this.get('labelField');
      }
    }),
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
    _onInitialize() {
      window.$(`#${this.elementId} .form-control`).attr('style', this.get('stylist'));
      // ; // adds styling
    },
    _onLoad:function(data) {
      this.ddau('onLoad', {
        options: data,
        count: data.length,
        context: this,
        code: 'loaded'
      });
    },
    /**
     * Responds to changes in value to the selectize control.
     */
    _onChange: function(input) {
      const changeInfo = { value: input };
      let {values, type} = this.getProperties('values', 'type');
      if(type === 'select') { changeInfo.replaced = this.get('value'); }
      else {
        values = values || [];
        input = input || [];
        if(typeOf(input) === 'string') { input = [input]; }
        changeInfo.added = [];
        changeInfo.removed = [];
        input.map(v => {
          if(!a(values).contains(v)) {
            changeInfo.added.push(v);
          }
        });
        values.map(v => {
          if(!a(input).contains(v)) {
            changeInfo.removed.push(v);
          }
        });
        if (changeInfo.added.length === 0) { delete changeInfo.added; }
        if (changeInfo.removed.length === 0) { delete changeInfo.removed; }
      }
      this.selectizeChanged(changeInfo);
    },

    /**
     * When a user types something NOT in the option list and
     * the user has set "create" to true then this method will
     * add the value to the list and select it
     */
    _onCreate(input, cb) {
      const values = this.get('values') || [];
      const response = this.ddau('onCreate', {
        code: 'user-create',
        input: input,
      }, 'input');

      // only create if container allows
      if(response !== false) {
        // input is a string, addOption will convert to an option object
        const option = this.addOption(input);
        const newValue = option[get(this, 'apiStaticMappings.valueField')];
        console.log('option:', option);
        console.log('Values is currently: ', values);
        console.log('New value is: ', newValue);
        cb(); // tell selectize we're done
        let changedValue = {
          code: 'selected-new-option',
          added: [ input ],
          value: newValue,
          values: Object.assign(values, [newValue])
        };
        this.ddau('onChange', changedValue);
      } else {
        cb(); // tell selectize we're done
      }

    },

    _onOptionAdd:function(value,valueObject) {
      if(this._optionsInitialized) {
        this.ddau('onOption', {
          code: 'add-option',
          context: this,
          added: value,
          addedContext: valueObject
        });
      }
    },
    _onOptionRemove:function(value) {
      if(this._optionsInitialized) {
        this.ddau('onOption', {
          code: 'remove-option',
          context: this,
          removed: value
        });
      }
    },
    _onDropdownOpen:function($dropdown) {
      this.ddau('onDropdown', {
        code: 'open-dropdown',
        context: this,
        dropdown: $dropdown
      });
    },
    _onDropdownClose:function($dropdown) {
      this.ddau('onDropdown', {
        code: 'close-dropdown',
        context: this,
        dropdown: $dropdown
      });
    },
    _onType:function(value) {
      this.ddau('onType', {
        code: 'user-typing',
        context: this,
        value: value
      });
    },

    selected: false,
    selectize: null,

});

// NAMED FOR EMBER INSPECTOR
ApiSurface[Ember.NAME_KEY] = 'selectize api surface';
export default ApiSurface;
