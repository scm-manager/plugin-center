"use strict";

const semver = require("semver");
const { collectSupportBranches } = require("./collect-support-branches");
const { collectReleases } = require("./collect-releases");

/**
 * @param {Octokit} api
 * @param {string} repository
 * @returns {Promise<{supportBranches: Array<{range: string, sha: string}>, releases: {version: string, sha: string}[]}>}
 */
async function collectVersions(api, repository) {
  const releases = await collectReleases(api, repository);
  const supportBranches = await collectSupportBranches(api, repository);
  const filteredReleases = releases.filter(({ version }) =>
    // Filter out releases which are covered by a support branch
    !supportBranches.some(({ range }) => semver.satisfies(version, range, {
      /**
       * Divert from semver spec and include labels in version range check.
       * This allows to cover a prerelease version like `2.0.0-rc8`
       * in support branch ranges like `2.0.x`.
       */
      includePrerelease: true,
    })) &&
    // Only keep latest patch version of each minor version
    !releases.some(other => other.version !== version && isGreaterPatchVersion(other.version, version)),
  );

  // Return result
  return {
    releases: filteredReleases,
    supportBranches,
  };
}

function isGreaterPatchVersion(version, other) {
  return semver.major(version) === semver.major(other) &&
    semver.minor(version) === semver.minor(other) &&
    semver.gt(version, other);
}

exports.collectVersions = collectVersions;
