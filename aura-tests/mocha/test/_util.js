'use strict';
const crypto = require('crypto');
const repoFs = require('../../../calhack/lib/repoFs');
const allow = JSON.parse(repoFs.read('calhack/guard-allowlist.json'));

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pkg = () => repoFs.readJson('package.json');
const scripts = () => pkg().scripts || {};
/** CI and automation text an agent or pipeline runs before tests. */
const automationFiles = () => repoFs.find(/^(\.github\/workflows\/.*\.ya?ml|Jenkinsfile|\.gitlab-ci\.yml|azure-pipelines\.yml|bitbucket-pipelines\.yml|scripts\/.*\.(sh|js|mjs|cjs))$/).filter((f) => !f.startsWith('scripts/calhack/'));
const automationText = () => [...Object.values(scripts()), ...automationFiles().map((f) => repoFs.read(f))].join('\n');

module.exports = { repoFs, allow, sha256, pkg, scripts, automationFiles, automationText };
