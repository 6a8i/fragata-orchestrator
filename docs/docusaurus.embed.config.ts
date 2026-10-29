// Build variant for serving the docs *inside* fragata-server under the `/docs` route.
//
// It only overrides baseUrl so every asset/link is resolved under `/docs/`
// (the public site keeps baseUrl `/`). trailingSlash stays false to match how
// the docs' relative links are authored.
//
// Rebuild with:
//   yarn build:fragata-server
//
// Then it is mounted in packages/fragata-server/config.toml under [http.mounts].
import base from './docusaurus.config'

export default {
  ...base,
  baseUrl: '/docs/',
}
