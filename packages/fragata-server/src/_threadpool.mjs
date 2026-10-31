import { availableParallelism } from 'node:os'

// libuv's default pool of 4 threads is shared by fs, dns, zlib and crypto: a
// backup compresses and hashes blocks there with up to 16 writes in flight, so
// the pool was the bottleneck. The size must be set before the pool starts,
// hence this module is the first import of the CLI. The environment still wins.
if (process.env.UV_THREADPOOL_SIZE === undefined) {
  process.env.UV_THREADPOOL_SIZE = String(Math.min(Math.max(availableParallelism(), 4), 16))
}
