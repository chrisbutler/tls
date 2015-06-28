Package.describe({
  name: 'chrisbutler:tls',
  version: '2.1.2',
  git: 'https://github.com/chrisbutler/tls',
  summary: 'Returns tank information from VeederRoot monitoring systems',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('0.9.1');

  api.addFiles('shared/tls.js', ['client', 'server']);
  api.addFiles('shared/utils.js', ['client', 'server']);

  api.addFiles('server/api.js', ['server']);

  api.export('TLS');
});
