import transportConsole from '@fragata/log/transports/console'
import { configure } from '@fragata/log/configure'
import { dedupe } from '@fragata/log/dedupe'

export default class Logs {
  constructor(app) {
    const transport = transportConsole()
    app.config.watch('logs', ({ filter, level }) => {
      configure([
        {
          filter: [process.env.DEBUG, filter],
          level,
          transport: dedupe({ transport }),
        },
      ])
    })
  }
}
