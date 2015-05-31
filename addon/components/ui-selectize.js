import Ember from 'ember';
const { computed, observer, $, A, run, on, typeOf, debug, keys, get, set, inject, isEmpty } = Ember;    // jshint ignore:line
import StyleManager from 'ui-selectize/mixins/style-manager';
import ApiSurface from 'ui-selectize/mixins/api-surface';
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

export default Ember.Component.extend(StyleManager,ApiSurface,{
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

  // OPTIONS
  // -------------------
	options: null,
  _options: computed('options','options.@each.value','valueField','labelField', function() {
    const {labelField, valueField, optgroupField} = this.getProperties('labelField', 'valueField', 'optgroupField');
    const searchField = this.get('_searchField');
    const options = convertToObjectArray(this.get('options'));

    return options.map(item => {
      const value = get(item,valueField);
      const label = get(item,labelField);
      const group = optgroupField ? get(item,optgroupField) : null;

      let result = { label: label, value: value, group: group, search: searchField, object: item };
      // iterate through search fields and make sure they are represented on root object
      new A(searchField).forEach(field => {
        result[field] = get(item,field);
      });
      return result;
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

	// VALUE
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
    const valueObject = value && value.length > 0 ? options.findBy('value', value[0]) : null;
    this.set('valueObject', valueObject);
  }),

	// INITIALIZE
	initializeSelectize: on('didInsertElement', function() {
    const {apiProcessed, apiPassThrough, apiStaticMappings} = this.getProperties('apiProcessed', 'apiPassThrough', 'apiStaticMappings');
    // const optgroupOrder = this.get('_optgroupOrder');
    const value = this.get('_value');
    // Start with all pass through properties
    let config = this.getProperties(...apiPassThrough);
    // Iterate through CP generated properties
    new A(apiProcessed).forEach(prop => {
      config[prop.slice(1)] = get(this, prop);
    });
    // Attach static mappings
    new A(keys(apiStaticMappings)).forEach(key => {
      config[key] = apiStaticMappings[key];
    });
		config.onInitialize = Ember.$.proxy(this._onInitialize, this);
		config.onOptionAdd = Ember.$.proxy(this._onOptionAdd, this);
		config.onOptionRemove = Ember.$.proxy(this._onOptionRemove, this);
		config.onChange = Ember.$.proxy(this._onChange, this);
		config.onDropdownOpen = Ember.$.proxy(this._onDropdownOpen, this);
		config.onDropdownClose = Ember.$.proxy(this._onDropdownClose, this);
		config.onItemAdd = Ember.$.proxy(this._onItemAdd, this);
		config.onItemRemove = Ember.$.proxy(this._onItemRemove, this);
    console.log('config: %o', config);
    // Instantiate
		this.$().selectize(config);
		this.selectize = this.$()[0].selectize;
		this.set('hasInitialized', true);
    this.loadOptions();
    this._disabledObserver();
    // Set existing value(s)
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
