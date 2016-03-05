import { Factory, faker } from 'ember-cli-mirage';
const animals = ['monkey', 'lion', 'rabbit', 'turtle', 'cat', 'dog', 'horse', 'rhino', 'elephant','eagle'];

export default Factory.extend({
  id(i) { return animals[i]; },
  name(i) { return animals[i].charAt(0).toUpperCase() + animals[i].slice(1); },
  group: 'animal',
  pack(i) { return faker.list.random('crips','bloods','nada')(i); },
  avatar() { return faker.image.avatar(); },
  nickname() {return faker.hacker.noun(); } ,
  email() { return faker.internet.email(); },
  synonyms(i) { return animals[i] === 'lion' ? 'king' : 'minion'; }
});
