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
const escapeHtml = html => {
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  return String(html).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
};

const selectize = Ember.Component.extend(StyleManager, ApiSurface, {
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
      if(this.get('autofocus')) { this.selectize.focus(); }
    });
  },
  didInsertElement() {
    run.schedule('afterRender', ()=> {
      this.get('style');
    });
  },
  hasTouch: computed(()=> 'ontouchstart' in window),

  _mood: computed('mood', function() {
    const mood = this.get('mood');
    return mood ? ` mood-${mood}` : '';
  }),
  _size: computed('size', function() {
    const size = String(this.get('size')).toLowerCase();
    return size ? ` size-${size}` : '';
  }),

	// component props
	autocomplete: false,
	autofocus: false,
	fingerFriendly: false,
	disabled: false,
  _disabled: observer('disabled', function() {
    const {disabled} = this.getProperties('disabled');
    run.next(()=> {
      if(this.selectize && disabled) { this.selectize.disable(); }
      if(this.selectize && !disabled) { this.selectize.enable(); }
    });
  }),
  _readonly: computed('readonly', function() {
    if(this.selectize && this.get('readonly')) {
      this.selectize.disable();
    }
    if(this.selectize && !this.get('readonly')) {
      this.selectize.enable();
    }
    return this.get('readonly') ? ' read-only' : '';
  }),
  _skin: computed('skin', function() {
    return this.get('skin') ? ` skin-${this.get('skin')}` : '';
  }),
  style: computed('stylist', function() {
    const stylist = this.get('stylist');
    this.selectize.$control.attr('style', stylist);
    return stylist;
  }),

  // VALUE(s)
  values: null,
  value: null,
  _valuesObserver: observer('values', function() {
    let {values} = this.getProperties('values');
    if (typeOf(values) === 'string') { values = values.split(','); }
    if (typeOf(values) !== 'array') {
      debug(`ui-selectize[${this.elementId}] does not have a valid value. Disabling control until corrected. Values property was of type ${typeOf(values)}: `, JSON.stringify(values, null, 2));
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
    } else if (typeOf(this.attrs[action]) === 'function') {
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
    options.map( (item, index) => {
      const value = get(item,valueField);
      const label = get(item,labelField);
      const group = optgroupField ? get(item,optgroupField) : null;
      const newItem = {
        label: label,
        value: value,
        group: group,
        search: searchField,
        object: item,
        $natural: index
      };
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
    if (result.length > 0) {this._optionsInitialized = true;}
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
      selectize.addOptionGroup(group.id, group);
    });
    selectize.refreshOptions(false); // false stops the control from receiving focus

    return result;
  }),

  selectizeChanged:function(changeInfo) {
    let value;
    let values;
    if(this.type === 'select') {
      value = changeInfo.value;
      values = value ? [value] : [];
    } else {
      values = changeInfo.value ? changeInfo.value : [];
      value = values[0];
    }

    const message = {
      code: 'selectize-changed',
      values: values,
      value: value
    };
    delete changeInfo.value;

    let allowed = this.ddau(
      'onChange',
      Object.assign(message, changeInfo),
      this.type === 'tag' ? 'values' : 'value'
    );

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
    config = merge(config, apiStaticMappings, eventHandlers);
    if(config.create) {
      config.create = Ember.$.proxy(this._onCreate, this);
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

    const renderTemplate = this.get('renderTemplate');
    if(renderTemplate) {
      this.selectize.render = Ember.$.proxy(this._renderTemplates, this);
    }

    this.hasInitialized = true;
    // Send Actions
    this.ddau('onInitialize', {
      code: 'initialized',
      context: this
    });
	},
	addOptions(options) {
			if(options && options.length > 0) {
			this.selectize.clearOptions();
      this.selectize.addOption(options);
			this.selectize.refreshOptions();
      this.selectize.refreshItems();
		}
	},
  addOption(o) {
    if(typeOf(o) === 'number') {
      o = {
        [this.get('apiStaticMappings.labelField')]: o,
        [this.get('apiStaticMappings.valueField')]: o
      };
    }
    if(typeOf(o) === 'string') {
      o = this.convertStringToArray(o)[0];
    }
    // o.value = 'foobar';
    // o.label = 'foobar';
    console.log('adding option: ', o);
    this.selectize.addOption(o);
    this.selectize.refreshOptions(false);
    return o;
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

  /**
   * Responsible for building a hash of render functions for
   * the "parts" which are defined either as a inline template
   * or a bespoke render using the block component
   */
  _renderTemplates(templateName, item) {
    const {templates} = this.getProperties('templates');
    let html = templates[templateName](item, escapeHtml);
    // add required HTML properties
    const regex_tag = /^[\t \r\n]*<([a-z][a-z0-9\-_]*(?:\:[a-z][a-z0-9\-_]*)?)/i;
    switch(templateName) {
      case 'option':
      case 'option_create':
        html = html.replace(regex_tag, '<$1 data-selectable');
        break;
      case 'optgroup':
        let id = item[this.get('optgroupValueField')] || '';
        html = html.replace(regex_tag, '<$1 data-group="' + escapeHtml(id) + '"');
        break;
    }
    if (templateName === 'option' || templateName === 'item') {
      html = html.replace(regex_tag, `<$1 data-value="${escapeHtml(item.value || '')}"`);
    }

    return html;
  },

  /**
   * User defined templates
   */
  bespokeTemplates: computed('parts', 'renderTemplate', function() {
    const {parts} = this.getProperties('parts');
    const response = {};

    keys(parts).map(p => {
      if (this.selectize.renderCache[p]) {
        delete this.selectize.renderCache[p];
      }
      response[p] = item => {
        const injector = (match, p1) => {
          return escapeHtml(get(item, p1));
        };

        let content = parts[p].getTemplate();
        content = content.replace(/\[\[item\.(\S*)\]\]/g, injector);

        return content;
      };
    });

    return response;
  }),

  genericTemplates: computed(function() {
    return this.selectize.settings.render;
  }),

  templates: computed('bespokeTemplates', 'genericTemplates', function() {
    const {bespokeTemplates, genericTemplates} = this.getProperties('bespokeTemplates', 'genericTemplates');
    const templates = {};
    merge(templates, genericTemplates);
    merge(templates, bespokeTemplates);

    return templates;
  }),

  parts: computed(() => { return {}; }),
  registerPart(handler) {
    const parts = this.get('parts');
    parts[handler.part] = handler;
    this.set('parts', parts);
  },

  removePart(obj) {
    const parts = this.get('parts');
    const part = parts[obj.get('part')];
    if(get(obj, 'id') === get(part, 'id')) {
      delete parts[part];
    }
    this.set('parts', parts);
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
      const valueField = this.valueField;
      const labelField = this.labelField;
      console.log(valueField, labelField, data);
      data = data.map(item => {
        const replacement = {};
        replacement[labelField] = item;
        replacement.label = item;
        replacement[valueField] = convert[idStrategy](item);
        replacement.value = convert[idStrategy](item);
        replacement.search = this.get('_searchField');
        replacement.group = item[this.optgroupField];
        return replacement;
      });
    }
    console.log('data now: ', data);
    return a(data || []);
  },

  getOptionValue(option) {
    return option[this.valueField];
  },
  getOptionLabel(option) {
    return option[this.labelField];
  },
  setOptionValue(option, value) {
    return option[this.valueField] = value;
  },

	teardown: on('willDestroyElement', function() {
    const selectize = this.selectize;
    if(selectize) {
      selectize.off();
      selectize.destroy();
    }
	})

});

selectize[Ember.NAME_KEY] = 'ui-selectize';
export default selectize;
