---
slug: /
sidebar_position: 1
sidebar_label: Introduction
---

# Fragata in a nutshell

Fragata is the complete solution to **visualize, manage, back up and delegate** your Fragata Host, XCP-ng or XenServer infrastructure: any number of pools, on any site, from one place. **No agent** is required for it to work. It is fully open source, and installed from its sources in a few minutes.

<UiShot dark="/img/xo6/lab-dashboard.webp" alt="Fragata: one dashboard for every pool, host and VM you manage" url="https://your-fragata/v6/#/dashboard" />

Everything goes through Fragata, and everything that talks to your infrastructure talks to Fragata:

<Schema label="Fragata at the center of your infrastructure" legend={[["#6aabf0", "Fragata"], ["#8e83fe", "Fragata Host"], ["#56c288", "VMs"], ["#e0a94a", "backup"], ["#5ac8c8", "V2V"]]} maxWidth="760px">
<svg viewBox="0 0 680 380" role="img" aria-label="Users and automation tools drive Fragata, which manages any number of Fragata Host pools, streams backups to a repository, keeps disaster recovery copies and imports VMware VMs with V2V">
{/* Who talks to Fragata: humans and automation. */}
<a href="/discover-fragata/gettingstarted" aria-label="The Fragata web interface">
<rect x="20" y="12" width="170" height="62" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)"/>
<text x="105" y="37" fontSize="13.5" fill="#c6d2e1" textAnchor="middle">Your team</text>
<text x="105" y="56" fontSize="11.5" fill="#7a8699" textAnchor="middle">Web UI · any browser</text>
</a>
<a href="/automation/terraform-provider" aria-label="Automation and DevOps tools">
<rect x="205" y="12" width="265" height="62" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)"/>
<text x="337" y="37" fontSize="13.5" fill="#c6d2e1" textAnchor="middle">Automation</text>
<text x="337" y="56" fontSize="11.5" fill="#7a8699" textAnchor="middle">REST API · CLI · Terraform · Ansible</text>
</a>
<a href="/backups-and-dr/backup" aria-label="Backups">
<rect x="485" y="12" width="175" height="62" rx="8" fill="rgba(224,169,74,0.10)" stroke="#e0a94a"/>
<text x="572" y="37" fontSize="13.5" fill="#e0a94a" textAnchor="middle">Backup repository</text>
<text x="572" y="56" fontSize="11.5" fill="#7a8699" textAnchor="middle">S3 · NFS · SMB · Azure</text>
</a>
<g className="schema-flow" stroke="#7a8699" strokeWidth="1.4" strokeDasharray="5 4">
<line x1="105" y1="74" x2="240" y2="115"/>
<line x1="337" y1="74" x2="337" y2="115"/>
</g>
<line className="schema-flow" x1="450" y1="115" x2="560" y2="74" stroke="#e0a94a" strokeWidth="1.6" strokeDasharray="5 4"/>
{/* Fragata, the middleware. The band below the text stays empty so the
backup packet can cross the box. */}
<rect x="190" y="115" width="300" height="76" rx="8" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
<text x="340" y="139" fontSize="17" fill="#6aabf0" textAnchor="middle">Fragata</text>
<text x="340" y="156" fontSize="11.5" fill="#7a8699" textAnchor="middle">backup · DR · V2V · load balancing</text>
<text x="340" y="172" fontSize="11.5" fill="#7a8699" textAnchor="middle">Web UI · REST API · CLI</text>
{/* VMware cluster: the V2V source, on a 36s cycle. It appears, Fragata
grows a connection wire to it, the VM is converted (the teal copy
rides through Fragata and lands green in Pool 1 while the original
fades), then the empty cluster and its wire disappear: Fragata connects
to VMware only for the migration. */}
<a className="schema-live" href="/guides/v2v-migration-guide" aria-label="Migrate from VMware with V2V" opacity="0">
<animate attributeName="opacity" dur="36s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.111;0.125;0.41;0.45;1"/>
<rect x="20" y="115" width="140" height="62" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5"/>
<text x="30" y="132" fontSize="12.5" fill="#7a8699">VMware cluster</text>
<g className="schema-live" opacity="1">
<animate attributeName="opacity" dur="36s" repeatCount="indefinite"
        values="1;1;0;0" keyTimes="0;0.347;0.36;1"/>
<rect x="70" y="141" width="40" height="24" rx="4" fill="rgba(90,200,200,0.14)" stroke="#5ac8c8"/>
<text x="90" y="157" fontSize="12.5" fill="#5ac8c8" textAnchor="middle">VM</text>
</g>
</a>
{/* The connection only exists while the cluster does: the teal wire
grows out of Fragata toward it, and vanishes with it. */}
<line className="schema-flow schema-transient" x1="160" y1="146" x2="190" y2="146" stroke="#5ac8c8" strokeWidth="1.4" strokeDasharray="5 4" opacity="0">
<animate attributeName="x1" dur="36s" repeatCount="indefinite"
      values="190;190;160;160" keyTimes="0;0.139;0.18;1"/>
<animate attributeName="opacity" dur="36s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.139;0.15;0.41;0.45;1"/>
</line>
<a href="/backups-and-dr/backup-types/full_replication" aria-label="Full replication">
<rect x="520" y="115" width="140" height="62" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5"/>
<text x="530" y="132" fontSize="12.5" fill="#7a8699">DR site</text>
<g opacity="0.45">
<rect x="570" y="141" width="40" height="24" rx="4" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
<text x="590" y="157" fontSize="12.5" fill="#56c288" textAnchor="middle">VM</text>
</g>
</a>
<line className="schema-flow" x1="490" y1="146" x2="520" y2="146" stroke="#6aabf0" strokeWidth="1.6" strokeDasharray="5 4"/>
{/* Pools: Fragata manages any number of them, anywhere. */}
<g className="schema-flow" stroke="#6aabf0" strokeWidth="1.6" strokeDasharray="5 4">
<line x1="280" y1="191" x2="170" y2="235"/>
<line x1="400" y1="191" x2="510" y2="235"/>
</g>
<line className="schema-flow" x1="340" y1="191" x2="340" y2="235" stroke="#6aabf0" strokeOpacity="0.7" strokeWidth="1.6" strokeDasharray="5 4"/>
<rect x="328" y="235" width="24" height="136" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5"/>
<text x="340" y="310" fontSize="18" fill="#7a8699" textAnchor="middle">…</text>
<g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
<rect x="20" y="235" width="300" height="136" rx="10"/>
<rect x="360" y="235" width="300" height="136" rx="10"/>
</g>
<text x="36" y="260" fontSize="14.5" fill="#7a8699">Pool 1 · Paris</text>
<text x="376" y="260" fontSize="14.5" fill="#7a8699">Pool 12 · Amsterdam</text>
<g fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.8">
<rect x="48" y="288" width="40" height="24" rx="4"/>
<rect x="96" y="288" width="40" height="24" rx="4"/>
<rect x="388" y="288" width="40" height="24" rx="4"/>
<rect x="436" y="288" width="40" height="24" rx="4"/>
</g>
<g fontSize="12.5" fill="#56c288" textAnchor="middle">
<text x="68" y="304">VM</text><text x="116" y="304">VM</text>
<text x="408" y="304">VM</text><text x="456" y="304">VM</text>
</g>
{/* Live migration, across pools and sites. */}
<g className="schema-hop" style={{'--schema-hop-x': '388px', '--schema-hop-dur': '16s', '--schema-hop-delay': '-7s'}}>
<rect x="144" y="288" width="40" height="24" rx="4" fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.8"/>
<text x="164" y="304" fontSize="12.5" fill="#56c288" textAnchor="middle">VM</text>
</g>
{/* The converted VM: lands green in Pool 1, displaced by the next
arrival one cycle later (park cycle aligned with the flight). */}
<g className="schema-park" style={{'--schema-park-dur': '36s', '--schema-park-delay': '12.5s'}}>
<rect x="192" y="288" width="40" height="24" rx="4" fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.8"/>
<text x="212" y="304" fontSize="12.5" fill="#56c288" textAnchor="middle">VM</text>
</g>
<g fill="rgba(142,131,254,0.14)" stroke="#8e83fe" strokeOpacity="0.85">
<rect x="36" y="326" width="268" height="26" rx="5"/>
<rect x="376" y="326" width="268" height="26" rx="5"/>
</g>
<g fontSize="13.5" fill="#8e83fe" textAnchor="middle">
<text x="170" y="344">Fragata Hosts</text>
<text x="510" y="344">Fragata Hosts</text>
</g>
{/* A backup rides from a VM through Fragata to the repository. It hovers a
few pixels above its VM before departing. */}
<g className="schema-packet" opacity="0">
<rect x="-31" y="-8" width="62" height="16" rx="4" fill="rgba(224,169,74,0.18)" stroke="#e0a94a"/>
<text x="0" y="3.5" fontSize="10" fill="#e0a94a" textAnchor="middle">VM backup</text>
<animateMotion begin="2s" dur="15s" repeatCount="indefinite" calcMode="linear"
      path="M456,274 L510,235 L400,191 L445,181 L455,120 L560,66"
      keyPoints="0;0;1;1" keyTimes="0;0.12;0.34;1"/>
<animate attributeName="opacity" begin="2s" dur="15s" repeatCount="indefinite"
      values="0;1;1;0;0" keyTimes="0;0.05;0.31;0.35;1"/>
</g>
{/* DR sync: a dimmed 1:1 copy of the leftmost Pool 1 VM is born on
the original (which never moves), rides the management line up
through Fragata's band, exits right along the DR wire and fades into
the parked standby. */}
<g className="schema-packet" opacity="0">
<rect x="-20" y="-12" width="40" height="24" rx="4" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
<text x="0" y="4" fontSize="12.5" fill="#56c288" textAnchor="middle">VM</text>
<animateMotion dur="36s" repeatCount="indefinite" calcMode="linear"
      path="M68,300 L170,235 L280,191 L330,183 L450,183 L490,157 L590,153"
      keyPoints="0;0;1;1" keyTimes="0;0.68;0.76;1"/>
<animate attributeName="opacity" dur="36s" repeatCount="indefinite"
      values="0;0;0.5;0.5;0;0" keyTimes="0;0.667;0.68;0.74;0.765;1"/>
</g>
{/* The V2V conversion in flight: teal on departure, green on arrival
(the parked VM above takes over at landing). */}
<g className="schema-packet" opacity="0">
<rect x="-20" y="-12" width="40" height="24" rx="4" fill="rgba(90,200,200,0.14)" stroke="#5ac8c8"/>
<text x="0" y="4" fontSize="12.5" fill="#5ac8c8" textAnchor="middle">VM</text>
<animateMotion dur="36s" repeatCount="indefinite" calcMode="linear"
      path="M90,153 L160,147 L230,183 L280,191 L170,235 L212,300"
      keyPoints="0;0;1;1" keyTimes="0;0.25;0.347;1"/>
<animate attributeName="opacity" dur="36s" repeatCount="indefinite"
      values="0;0;0.9;0.9;0;0" keyTimes="0;0.25;0.26;0.34;0.35;1"/>
</g>
</svg>
</Schema>

## Start here

<CardGrid>
<LinkCard title="Install Fragata" href="/getting-started/install-from-sources">Build it from the sources and have it running in about fifteen minutes.</LinkCard>
<LinkCard title="Discover Fragata" href="/discover-fragata/gettingstarted">Tour the new interface: tree view, dashboards, consoles.</LinkCard>
<LinkCard title="Set up backups" href="/backups-and-dr/backup">Rolling snapshots, incremental backups, replication and more.</LinkCard>
<LinkCard title="Migrate from VMware" href="/guides/v2v-migration-guide">Import your ESXi VMs directly into your pools with V2V.</LinkCard>
<LinkCard title="Automate everything" href="/automation/restapi">REST API, CLI, Terraform, Ansible, Pulumi and more.</LinkCard>
<LinkCard title="Get help" href="https://github.com/6a8i/fragata-orchestrator/discussions">Ask the community, or report a bug on GitHub.</LinkCard>
</CardGrid>

## What Fragata does for you

- **Administration**: complete control of your pools, hosts, VMs, storage and networks, from a [modern web interface](/discover-fragata/gettingstarted.md) or from Fragata Classic.
- **Backup and disaster recovery**: rolling snapshots, full and incremental backups, replication, mirroring and immutability, toward S3, NFS, SMB or Azure targets. See [Backups](/backups-and-dr/backups-in-fragata.md).
- **Migration from VMware**: [V2V](/guides/v2v-migration-guide.md) imports your ESXi VMs directly into your pools.
- **Automation**: a [REST API](automation/restapi.md), a CLI, and community providers for [Terraform](automation/terraform-provider.md), [Ansible](automation/ansible.md), [Pulumi](automation/pulumi-provider.md), [Packer](automation/packer-provider.md) and [PowerShell](automation/powershell-module.md), plus [Kubernetes](automation/kubernetes.md) setup.
- **Delegation**: users, groups and [RBAC](/users-and-access/rbac.md) to give each team exactly the access it needs.
- **Scale**: one Fragata manages any number of pools on any number of sites, over LAN or WAN.

## Fragata and Fragata Host

This documentation covers Fragata itself, the orchestrator. For installing and operating the hypervisor, hosts, storage and networks, hardware compatibility, see the [XCP-ng documentation](https://docs.xcp-ng.org/) that Fragata Host builds upon.

## Two interfaces, one product

Fragata currently ships two web interfaces on the same server and the same data: **Fragata**, the new default interface, and **Fragata Classic**, which remains available for the operations Fragata does not cover yet. Read [Fragata and Fragata Classic](/discover-fragata/fragata-vs-classic.md) to see what lives where.
