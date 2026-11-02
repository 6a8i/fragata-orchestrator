export default {
  create: true,
  delete: true,
  read: true,
  update: {
    automatic: true,
    defaultIsLocked: true,
    insecureNbd: true,
    mtu: true,
    nameDescription: true,
    nameLabel: true,
    nbd: true,
    other_config: true,
    tags: true,
  },
}
