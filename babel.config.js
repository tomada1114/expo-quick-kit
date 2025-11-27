/**
 * Babel Configuration
 *
 * Extended to support inline SQL imports for Drizzle migrations
 */

module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
