import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('index2');
  this.route('value-binding');
  this.route('loading-data');
  this.route('shorthand');
  this.route('groups');
  this.route('plugins');
  this.route('formatting');
  this.route('actions');
  this.route('bespoke-rendering');
});

export default Router;
