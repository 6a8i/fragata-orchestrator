import { openDisposableDisk } from '@fragata/backup-archive/disks'
import Disposable from 'promise-toolbox/Disposable'

export async function checkDisk(handler, path) {
  await Disposable.use(openDisposableDisk({ handler, path }), () => {})
}
