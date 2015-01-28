import Ember from 'ember';
import Pretender from 'pretender';

var typeOf = Ember.typeOf;

export default Ember.Controller.extend({
	demoChoices: ["Frog","Monkey","Lion"],
	mySelection: 'Monkey',
	myTags: ['Monkey'],
	groupedChoices: [
		{id:"arm", name:"Arm", group:"body"},
		{id:"leg", name:"Leg", group:"body"},
		{id:"chest", name:"Chest", group:"body"},
		{id:"red", name:"Red", group:"color"},
		{id:"blue", name:"Blue", group:"color"},
		{id:"green", name:"Green", group:"color"},
		{id:"monkey", name:"Monkey", group:"animal"},
		{id:"lion", name:"Lion", group:"animal"},
		{id:"rabbit", name:"Rabbit", group:"animal"}
	],
	optGroup: [
		{id: 'color', name: 'Colors'},
		{id: 'animal', name: 'Animals'},
		{id: 'body', name: 'Body'}
	],
	animals: [
		{id:"monkey", name:"Monkey", group:"animal", synonyms: ['ape','gorilla']},
		{id:"lion", name:"Lion", group:"animal", synonyms: 'king'},
		{id:"rabbit", name:"Rabbit", group:"animal"}		
	],
	isolate: false,
	promisedOptions: function() {
		var store = this.get('store');
		return store.find('color');
	}.property(),
	
	server: null,
	startupServer: function() {
		var self = this;
		var promisedData = { 
			colors: [
				{id:"red", name:"Red", group:"primary"},
				{id:"blue", name:"Blue", group:"primary"},
				{id:"green", name:"Green", group:"primary"},
				{id:"magenta", name:"Magenta", group:"secondary"},
				{id:"orange", name:"Orange", group:"secondary"},
				{id:"yellow", name:"Yellow", group:"secondary"},
		]};
		self.set('server', new Pretender(function(){
		  this.get('/colors', function(request){
			  return [200, {"Content-Type": "application/json"}, JSON.stringify(promisedData)];
		  }, 15000);
		}));		
	}.on('init'),
	teardownServer: function() {
		this.get('server').shutdown();
	}.on('willDestroy')
		
});