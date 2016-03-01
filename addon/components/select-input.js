// import Ember from 'ember';
import UiSelectizeComponent from 'ui-selectize/components/ui-selectize';

export default UiSelectizeComponent.extend({
	maxItems: 1,
	type: 'select',
	plugins: ['fast_click'],
  placeholder: ['Select one']
});
