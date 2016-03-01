import Ember from 'ember';
import layout from '../templates/components/ui-selectize';
import StyleManager from 'ember-cli-stylist/mixins/shared-stylist';
import ApiSurface from 'ui-selectize/mixins/api-surface';
const { keys, create } = Object; // jshint ignore:line
const { RSVP: {Promise, all, race, resolve, defer} } = Ember; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observer, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, merge, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line
const camelize = Ember.String.camelize;
const pascalize = thingy => thingy ? Ember.String.capitalize(Ember.String.camelize(thingy)) : thingy;
const dasherize = thingy => {
  return thingy ? Ember.String.dasherize(thingy) : thingy;
};
const snake = thingy => {
  return thingy ? Ember.String.underscore(thingy) : thingy;
};

export default Ember.Component.extend(StyleManager, ApiSurface, {
  layout,
  tagName: '',
  init() {
    this._super(...arguments);
    run.schedule('afterRender', () => {
      if(this.attrs.value && this.attrs.values) {
        debug(`A container to a ui-selectize component[${this.elementId}] is bound to both "value" and "values"; this is not considered a safe strategy, please choose one or the other.`);
      }

      this.initializeSelectize();
      this._optionsObserver();
      this.get('_optgroups'); // force evaluation
    });
  },

  _mood: computed('mood', function() {
    const mood = String(this.get('mood')).toLowerCase();
    return Ember.isEmpty(mood) ? null : `mood-${mood}`;
  }),
  _size: computed('size', function() {
    const size = String(this.get('size')).toLowerCase();
    return Ember.isEmpty(size) ? '' : `size-${size}`;
  }),

	// component props
  display: 'none',
	autocomplete: false,
	autofocus: false,
	fingerFriendly: false,
	disabled: false,

  // VALUE(s)
  values: null,
  value: null,
  _valuesObserver: observer('values', function() {
    let {values} = this.getProperties('values');
    if (typeOf(values) === 'string') { values = values.split(','); }
    if (typeOf(values) !== 'array') {
      debug(`ui-selectize[${this.elementId}] does not have a valid value. Disabling control until corrected.`);
      this.set('disabled', true);
      this.set('_invalidValue', true);
      this.sendSuggestedValue([], values);
    } else {
      if(this.get('_invalidValue')) {
        this.set('_invalidValue', false);
        this.set('disabled', false);
      }
      if(this.type === 'select') { this.set('value', values[0]); }
      this.setSelectizeValue(values);

      this.set('_values', values);
    }
  }),
  _valueObserver: observer('value', function() {
    let {value} = this.getProperties('value');
    if(this.type === 'tag') {
      this.set('values', [value]);
      debug('A tag-input is bound to the value property; this in effect means only one item can be tagged which is probably unintended. For tags it is recommended to bind to the "values" property.');
    }
    this.setSelectizeValue(value);

    this.set('_value', value);
  }),
  containerValue: computed('value', 'values', 'type', function() {
    const {value, values, type} = this.getProperties('value', 'values', 'type');
    return type === 'tag' ? values : value;
  }),

  /**
   * If a value was invalid, then send a suggested value to
   * container as a change event.
   */
  sendSuggestedValue(values, rejected) {
    this.changeAction({
      code: 'suggested-change',
      values: values,
      value: values[0]
    });
    this.errorAction({
      code: 'rejected-value',
      values: values,
      value: values[0],
      rejected: rejected
    });
  },

  changeAction(hash) {
    return this.ddau('onChange', hash, this.type === 'tag' ? 'values' : 'value');
  },

  errorAction(hash) {
    return this.ddau('onError', hash, this.type === 'tag' ? 'values' : 'value');
  },

  ddau(action, hash, valueProp) {
    if(this.attrs[action] && this.attrs[action].update) {
      this.attrs[action].update(hash[valueProp]);
      return true;
    } else if (this.attrs[action]) {
      return this.attrs[action](hash);
    } else {
      this.sendAction(action, hash);
      return true;
    }
  },

  setSelectizeValue() {
    run.next(() => {
      const selectize = this.selectize;
      const containerValue = this.get('containerValue');
      const selectizeValue = selectize ? selectize.getValue() : undefined;
      if(JSON.stringify(containerValue) !== JSON.stringify(selectizeValue)) {
        selectize.setValue(containerValue);
      }
    });
  },

  // OPTIONS
  // -------------------
	options: null,
  _optionsObserver: observer('options','options.isFulfilled', 'options.[]', 'idStrategy', function() {
    const {labelField, valueField, optgroupField} = this.getProperties('labelField', 'valueField', 'optgroupField');
    const searchField = this.get('_searchField');
    let result = a([]);
    const options = a(this.convertStringToArray(this.get('options')));
    options.forEach( item => {
      const value = get(item,valueField);
      const label = get(item,labelField);
      const group = optgroupField ? get(item,optgroupField) : null;

      let newItem = { label: label, value: value, group: group, search: searchField, object: item };
      // iterate through search fields and make sure they are represented on root object
      a(searchField).forEach(field => {
        newItem[field] = get(item,field);
      });
      result.pushObject(newItem);
    });
    run.next(() => {
      this.clearOptions();
      this.getOptionsLoader().then(loader => {
        loader(result);
      });
    });
    console.log('options: ', result);

    this.set('_options', result);
  }),
  optgroups: null,
  _optgroups: computed('optgroups', 'optgroups.[]', function() {
    const { optgroupValueField, optgroupLabelField, selectize } = this.getProperties('optgroupValueField', 'optgroupLabelField', 'selectize');

    let optgroups = this.get('optgroups');
    if(typeOf(optgroups) === 'string') { optgroups = optgroups.split(','); }
    if(typeOf(optgroups) !== 'array') { optgroups = []; }

    let result = a([]);
    optgroups.map(group => {
      result.pushObject({
        id: get(group, optgroupValueField),
        name: get(group, optgroupLabelField)
      });
      console.log('about to add group: ', group);
      selectize.addOptionGroup(group.id, group);
    });
    selectize.refreshOptions(false); // false stops the control from receiving focus

    return result;
  }),

  selectizeChanged:function(received) {
    let value;
    let values;
    if(this.type === 'select') {
      value = received;
      values = value ? [value] : [];
    } else {
      values = received ? received : [];
      value = values[0];
    }

    let allowed = this.ddau('onChange', {
      code: 'selectize-changed',
      values: values,
      value: value
    }, this.type === 'tag' ? 'values' : 'value');

    // let container reject change
    if (allowed === false) {
      this.setSelectizeValue(this.type === 'tag' ? this.get('values') : this.get('value'));
    }

    if (Ember.isEmpty(values)) {
      this.set('selected',false);
    } else {
      this.set('selected',true);
    }

  },

  // _optgroupsObserver: on('init',observer('_optgroups', function() {
  //   const {_optgroups, _optgroupsObserverMutex, selectize} = this.getProperties('_optgroups', '_optgroupsObserverMutex', 'selectize');
  //   if(!_optgroupsObserverMutex) {
  //     // on init we will just ignore a change as this should be incorporated into
  //     // Selectize initialization (and more gracefully than the API provides)
  //     this.set('_optgroupsObserverMutex', true);
  //   } else {
  //     // this is a post-init (clear use case is a promise being delivered)
  //     _optgroups.forEach(group => {
  //       selectize.addOptionGroup(group.id, group);
  //     });
  //     selectize.refreshOptions(false); // false stops the control from receiving focus
  //   }
  // })),
  // _optgroupsObserverMutex: null,

  // inputType: computed('maxItems', function() {
  //   return this.get('maxItems') === 1 ? 'select' : 'tags';
  // }),
  // // detect component value changes, push to UI control
	// _valueObserver: observer('value', function() {
	// 	const value = this.get('_value');
  //   const options = a(this.get('_options'));
  //   const selectize = this.selectize;
  //
  //
  //   // update Selectize's value
  //   if(JSON.stringify(value) !== JSON.stringify(uiValue)) {
  //     selectize.setValue(value);
  //   }
  //   const valueObject = value && value.length > 0 ? options.findBy('value', value[0]) : null;
  //   this.set('valueObject', valueObject);
  // }),

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

  getComponentValue() {
    const { value, values, type } = this.getProperties('value', 'values', 'type');
    if (type === 'tags' && this.attrs.values) { return values; }
    else if(type === 'select' && this.attrs.value) { return [value]; }
    else {
      debug(`${type}-input component is not currently bound to values or value.`);
      return values;
    }
  },

	// INITIALIZE
	initializeSelectize() {
    const {apiProcessed, apiPassThrough, apiStaticMappings} = this.getProperties('apiProcessed', 'apiPassThrough', 'apiStaticMappings');
    const eventHandlers = this.eventHandlers();
    const value = this.getComponentValue();
    let config = this.getProperties(...apiPassThrough);
    // Iterate through CP generated properties (removing _ in CP name)
    a(apiProcessed).forEach(prop => {
      config[prop.slice(1)] = get(this, prop);
    });
    config = Object.assign(config, apiStaticMappings, eventHandlers);
    if(typeOf(config.create) === 'function') {
      config.create = Ember.$.proxy(config.create, this);
    }

    // Instantiate
    const selector = `#select-${this.elementId}`;
    $(selector).selectize(config);
    this.selectize = $(selector)[0].selectize;

    // Set value(s)
    if(value) {
      a(value).forEach( item => {
        this.selectize.addItem(item);
      });
    }

    this.hasInitialized = true;
    // Send Actions
    this.ddau('onInitialize', {
      code: 'initialized',
      context: this
    });
	},
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
  clearOptions: function() {
    this.selectize.clearOptions();
  },
  /**
   * Selectize will pass back a callback for when the options are
   * available to be populated
   */
	getOptionsLoader: function() {
    return new Promise(resolve => {

      const selectize = this.selectize;
      selectize.load((callback) => {
        resolve(callback);
      });

    });
	},

  convertStringToArray(data) {
    let idStrategy = this.get('idStrategy');
    if(typeOf(data) === 'string') {
      data = data.split(',');
      idStrategy = idStrategy ? idStrategy : 'kebabcase';
      const convert = {
        kebabcase: dasherize,
        camelcase: camelize,
        pascalcase: pascalize,
        literal: f => f,
        snakecase: snake
      };
      const {valueField, labelField} = this.getProperties('valueField', 'labelField');
      data = data.map(item => {
        const replacement = {};
        replacement[labelField] = item;
        replacement[valueField] = convert[idStrategy](item);
        return replacement;
      });
    }
    return a(data || []);
  },

	teardown: on('willDestroyElement', function() {
    const selectize = this.selectize;
    if(selectize) {
      selectize.off();
      selectize.destroy();
    }
	})

});
