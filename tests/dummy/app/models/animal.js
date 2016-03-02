import DS from 'ember-data';

var attr = DS.attr;

export default DS.Model.extend({
	name: attr('string'),
	group: attr('string'),
	synonyms: attr('string'),
  nickname: attr('string')
});
