import { Factory, faker } from 'ember-cli-mirage';
const animals = ['monkey', 'lion', 'rabbit', 'turtle', 'cat', 'dog', 'horse'];

export default Factory.extend({
  id(i) { return animals[i]; },
  name(i) { return animals[i]; },
  group: 'animal',
  synonyms(i) { return animals[i] === 'lion' ? 'king' : 'minion'; }
});
