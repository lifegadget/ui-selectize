import Ember from 'ember';

var typeOf = Ember.typeOf;

export default Ember.Controller.extend({
	demoChoices: ["Frog","Monkey","Lion"],
	mySelection: 'Monkey',
	myTags: ['Monkey']
	
});