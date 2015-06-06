Package.describe({
  name: 'chrisbutler:tls',
  version: '0.0.3',
  git: 'git@github.com:chrisbutler/tls.git'.
  summary: 'Returns tank information from VeederRoot monitoring systems',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('0.9.1');
  api.addFiles('tls.js');
  api.export('tls');
});
