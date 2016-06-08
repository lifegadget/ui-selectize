module.exports = {
	name: 'ui-selectize',
	description: 'selectize select/tag form-control wrapped in Ember-CLI love',
	included: function(app) {
		this._super.included(app);
    const skin = app.selectizeStyle || 'bootstrap3';
		app.import(app.bowerDirectory + '/selectize/dist/js/standalone/selectize.js');
		app.import(app.bowerDirectory + '/selectize/dist/css/selectize.css');
		app.import('vendor/ui-selectize/skins/${skin}.css');
    app.import('vendor/ui-selectize/enh-skins/flat.css');
    app.import('vendor/ui-selectize/enh-skins/minimal.css');
		app.import('vendor/ui-selectize/ui-selectize.css');
		app.import('vendor/ui-selectize/fast_click.js');
	}
};
