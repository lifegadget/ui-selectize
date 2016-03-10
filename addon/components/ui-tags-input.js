import Ember from 'ember';
import UiSelectizeComponent from 'ui-selectize/components/ui-selectize';

export default UiSelectizeComponent.extend({
  init() {
		this._super(...arguments);
		Ember.debug('ui-tags-input is deprecated, please use tags-input instead');
	},
  type: 'tag',
	hideSelected: true,
	placeholder: 'Select tags',
	plugins: ['remove_button','fast_click']
});
