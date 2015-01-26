import Ember from 'ember';

var typeOf = Ember.typeOf;
var isEmpty = Ember.isEmpty;

export default Ember.Component.extend({
	// component props
	tagName: 'select',
	classBindings: ['x-selectize'],
	classNameBindings: [ 'selected', 'alignClass' ],
	attributeBindings: [ 'name','autocomplete' ],
	autocomplete: false,
	autofocus: false,
	
	// bound Selectize config
	options: null,
	_workingOptions: [], // final resting place for "options"
	optgroups: null,
	optgroupField: null,
	optgroupValueField: null,
	optgroupLableField: null,
	onInitialize: null,
	onDestroy: null,
	labelField: 'name',
	valueField: 'id', // the field in the incoming hash which will be used for assigning a value to the input selector
	searchField: ['name'], // properties to search through for a match
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
	
	// Public Callback bindings
	score: null,
	
	// Private Event Handling
	_onInitialize: function() {
		this.initialized = true;
		this.sendAction('onInitialize');
	},
	_onChange:function(value) {
		console.log('value changed: %o', value);
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
	_optionsObserver: function() {
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
					self.set('_workingOptions', item._data);
				},
				// PROMISE REJECTED
				function(error) {
					// TODO: implement
				}
			);
		}
		// SIMPLE ARRAY 
		else if(options && options.length > 0 && typeOf(options[0]) !== "object") {
			workingOptions = options.map(function(item) {
				return {id: item, name: item};
			});
		} 
		// ARRAY of OBJECTS
		else {
			workingOptions = options;
		}
		console.log('setting working options: %o', workingOptions);
		this.set('_workingOptions', workingOptions);
	}.observes('options'),
	/**
	When changes are made to working options then pass this change directly 
	onto the selectize control.
	*/
	_workingOptionsObserver: function() {
		console.log('working options changed [%s]', this.get('elementId'));
		Ember.run.next(this, function() {
			this.loadOptions(this.get('_workingOptions'));
			console.log('finished loading %', this.get('elementId'));
		});
	}.observes('_workingOptions'),
	_valueObserver: function() {
		var value = this.get('value');
		var uiValue = this.selectize.getValue();
		var workingOptions = this.get('_workingOptions');
		var valueField = this.get('valueField');
		if(typeOf(value) === 'array') {
			if (value.join(',') !== uiValue.join(',')) {
				console.log('value has indeed changed: %o, %o', value,this.selectize.getValue() );
				this.setValue(value);
			}
			this.set('valueObject',value.map(function(item){
				return workingOptions.findBy(valueField, item);
			}));
		} else {
			if (value !== uiValue) {
				console.log('value has indeed changed: %o, %o', value,this.selectize.getValue() );
				this.setValue(value);
			}
			this.set('valueObject', this.get('_workingOptions').findBy(valueField, value));
		}
	}.observes('value'),

	// Initializes the UI select control
	initialiseSelectize: function() {
		var self = this;
		this._optionsObserver();
		var options = this.get('_workingOptions') || [];
		var config = this.getProperties(
			'optgroups','optgroupField','optgroupValueField','optgroupLableField','inputClass','onInitialize','onDestroy','labelField','valueField','searchField','sortField','placeholder',
			'create','createOnBlur','createFilter','highlight','persist','openOnFocus','maxOptions','maxItems','hideSelected','allowEmptyOption','scrollDuration','dropdownParent','addPrecedence','selectOnTab',
			'score'
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
		
		if(this.get('value')) {
			console.log('value set on initialisation: %o',this.get('value') );
			this.setValue(this.get('value'));
		}
	}.on('didInsertElement'),
	destroyEvent: function(self) {
		console.log('destroying selectize: %o', self);
	},
	changeEvent: function(valueObj) {
		var value = this.$().val();
		console.log('value changed: %o', value);
		this.set('value', value);
		if (value !== '') {
			this.set('selected',true);
		} else {
			this.set('selected',false);
		}
		this.sendAction('change',value, valueObj);
	},
	disableSelector: function() {
		this.get('selectize').lock();
	},
	enableSelector: function() {
		this.get('selectize').unlock();
	},
	// sets the widget to the value of the Ember property
	setValue: function(value) {
		Ember.run.next(this, function() {
			var selectize = this.get('selectize');
			console.log('setting value: %o',value);
			if(selectize) {
				selectize.setValue(value);				
			}
		});
	},
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
		this.get('selectize').load(options);
	},
	cleanup: function() {
		this.get('selectize').off('initialize').off('optionAdd').off('change').off('dropdownOpen').off('dropdownClose').off('itemAdd').off('itemRemove');
	}.on('willDestroyElement')
	
});
