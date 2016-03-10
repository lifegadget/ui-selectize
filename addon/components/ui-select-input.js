import Ember from 'ember';
import UiSelectizeComponent from 'ui-selectize/components/ui-selectize';

export default UiSelectizeComponent.extend({
	init() {
		this._super(...arguments);
		Ember.debug('ui-select-input is deprecated, please use select-input instead');
	},
	maxItems:1,
	type: 'select',
	plugins: ['fast_click'],
  placeholder: ['Select one']
});
