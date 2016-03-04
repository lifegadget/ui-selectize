import { Factory, faker } from 'ember-cli-mirage';
const animals = ['monkey', 'lion', 'rabbit', 'turtle', 'cat', 'dog', 'horse'];

export default Factory.extend({
  id(i) { return animals[i]; },
  name(i) { return animals[i].charAt(0).toUpperCase() + animals[i].slice(1); },
  group: 'animal',
  nickname() {return faker.hacker.noun(); } ,
  email() { return faker.internet.email(); },
  synonyms(i) { return animals[i] === 'lion' ? 'king' : 'minion'; }
});
