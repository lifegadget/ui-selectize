import Ember from 'ember';

export default Ember.Controller.extend({
  // optGroup: Ember.computed(function () {
  //   return this.store.findAll('animal-group');
  // })
  optGroup: [
    {id: 'bloods', name: 'The Bloods'},
    {id: 'crips', name: 'The Crips'},
    {id: 'nada', name: 'Rather Not Say'}
  ]
});
