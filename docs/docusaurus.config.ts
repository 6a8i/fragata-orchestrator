import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

export default {
  title: 'Fragata Documentation',
  tagline: 'Discover how to use Fragata',
  favicon: 'img/favicon.ico',
  trailingSlash: false,
  // Set the production url of your site here
  url: 'https://6a8i.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'facebook', // Usually your GitHub org/user name.
  // projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    // Local, offline search (no external service).
    require.resolve('docusaurus-lunr-search'),
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/manage-your-infrastructure/manage_infrastructure#vms',
            from: '/administration',
          },
          {
            to: '/users-and-access/rbac',
            from: ['/xo6/acl-v2', '/rbac'],
          },
          {
            to: '/manage-your-infrastructure/advanced',
            from: ['/advanced', '/xo5/advanced'],
          },
          {
            to: '/manage-your-infrastructure/advanced#alerts',
            from: '/alerts',
          },
          {
            to: '/users-and-access/users#acls',
            from: '/acls',
          },
          {
            to: '/getting-started/architecture',
            from: ['/xo5/architecture', '/architecture'],
          },
          {
            to: '/getting-started/architecture#plugins',
            from: '/plugins',
          },
          {
            to: '/backups-and-dr/backup_howto',
            from: ['/xo5/backup_howto', '/backup_howto'],
          },
          {
            to: '/backups-and-dr/calculator',
            from: ['/xo5/calculator', '/calculator'],
          },
          {
            to: '/backups-and-dr/backup_reports',
            from: ['/backup_reports', '/xo5/backup_reports'],
          },
          {
            to: '/backups-and-dr/backup_troubleshooting',
            from: ['/backup_troubleshooting', '/xo5/backup_troubleshooting'],
          },
          {
            to: '/backups-and-dr/backup-features-and-settings',
            from: ['/backups', '/xo5/backups'],
          },
          {
            to: '/backups-and-dr/backups-in-fragata', 
            from: '/xo6/backups',
          },
          {
            to: '/getting-started/configuration',
            from: ['/xo5/configuration', '/configuration'],
          },
          {
            to: '/users-and-access/credential-encryption',
            from: ['/xo5/credential-encryption', '/credential-encryption'],
          },
          {
            to: '/backups-and-dr/backup-types/full_backups',
            from: ['/xo5/full_backups', '/full_backups'],
          },
          {
            to: '/backups-and-dr/backup-types/full_replication',
            from: ['/xo5/full_replication', '/full_replication'],
          },
          {
            to: '/backups-and-dr/scale-and-security/immutability',
            from: ['/xo5/immutability', '/immutability'],
          },
          {
            to: '/backups-and-dr/backup-types/incremental_backups',
            from: ['/incremental_backups', '/xo5/incremental_backups'],
          },
          {
            to: '/backups-and-dr/backup-types/incremental_replication',
            from: ['/incremental_replication', '/xo5/incremental_replication'],
          },
          {
            to: '/getting-started/install-from-sources',
            from: ['/xoa', '/xo5/xoa', '/installation', '/xo5/installation', '/updater'],
          },
          {
            to: '/getting-started/install-from-sources',
            from: '/install-from-sources',
          },
          {
            to: '/backups-and-dr/backup',
            from: '/xo5/backup',
          },
          {
            to: '/manage-your-infrastructure/load_balancing',
            from: ['/load_balancing', '/xo5/load_balancing'],
          },
          {
            to: '/manage-your-infrastructure/manage_infrastructure',
            from: ['/manage', '/xo5/manage', '/manage_infrastructure'],
          },
          {
            to: '/automation/mcp',
            from: ['/mcp', '/xo5/mcp'],
          },
          {
            to: '/backups-and-dr/backup-types/metadata_backup',
            from: ['/metadata_backup', '/xo5/metadata_backup'],
          },
          {
            to: '/backups-and-dr/backup-types/mirror_backup',
            from: ['/xo5/mirror_backup', '/mirror_backup'],
          },
          {
            to: '/backups-and-dr/scale-and-security/object-storage-support',
            from: ['/xo5/object-storage-support', '/object-storage-support'],
          },
          {
            to: '/getting-started/releases',
            from: '/releases',
          },
          {
            to: '/automation/restapi',
            from: ['/restapi', '/xo5/restapi'],
          },
          {
            to: '/automation/terraform-provider',
            from: '/xo6/terraform-provider',
          },
          {
            to: '/automation/ansible',
            from: '/xo6/ansible',
          },
          {
            to: '/automation/pulumi-provider',
            from: '/xo6/pulumi-provider',
          },
          {
            to: '/automation/packer-provider',
            from: '/xo6/packer-provider',
          },
          {
            to: '/automation/powershell-module',
            from: '/xo6/powershell-module',
          },
          {
            to: '/automation/kubernetes',
            from: '/xo6/kubernetes',
          },
          {
            to: '/backups-and-dr/backup-types/rolling_snapshots',
            from: ['/xo5/rolling_snapshots', '/rolling_snapshots'],
          },
          {
            to: '/manage-your-infrastructure/sdn_controller',
            from: ['/sdn_controller', '/xo5/sdn_controller'],
          },
          {
            to: '/getting-started/supported_hosts',
            from: '/supported_hosts',
          },
          {
            to: '/getting-started/troubleshooting',
            from: ['/general-troubleshooting', '/xo5/troubleshooting', '/troubleshooting'],
          },
          {
            to: '/users-and-access/users',
            from: ['/users', '/xo5/users'],
          },
          {
            to: '/guides/v2v-migration-guide',
            from: ['/v2v-migration-guide', '/xo5/v2v-migration-guide'],
          },
          {
            to: '/guides/windows-templates',
            from: '/windows-templates',
          },
          {
            to: '/manage-your-infrastructure/vm-templates',
            from: ['/vm-templates', '/xo5/vm-templates'],
          },
          {
            to: '/discover-fragata/whatsnew',
            from: '/xo6/whatsnew',
          },
          {
            to: '/discover-fragata/fragata-vs-classic',
            from: '/xo6/xo6vsxo5',
          },
          {
            to: '/discover-fragata/gettingstarted',
            from: '/xo6/gettingstarted',
          },
          {
            to: '/discover-fragata/coreconcepts',
            from: '/xo6/coreconcepts',
          },
          {
            to: '/manage-your-infrastructure/management',
            from: '/xo6/management',
          },
          {
            to: '/manage-your-infrastructure/manage_infrastructure',
            from: '/xo5/manage_infrastructure',
          },
          {
            to: '/manage-your-infrastructure/ipmi-plugin',
            from: '/xo5/ipmi-plugin',
          },
          {
            to: '/backups-and-dr/backup',
            from: '/backup',
          },
          {
            to: '/backups-and-dr/scale-and-security/distributed_backups',
            from: '/distributed_backups',
          },
          {
            to: '/project/project',
            from: '/project',
          },
          {
            to: '/project/contributing',
            from: '/contributing',
          },
          {
            to: '/project/licenses',
            from: '/licenses',
          },
          {
            to: '/project/glossary',
            from: '/glossary',
          },
        ],
      },
    ],
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // "Last updated on…" stamp at the bottom of every page, from
          // the git history of each file.
          showLastUpdateTime: true,
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/6a8i/fragata-orchestrator/tree/main/docs/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/logo.png',
    navbar: {
      title: 'Fragata Documentation',
      logo: { alt: 'Fragata logo', src: 'img/logo.png', href: '/' },
      items: [
        { href: 'https://github.com/6a8i/fragata-orchestrator', label: 'GitHub', position: 'right' },
        { to: 'https://docs.xcp-ng.org/', label: 'XCP-ng docs', position: 'right', target: '_self' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'Introduction', href: '/' },
            { label: 'Installation', href: '/getting-started/install-from-sources' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Discussions', href: 'https://github.com/6a8i/fragata-orchestrator/discussions' },
            { label: 'Issues', href: 'https://github.com/6a8i/fragata-orchestrator/issues' },
          ],
        },
        {
          title: 'More',
          items: [{ label: 'GitHub', href: 'https://github.com/6a8i/fragata-orchestrator' }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fragata contributors. Portions Copyright © Vates SAS. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['toml', 'ini', 'nginx', 'apacheconf'],
    },
  } satisfies Preset.ThemeConfig,

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
}
