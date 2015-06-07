Package.describe({
  name: 'chrisbutler:tls',
  version: '0.2.0',
  git: 'git@github.com:chrisbutler/tls.git',
  summary: 'Returns tank information from VeederRoot monitoring systems',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('0.9.1');

  api.addFiles('shared/tls.js');
  api.addFiles('shared/utils.js');

  api.addFiles('server/methods.js', ['server']);

  api.export('tls');
});
