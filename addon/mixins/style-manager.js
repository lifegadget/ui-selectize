import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line
const htmlSafe = Ember.String.htmlSafe;
const dasherize = Ember.String.dasherize;

const styleProperties = ['maxWidth', 'width'];
export default Ember.Mixin.create({
  attributeBindings: ['_style:style'],
  _style: computed(...styleProperties, function() {
    const styles = this.getProperties(...styleProperties);
    return htmlSafe(keys(styles).filter( key => {
      return styles[key];
    }).map( key => {
      const snakeCase = dasherize(key);
      return `${snakeCase}: ${styles[key]}`;
    }).join('; '));
  })

});
