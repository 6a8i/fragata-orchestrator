#!/usr/bin/env node

import argv from 'minimist'
import { tmpdir } from 'os'
import { fileURLToPath, URL } from 'url'
import { $, cd, chalk, fs, path, question, within } from 'zx'

$.verbose = false

const GITHUB_REPO = '6a8i/fragata-orchestrator'

const { version: pkgVersion } = await fs.readJson('./package.json')

const opts = argv(process.argv, {
  boolean: ['help', 'build', 'ghRelease', 'tarball'],
  string: ['base', 'dist', 'ghToken', 'tarballDest', 'tarballName', 'version'],
  alias: {
    h: 'help',
    'gh-release': 'ghRelease',
    'gh-token': 'ghToken',
    'tarball-dest': 'tarballDest',
    'tarball-name': 'tarballName',
  },
  default: {
    dist: 'dist',
    version: pkgVersion,
  },
})

let { base, build, dist, ghRelease, ghToken, help, tarball, tarballDest, tarballName, version } = opts

const usage = () => {
  console.log(
    `Usage: ./release.mjs
    [--help|-h - show this message]

    [--version X.Y.Z - Fragata Deck version - default: package.json version (${version})]
    [--dist /path/to/folder - build destination folder - default: dist]

    [
      --build - whether to build Fragata Deck or not
      [--base url - base URL for assets - default: "/"]
    ]

    [
      --tarball - whether to generate a tarball or not
      [--tarball-dest /path/to/folder - tarball destination folder]
      [--tarball-name file.tar.gz - tarball file name - default fragata-deck-X.Y.Z.tar.gz]
    ]

    [
      --gh-release - whether to release on GitHub or not
      [--gh-token token - GitHub API token with "Contents" write permissions]
    ]
`
  )
}

if (help) {
  usage()
  process.exit(0)
}

const yes = async q => ['y', 'yes'].includes((await question(q + ' [y/N] ')).toLowerCase())

const no = async q => !(await yes(q))

const step = s => console.log(chalk.green.bold(`\n${s}\n`))

const stop = () => {
  console.log(chalk.yellow('Stopping'))
  process.exit(0)
}

const ghApiCall = async (path, method = 'GET', data) => {
  const opts = {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${ghToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  }

  if (data !== undefined) {
    opts.body = typeof data === 'object' ? JSON.stringify(data) : data
  }

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}` + path, opts)

  if (res.status === 404 || res.status === 422) {
    return
  }

  if (!res.ok) {
    console.log(chalk.red(await res.text()))
    throw new Error(`GitHub API error: ${res.statusText}`)
  }

  try {
    // Return undefined if response is not JSON
    return JSON.parse(await res.text())
  } catch {}
}

const ghApiUploadReleaseAsset = async (releaseId, assetName, file) => {
  const opts = {
    method: 'POST',
    duplex: 'half',
    body: fs.createReadStream(file),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${ghToken}`,
      'Content-Length': (await fs.stat(file)).size,
      'Content-Type': 'application/vnd.cncf.helm.chart.content.v1.tar+gzip',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  }

  const res = await fetch(
    `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(
      assetName
    )}`,
    opts
  )

  if (!res.ok) {
    console.log(chalk.red(await res.text()))
    throw new Error(`GitHub API error: ${res.statusText}`)
  }

  return JSON.parse(await res.text())
}

const getChangelogForVersion = async (version, changelogPath = './CHANGELOG.md') => {
  const changelog = await fs.readFile(changelogPath, 'utf8')
  const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedVersion = escapeRegex(version)

  const versionRegex = new RegExp(`## \\*\\*${escapedVersion}\\*\\*.*?(?=\\n## \\*\\*|$)`, 's')

  const match = changelog.match(versionRegex)
  return match ? match[0].trim() : undefined
}

// Validate args and assign defaults -------------------------------------------

const headSha = (await $`git rev-parse HEAD`).stdout.trim()

if (!build && !tarball && !ghRelease) {
  console.log(chalk.yellow('Nothing to do! Use --build, --tarball and/or --gh-release'))
  process.exit(0)
}

if (ghRelease && ghToken === undefined) {
  throw new Error('--gh-token is required to upload a release to GitHub')
}

if (base === undefined) {
  base = '/'
}

if (tarball) {
  if (tarballDest === undefined) {
    tarballDest = path.join(tmpdir(), `fragata-deck-${new Date().toISOString()}`)
  }

  if (tarballName === undefined) {
    tarballName = `fragata-deck-${version}.tar.gz`
  }
}

if (tarballDest !== undefined) {
  tarballDest = path.resolve(tarballDest)
}

if (ghRelease && (tarballDest === undefined || tarballName === undefined)) {
  throw new Error(
    'In order to release to GitHub, either use --tarball to generate the tarball or provide the tarball with --tarball-dest and --tarball-name'
  )
}

let tarballPath
let tarballExists = false
if (tarballDest !== undefined && tarballName !== undefined) {
  tarballPath = path.join(tarballDest, tarballName)

  try {
    if ((await fs.stat(tarballPath)).isFile()) {
      tarballExists = true
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
}

if (ghRelease && !tarball && !tarballExists) {
  throw new Error(`No such file ${tarballPath}`)
}

if (tarball && tarballExists) {
  if (await no(`Tarball ${tarballPath} already exists. Overwrite?`)) {
    stop()
  }
}

const tag = `fragata-deck-v${version}`
if (ghRelease) {
  const remoteTag = await ghApiCall(`/git/ref/tags/${encodeURIComponent(tag)}`)

  if (remoteTag === undefined) {
    if ((await ghApiCall(`/commits/${headSha}`)) === undefined) {
      throw new Error(
        `Tag ${tag} and commit ${headSha} not found on GitHub. At least one needs to exist to use it as a release target.`
      )
    }

    if (
      await no(
        `Tag ${tag} not found on GitHub. The GitHub release will be attached to the current commit and the tag will be created automatically when the release is published. Continue?`
      )
    ) {
      stop()
    }
  } else {
    if (
      remoteTag.object.sha !== headSha &&
      (await no(
        `Commit SHA of tag ${tag} on GitHub (${remoteTag.object.sha}) is different from current commit SHA (${headSha}). Continue?`
      ))
    ) {
      stop()
    }

    if (
      !(await $`git tag --points-at HEAD`).stdout.trim().split('\n').includes(tag) &&
      (await no(`Tag ${tag} not found on current commit. Continue?`))
    ) {
      stop()
    }
  }
}

// Build -----------------------------------------------------------------------

if (build) {
  step('Build')

  console.log(`Building Fragata Deck ${version} into ${dist}`)

  $.verbose = true
  await within(async () => {
    cd('../..')
    await $`yarn`
  })
  await $`vite build --base=${base} --outDir ${dist}`
  $.verbose = false
}

const buildInfo = await fs.readJson(path.join(dist, 'build.json'))

// Check that built version matches requested version
if (
  buildInfo.version !== version &&
  (await no(`Build version (${buildInfo.version}) does not match requested version (${version}). Continue anyway?`))
) {
  stop()
}

// Check that built commit matches current commit
if (
  buildInfo.gitHead !== headSha &&
  (await no(`Build commit (${buildInfo.gitHead}) does not match current commit (${headSha}). Continue anyway?`))
) {
  stop()
}

// License and loader ----------------------------------------------------------

if (ghRelease) {
  step('Prepare dist')

  console.log(`Adding LICENSE file to ${dist}`)
  await fs.copy(fileURLToPath(new URL('agpl-3.0.txt', import.meta.url)), path.join(dist, 'LICENSE'))

  console.log(`Adding CHANGELOG.md file to ${dist}`)
  await fs.copy(fileURLToPath(new URL('../CHANGELOG.md', import.meta.url)), path.join(dist, 'CHANGELOG.md'))

  console.log(`Adding xolite-loader.html to ${dist}`)
  await fs.copy(path.join(dist, 'index.html'), path.join(dist, 'xolite.html'))
  await fs.copy(fileURLToPath(new URL('xolite-loader.html', import.meta.url)), path.join(dist, 'index.html'))
}

// Tarball ---------------------------------------------------------------------

if (tarball) {
  step('Tarball')

  console.log(`Generating tarball ${tarballPath}`)

  await fs.mkdirp(tarballDest)

  // The file is called fragata-deck-X.Y.Z.tar.gz by default
  // The archive contains the following tree:
  // fragata-deck-X.Y.Z/
  // ├ LICENSE
  // ├ index.html
  // ├ assets/
  // └ ...
  await $`tar -c -z -f ${tarballPath} --transform='s|^${dist}|fragata-deck-${version}|' ${dist}`
}

// Create GitHub release -------------------------------------------------------

if (ghRelease) {
  step('GitHub release')

  let release = (await ghApiCall('/releases')).find(release => release.tag_name === tag)

  if (
    release !== undefined &&
    (await no(
      `Release with tag ${tag} already exists on GitHub (${chalk.blue(
        release.html_url
      )}). Skip and proceed with upload?`
    ))
  ) {
    stop()
  }
  if (release === undefined) {
    const releaseNotes = await getChangelogForVersion(version)

    if (
      releaseNotes === undefined &&
      (await no(`Could not find changelog for version ${version}. Create release without changelog?`))
    ) {
      stop()
    }
    release = await ghApiCall('/releases', 'POST', {
      tag_name: tag,
      target_commitish: headSha,
      name: tag,
      draft: true,
      body: releaseNotes,
    })

    console.log(`Created GitHub release ${tag}: ${chalk.blue(release.html_url)}`)
  }

  console.log(`Uploading tarball ${tarballPath} to GitHub`)

  let asset = release.assets.find(asset => asset.name === tarballName)
  if (
    asset !== undefined &&
    (await yes(`An asset called ${tarballName} already exists on that release. Replace it?`))
  ) {
    await ghApiCall(`/releases/assets/${asset.id}`, 'DELETE')
    asset = undefined
  }

  if (asset === undefined) {
    console.log('Uploading…')
    asset = await ghApiUploadReleaseAsset(release.id, tarballName, tarballPath)
  }

  if (release.draft) {
    console.log(
      chalk.yellow(
        'The release is in DRAFT. To make it public, visit the release URL above, edit the release and click on "Publish release".'
      )
    )
  }
}
