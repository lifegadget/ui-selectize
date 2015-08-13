/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    // Add options here
  });

  /*
    This build file specifes the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  app.import('bower_components/bootstrap/dist/css/bootstrap.css');
  // app.import('bower_components/selectize/dist/js/standalone/selectize.js');
  // app.import('bower_components/selectize/dist/css/selectize.css');
  // app.import('bower_components/selectize/dist/css/selectize.bootstrap3.css');
  // app.import('vendor/ui-selectize/ui-selectize.css');
  // app.import('vendor/ui-selectize/fast_click.js');


  return app.toTree();
};
