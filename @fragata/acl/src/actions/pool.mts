export default {
  'add-host': true,
  create: {
    network: true,
    vm: true,
  },
  'emergency-shutdown': true,
  ha: true,
  'install-patches': true,
  read: true,
  'rolling-reboot': true,
  'rolling-update': true,
  'set-master': true,
  update: {
    autoPoweron: true,
    crashDumpSrId: true,
    defaultSrId: true,
    migrationCompression: true,
    nameDescription: true,
    nameLabel: true,
    suspendSrId: true,
    tags: true,
  },
}
