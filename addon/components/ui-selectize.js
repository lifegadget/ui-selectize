import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line
import StyleManager from 'ui-selectize/mixins/style-manager';
import ApiSurface from 'ui-selectize/mixins/api-surface';
import SizeManager from 'ui-selectize/mixins/size-manager';
import MoodManager from 'ui-selectize/mixins/mood-manager';
const camelize = Ember.String.camelize;
const convertStringToArray = function(data) {
  data = typeOf(data) === 'string' ? data.split(',') : data || [];
  return new A(data);
};
const objectifyString = function(thingy) {
  return typeOf(thingy) === 'string' ? {id: camelize(thingy), name: thingy} : thingy;
};

export default Ember.Component.extend(MoodManager,SizeManager,StyleManager,ApiSurface,{
	// component props
	tagName: 'select',
	classNames: ['ui-selectize'],
	classNameBindings: [ 'touchDevice', 'fingerFriendly', 'selected:selected:not-selected', '_inline:inline-control:block-control' ],
	attributeBindings: [ 'name','autocomplete' ],
  // wrestle back control of disabled property
  _propertyRemapping: on('init', function() {
    Ember.A(this.get('attributeBindings')).removeObject('disabled');
  }),
  display: 'none',
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
	_fingerFriendly: on('willRender', function() {
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
  _options: computed('options','options.isFulfilled', 'options.[]', function() {
    const {labelField, valueField, optgroupField} = this.getProperties('labelField', 'valueField', 'optgroupField');
    const searchField = this.get('_searchField');
    const options = convertStringToArray(this.get('options'));
    let result = new A([]);
    options.forEach( item => {
      item = objectifyString(item);
      const value = get(item,valueField);
      const label = get(item,labelField);
      const group = optgroupField ? get(item,optgroupField) : null;

      let newItem = { label: label, value: value, group: group, search: searchField, object: item };
      // iterate through search fields and make sure they are represented on root object
      new A(searchField).forEach(field => {
        newItem[field] = get(item,field);
      });

      result.pushObject(newItem);
    });

    return result;
  }),
  _optionsObserver: observer('_options', function() {
    run(() => {
      this.loadOptions();
    });
  }),
  optgroups: null,
  _optgroups: computed('optgroups', 'optgroups.[]', function() {
    const { optgroupValueField, optgroupLabelField } = this.getProperties('optgroupValueField', 'optgroupLabelField');
    const optgroups = convertStringToArray(this.get('optgroups'));
    let result = new A([]);
    optgroups.forEach(group => {
      result.pushObject({
        id: get(group, optgroupValueField),
        name: get(group, optgroupLabelField)
      });
    });

    return result;
  }),
  _optgroupsObserver: on('init',observer('_optgroups', function() {
    const {_optgroups, _optgroupsObserverMutex, selectize} = this.getProperties('_optgroups', '_optgroupsObserverMutex', 'selectize');
    if(!_optgroupsObserverMutex) {
      // on init we will just ignore a change as this should be incorporated into
      // Selectize initialization (and more gracefully than the API provides)
      this.set('_optgroupsObserverMutex', true);
    } else {
      // this is a post-init (clear use case is a promise being delivered)
      _optgroups.forEach(group => {
        selectize.addOptionGroup(group.id, group);
      });
      selectize.refreshOptions(false); // false stops the control from receiving focus
    }
  })),
  _optgroupsObserverMutex: null,

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
    const selectize = this.selectize;
    const uiValue = selectize ? selectize.getValue() : null;

    // update Selectize's value
    if(JSON.stringify(value) !== JSON.stringify(uiValue)) {
      selectize.setValue(value);
    }
    const valueObject = value && value.length > 0 ? options.findBy('value', value[0]) : null;
    this.set('valueObject', valueObject);
  }),

  // RENDER
  // -----------------------

  itemRender: null,
  optionRender: null,
  createRender: null,
  groupHeaderRender: null,
  groupRender: null,
  _bespokeRender: on('init',computed('itemRender','optionRender','createRender', 'groupRender', 'groupHeaderRender', function() {
    const renders = this.getProperties('itemRender', 'optionRender', 'createRender', 'groupRender', 'groupHeaderRender');
    let result = {};
    Object.keys(renders).map( prop => {
      if(renders[prop]) {
        result[prop.slice(0,-6)] = renders[prop];
      }
    });

    return result;
  })),

	// INITIALIZE
	initializeSelectize: on('willRender', function() {
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
    config.onLoad = Ember.$.proxy(this._onLoad, this);
		config.onDropdownOpen = Ember.$.proxy(this._onDropdownOpen, this);
		config.onDropdownClose = Ember.$.proxy(this._onDropdownClose, this);
		config.onItemAdd = Ember.$.proxy(this._onItemAdd, this);
		config.onItemRemove = Ember.$.proxy(this._onItemRemove, this);
		config.onType = Ember.$.proxy(this._onType, this);
    // The "create" callback is handled somewhat differently
    if(typeOf(config.create) === 'function') {
      config.create = Ember.$.proxy(config.create, this);
    }
    config.render = this.get('_bespokeRender');


    run.schedule('afterRender', ()=>{
          // Instantiate
          config.optgroups = this.get('_optgroups');
          this.$().selectize(config);
          this.set('selectize',this.$()[0].selectize);
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
    });
	}),
	addOptions: function(options) {
			if(options && options.length > 0) {
			var selectize = this.selectize;
			selectize.clearOptions();
			options.forEach(function(option) {
				selectize.addOption(option);
			});
			selectize.refreshOptions();
		}
	},
	loadOptions: function() {
    const options = this.get('_options');
    const selectize = this.selectize;
    if(!isEmpty(options) ) {
      selectize.load((callback) => {
        callback(options);
      });
		}
	},
	teardown: on('willDestroyElement', function() {
    const selectize = this.selectize;
    if(selectize) {
      selectize.off();
      selectize.destroy();
    }
	})

});
