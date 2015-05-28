import Ember from 'ember';
const { computed, observer, $, A, run, on, typeOf, debug, keys, get, set, inject, isEmpty } = Ember;    // jshint ignore:line

export default Ember.Component.extend({
	// component props
	tagName: 'select',
	classNames: ['ui-selectize'],
	classNameBindings: [ 'touchDevice', 'fingerFriendly', 'selected:selected:not-selected', 'inline:inline-control:block-control' ],
	attributeBindings: [ 'name','autocomplete','disabled' ],
	autocomplete: false,
	autofocus: false,
	touchDevice: computed(function() {
		if(navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
			return true;
		} else {
			return false;
		}
	}),
	fingerFriendly: null,
	_fingerFriendly: on('didInsertElement', function() {
		if(this.get('touchDevice') && this.get('fingerFriendly') === null) {
			this.set('fingerFriendly', true);
		}
	}),
	disabled: Ember.computed.not('enabled'),
	enabled: true,
	_enabled: on('didInsertElement', function() {
		var enabled = this.get('enabled');
		if(enabled) {
			this.selectize.unlock();
		} else {
			this.selectize.lock();
		}
	}),

	// bound Selectize config
	options: null,
	_workingOptions: [], // final resting place for "options"

	optgroups: null, // the array of optgroups
	optgroupField: null, // property name on "options" which refers to optgroupsValueField
	optgroupValueField: 'id', // the displayed name for optgroup
	optgroupLabelField: 'name', // property on "optgroups" array for the "value" which will match options property
	optgroupOrder: null, // array of optgroup keys in a particular order
	_optgroupOrder: observer('optgroupOrder', function() {
		this._stringToArray('optgroupOrder');
	}),
	plugins: null,
	_plugins: observer('plugins', function() {
		this._stringToArray('plugins');
	}),

	onInitialize: null,
	onDestroy: null,
	labelField: 'name',
	valueField: 'id', // the field in the incoming hash which will be used for assigning a value to the input selector
	searchField: ['name'], // properties to search through for a match
	_searchField: observer('searchField', function() {
		this._stringToArray('searchField');
	}),
	sortField: 'name',

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

	// Convert a string value into an array so that
	// templates can provide static arrays to this
	// component
	_stringToArray: function(property) {
		var value = this.get(property);
		if(typeOf(value) === 'string') {
			this.set(property, value.split(','));
		}
	},

	// Public Callback bindings
	score: null,

	// Private Event Handling
	_onInitialize: function() {
		this.initialized = true;
		this.sendAction('onInitialize');
	},
	_onChange:function(value) {
		// console.log('value changed: %o', value);
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

	// value bindings
	value: null, // the value of the selector (based on valueField)
	valueObject: null, // the full object that is selected
	_emberModelObjects: null, // in the case of pulling from ED, this is the actual reference set
	useEmberModelWhenAvailable: true,

	placeholder: 'Select one',
	selected: false,
	loadingMessage: 'loading ...',
	selectize: null,

	/**
	Options can come in as:

		a) a simple array of values
		b) an array of objects
		c) a promise which resolves to (b)

	This methods intent is to make all bindings to options eventually end up as an array of options.
	This consistent view will be stored to the '_workingOptions' property where the remaining
	interaction with the selectize control will exist
	*/
	_optionsObserver: observer('options', function() {
		var self = this;
		var options = this.get('options');
		var workingOptions = [];
		// If string then assume it a CSV array
		if(typeOf(options) === 'string') {
			options = options.split(',');
		}
		// PROMISE
		if( options && options.then ) {
			options.then(
				// PROMISE RESOLVED
				function(item) {
					console.log('promise[%s] was resolved', self.get('elementId'));
					var optionsField = self.get('optionsField');
					var newOptions = [];
					if(item.id) {
						// returned promise was an object, need optionsField to deduce where array can be found
						if(optionsField) {
							newOptions = item._data[optionsField];
							// validate that its an array
							if(typeOf(newOptions) === 'array') {
								// ensure array-of-objects
								newOptions = newOptions.map(function(item) {
									if(typeOf(item) === 'object' && item.id) {
										return item;
									} else {
										return { id: item, name: item };
									}
								});
							} else {
								console.warn('Component %s\'s "%s" property was not an array value.');
								newOptions = [];
							}
						} else {
							console.warn('An object was returned for %s but there was no "optionsField" specified', self.get('elementId'));
						}
					} else {
						// returned promise is an array of values
						newOptions = item.content.map(function(item) {
							return item._data;
						});
					}
					workingOptions = self.get('_workingOptions');
					self.set('_emberModelObjects', item.content); // this is so we can pass back the actual Ember-Data object
					if(JSON.stringify(newOptions) !== JSON.stringify(workingOptions)) {
						self.propertyWillChange('_workingOptions');
						self.set('_workingOptions', newOptions);
						self.propertyDidChange('_workingOptions');
					}
				},
				// PROMISE REJECTED
				function(error) {
          debug(error);
				}
			);
		}
		// SIMPLE ARRAY
		else if(options && options.length > 0 && typeOf(options[0]) !== 'object') {
			workingOptions = options.map(function(item) {
				return {id: item, name: item};
			});
		}
		// ARRAY of OBJECTS
		else {
			workingOptions = options;
		}
		// Change if impact to working options
		if(options && JSON.stringify(workingOptions) !== JSON.stringify(this.get('_workingOptions'))) {
			this.propertyWillChange('_workingOptions');
			this.set('_workingOptions', workingOptions);
			this.propertyDidChange('_workingOptions');
		}
	}),
	/**
	When changes are made to working options then pass this change directly
	onto the selectize control.
	*/
	_workingOptionsObserver: observer('_workingOptions', function() {
		var workingOptions = this.get('_workingOptions') || [];
		var hasInitialized = this.get('hasInitialized');
		if(hasInitialized) {
			Ember.run.next(this, function() {
				if(workingOptions.length > 0) {
					this.loadOptions(workingOptions);
				}
			});
		}
	}),
	_valueObserver: observer('value', function() {
		var value = this.get('value');
		var uiValue = this.selectize.getValue();
		var workingOptions = new A(this.get('_workingOptions')) || [];
		var valueField = this.get('valueField');
		var selectize = this.get('selectize');
		var emberModelObjects = this.get('_emberModelObjects');
		if(!selectize) {
			return false;
		}
		if(typeOf(value) === 'array') {
			if (value.join(',') !== uiValue.join(',')) {
				selectize.setValue(value);
			}
			this.set('valueObject',value.map(function(item){
				return workingOptions.findBy(valueField, item);
			}));
		} else {
			// if it is an Ember Model that created the array then
			// use the actual ember-data model objects rather than the
			// POJO array that Selectize likes
			if(!isEmpty(emberModelObjects) && this.get('useEmberModelWhenAvailable')) {
				var pojo = workingOptions.findBy(valueField, value);
				this.set('valueObject', emberModelObjects.findBy('id',pojo.id));
			} else {

				if (value !== uiValue) {
					selectize.setValue(value);
				}
				this.set('valueObject', workingOptions.findBy(valueField, value));
			}
		}
	}),

	// Initializes the UI select control
	initializeSelectize: on('didInsertElement', function() {
		var self = this;
		var preReqs = ['_workingOptionsObserver','_optionsObserver','_plugins','_searchField','_optgroupOrder','_fingerFriendly'];
		preReqs.forEach(function(o) {
			self[o]();
		});
		var options = this.get('_workingOptions') || [];
		var config = this.getProperties(
			'optgroups','optgroupField','optgroupValueField','optgroupLabelField','optgroupOrder',
			'inputClass','onInitialize','onDestroy','labelField','valueField','searchField','sortField','placeholder',
			'create','createOnBlur','createFilter','highlight','persist','openOnFocus','maxOptions','maxItems','hideSelected','allowEmptyOption','scrollDuration','dropdownParent','addPrecedence','selectOnTab',
			'score', 'plugins'
		);
		config.options = options;
		config.onInitialize = Ember.$.proxy(this._onInitialize, this);
		config.onOptionAdd = Ember.$.proxy(this._onOptionAdd, this);
		config.onOptionRemove = Ember.$.proxy(this._onOptionRemove, this);
		config.onChange = Ember.$.proxy(this._onChange, this);
		config.onDropdownOpen = Ember.$.proxy(this._onDropdownOpen, this);
		config.onDropdownClose = Ember.$.proxy(this._onDropdownClose, this);
		config.onItemAdd = Ember.$.proxy(this._onItemAdd, this);
		config.onItemRemove = Ember.$.proxy(this._onItemRemove, this);

		this.$().selectize(config);
		this.selectize = this.$()[0].selectize;
		// post-initalization observers
		var postReqs = ['_valueObserver'];
		postReqs.forEach(function(o) {
			self[o]();
		});
		this.set('hasInitialized', true);
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
	loadOptions: function(options) {
		var hasInitialized = this.get('hasInitialized');
		if(!isEmpty(options) && hasInitialized) {
			this.get('selectize').load(function(callback) {
				callback(options);
			});
		}
	},
	teardown: on('willDestroyElement', function() {
		this.get('selectize').off();
	})

});
