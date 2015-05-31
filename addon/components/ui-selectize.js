import Ember from 'ember';
const { computed, observer, $, A, run, on, typeOf, debug, keys, get, set, inject, isEmpty } = Ember;    // jshint ignore:line
import StyleManager from 'ui-selectize/mixins/style-manager';
const convertToObjectArray = function(thingy) {
  let result = typeOf(thingy) === 'string' ? thingy.split(',') : thingy;
  if(!result || typeOf(result) === 'instance' ) {
    return [];
  }

  return result.map(item => {
    if(typeOf(item) === 'string' || typeOf(item) === 'number') {
      return { name: String(item), id: item };
    } else {
      return item;
    }
  });
};

export default Ember.Component.extend(StyleManager,{
	// component props
	tagName: 'select',
	classNames: ['ui-selectize'],
	classNameBindings: [ 'touchDevice', 'fingerFriendly', 'selected:selected:not-selected', '_inline:inline-control:block-control' ],
	attributeBindings: [ 'name','autocomplete' ],
  // wrestle back control of disabled property
  _propertyRemapping: on('init', function() {
    Ember.A(this.get('attributeBindings')).removeObject('disabled');
  }),

	autocomplete: false,
	autofocus: false,
	touchDevice: computed(function() {
		if(navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
			return true;
		} else {
			return false;
		}
	}),
  inline: false,
  _inline: computed('inline','width', function() {
    const { inline, width } = this.getProperties('inline', 'width');
    return inline || width;
  }),
	fingerFriendly: null,
	_fingerFriendly: on('didInsertElement', function() {
		if(this.get('touchDevice') && this.get('fingerFriendly') === null) {
			this.set('fingerFriendly', true);
		}
	}),
	disabled: false,
	_disabledObserver: observer('disabled', function() {
		const { disabled, selectize } = this.getProperties('disabled', 'selectize');
		if(disabled) {
			selectize.disable();
		} else {
			selectize.enable();
		}
	}),

	options: null,
  _options: computed('options','options.@each.value','valueField','labelField', function() {
    const {labelField, valueField, searchField, optgroupField} = this.getProperties('labelField', 'valueField', 'searchField','optgroupField');
    const options = convertToObjectArray(this.get('options'));

    return options.map(item => {
      const value = get(item,valueField);
      const label = get(item,labelField);
      const group = optgroupField ? get(item,optgroupField) : null;
      const search = searchField ? get(item,searchField) : label; // default to label field if not set

      return { label: label, value: value, group: group, search: search, object: item };
    });
  }),
  _optionsObserver: on('init', observer('_options', function() {
    const hasInitialized = this.get('hasInitialized');
    if(hasInitialized) {
      run(() => {
        this.loadOptions();
      });
    }
  })),

  // Selectize API surface
  // ------------------------------

  // bound values passed straight through to control
  apiPassThrough: [
    'optgroups',
    'inputClass','onInitialize','onDestroy','sortField','placeholder',
    'create','createOnBlur','createFilter','highlight','persist','openOnFocus','maxOptions','maxItems','hideSelected',
    'allowEmptyOption','scrollDuration','dropdownParent','addPrecedence','selectOnTab',
    'score'
  ],
  // Arguably not needed except for "meta" reasons; these are props which are consumed directly by a CP
  // rather than Selectize (which would recieve a state change indirectly)
  apiIntermediate: [
    'valueField', 'labelField',
    'optgroupField', 'optgroupValueField', 'optgroupLabelField'
  ],
  // CP's to be used rather than bound value
  apiProcessed: [
    '_optgroupOrder', '_plugins', '_searchField', '_sortField'
  ],
  // Static mappings to API
  apiStaticMappings: {
    valueField: 'value',
    labelField: 'label',
    searchField: 'search'
  },

	optgroups: null, // the array of optgroups
	optgroupField: null, // property name on "options" which refers to optgroupsValueField
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
  placeholder: 'Select one',
  loadingMessage: 'loading ...',

	// Private Event Handling
	_onChange:function(value) {
		this.set('value', value);
		if (isEmpty(value)) {
			this.set('selected',false);
		} else {
			this.set('selected',true);
		}
		this.sendAction('onChange',value, this.get('valueObject'));
	},
	_onOptionAdd:function(value,data) {
		this.sendAction('onOptionAdd', value, data);
	},
	_onOptionRemove:function(value) {
		this.sendAction('onOptionAdd', value);
	},
	_onDropdownOpen:function($dropdown) {
		this.sendAction('onDropdownOpen', $dropdown);
	},
	_onDropdownClose:function($dropdown) {
		this.sendAction('onDropdownClose', $dropdown);
	},
	_onItemAdd:function(value, $item) {
		this.sendAction('onItemAdd', value, $item);
	},
	_onItemRemove:function(value) {
		this.sendAction('onItemRemove', value);
	},

  selected: false,
  selectize: null,
	// Value
  // ----------------------
	value: null, // the value of the selector (a scalar if "select-input", an array if "tags-input")
	valueObject: null, // the full object that is selected
  inputType: computed('maxItems', function() {
    return this.get('maxItems') === 1 ? 'select' : 'tags';
  }),
  // ensures regardless of inputType that value is an array
  _value: computed('value', 'inputType', function() {
    const {value, inputType} = this.getProperties('value','inputType');
    return inputType === 'select' ? [value] : value;
  }),
  // detect component value changes, push to UI control
	_valueObserver: observer('value', function() {
		const value = this.get('_value');
    const options = new A(this.get('_options'));
    const selectize = this.get('selectize');
    const uiValue = selectize.getValue();

    // update Selectize's value
    if(JSON.stringify(value) !== JSON.stringify(uiValue)) {
      selectize.setValue(value);
    }

    const valueObject = options.findBy('value', value[0]);
    this.set('valueObject', valueObject);
  }),

	// Initializes the UI select control
	initializeSelectize: on('didInsertElement', function() {
    const optgroupOrder = this.get('_optgroupOrder');
    const value = this.get('_value');
		let config = this.getProperties(
			'optgroups','optgroupField','optgroupValueField','optgroupLabelField',
			'inputClass','onInitialize','onDestroy','labelField','valueField','searchField','sortField','placeholder',
			'create','createOnBlur','createFilter','highlight','persist','openOnFocus','maxOptions','maxItems','hideSelected','allowEmptyOption','scrollDuration','dropdownParent','addPrecedence','selectOnTab',
			'score', 'plugins'
		);
    if(config.plugins && typeOf(config.plugins) !== 'array') {
      config.plugins = String(config.plugins).split(',');
    }
		config.onInitialize = Ember.$.proxy(this._onInitialize, this);
		config.onOptionAdd = Ember.$.proxy(this._onOptionAdd, this);
		config.onOptionRemove = Ember.$.proxy(this._onOptionRemove, this);
		config.onChange = Ember.$.proxy(this._onChange, this);
		config.onDropdownOpen = Ember.$.proxy(this._onDropdownOpen, this);
		config.onDropdownClose = Ember.$.proxy(this._onDropdownClose, this);
		config.onItemAdd = Ember.$.proxy(this._onItemAdd, this);
		config.onItemRemove = Ember.$.proxy(this._onItemRemove, this);
    config.valueField = 'value';
    config.labelField = 'label';
    config.optgroupOrder = optgroupOrder;
    config.optgroupField = config.optgroupField ? 'group' : null;

		this.$().selectize(config);
		this.selectize = this.$()[0].selectize;
		this.set('hasInitialized', true);
    this.loadOptions();
    this._disabledObserver();
    if(value) {
      new A(value).forEach( item => {
        this.selectize.addItem(item);
      });
    }
    this.sendAction('onInitialize');
	}),
	addOptions: function(options) {
			if(options && options.length > 0) {
			var selectize = this.get('selectize');
			selectize.clearOptions();
			options.forEach(function(option) {
				selectize.addOption(option);
			});
			selectize.refreshOptions();
		}
	},
	loadOptions: function() {
		// const hasInitialized = this.get('hasInitialized');
    const options = this.get('_options');
    const selectize = this.get('selectize');
		if(!isEmpty(options) ) {
			selectize.load((callback) => {
				callback(options);
			});
		}
	},
	teardown: on('willDestroyElement', function() {
		this.get('selectize').off();
	})

});
