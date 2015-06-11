import DS from 'ember-data';

var attr = DS.attr;

export default DS.Model.extend({
	// The 'giver' and 'taker' are users and the role they have WRT to permissions/visibility
	name: attr('string'),
	group: attr('string'),
	// synonyms: attr('array')
});
