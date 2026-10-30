// Fragata has no paid plans: every feature is available to every installation.
//
// Upstream Xen Orchestra gated some features (RBAC, warm migration, rolling
// pool updates, some backup modes…) behind the appliance's commercial plan
// or bundle. The callers of `checkFeatureAuthorization` are kept so that the
// code paths stay documented, but the check always passes.
export default class Authorization {
  /**
   * Always resolves: no feature is restricted in Fragata.
   *
   * @param {string} featureCode e.g. `BACKUP.DELTA`, `RBAC`, `WARM_MIGRATION`
   */
  async checkFeatureAuthorization(featureCode) {}

  /**
   * Always resolves to `true`: no feature is restricted in Fragata.
   *
   * @param {string} featureCode
   * @returns {Promise<boolean>}
   */
  async hasFeatureAuthorization(featureCode) {
    return true
  }
}
