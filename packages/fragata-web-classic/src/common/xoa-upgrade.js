import PropTypes from 'prop-types'

// Fragata has no paid plans: every feature is available to every
// installation, so this wrapper simply renders its children.
//
// Kept as a component so the pages written for the upstream plan gating keep
// working unchanged; `available`, `required` and `place` are accepted and
// ignored.
const Upgrade = ({ children }) => (children === undefined ? null : children)

Upgrade.propTypes = {
  available: PropTypes.number,
  place: PropTypes.string,
  required: PropTypes.number,
}

export { Upgrade as default }
