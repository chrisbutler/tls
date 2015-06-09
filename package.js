Package.describe({
  name: 'chrisbutler:tls',
  version: '1.1.0',
  git: 'git@github.com:chrisbutler/tls.git',
  summary: 'Returns tank information from VeederRoot monitoring systems',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('0.9.1');

  api.addFiles('shared/tls.js', ['client', 'server']);
  api.addFiles('shared/utils.js', ['client', 'server']);

  api.addFiles('server/api.js', ['server']);

  api.export('tls');
});
