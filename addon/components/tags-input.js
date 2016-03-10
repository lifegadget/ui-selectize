// import Ember from 'ember';
import UiSelectizeComponent from 'ui-selectize/components/ui-selectize';

export default UiSelectizeComponent.extend({
	hideSelected: true,
	type: 'tag',
	placeholder: 'Select tags',
	plugins: ['remove_button','fast_click']
});
