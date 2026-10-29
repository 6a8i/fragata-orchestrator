---
sidebar_label: First steps
sidebar_position: 3
---

# Fragata Fleet at a glance

Fragata Fleet is the new generation of the Fragata Fleet web interface. Since its first official release, it is the default interface of your Fragata Fleet: log in as usual and you land in Fragata Fleet.

:::info
Fragata Fleet currently requires an administrator account: other users are redirected to Fleet Classic for now. Fragata Fleet and Fleet Classic run side by side on the same Fragata Fleet and manage the same infrastructure. You can switch to Fleet Classic at any time with the **Fleet Classic** link in the top-right corner, and some advanced operations open directly in Fleet Classic (they are clearly marked with an external-link icon). See [Fragata Fleet and Fleet Classic](xo6vsxo5.md) for the current split.
:::

## Accessing Fragata Fleet

Open your Fragata Fleet URL in a browser and log in with your usual credentials. Fragata Fleet is served as the default interface, and it is also directly reachable at `https://your-xo/v6/`.

<UiShot light="/img/xo6/dashboard-light.png" dark="/img/xo6/dashboard-dark.png" alt="The Fragata Fleet dashboard right after login" url="https://your-xo/v6/#/dashboard" />

On first login, a welcome message summarizes the state of the project: Fragata Fleet is an official release under active development, new capabilities land continuously, and everything you do not find yet in Fragata Fleet is one click away in Fleet Classic.

## The layout

The interface is built around three areas:

- **The tree view**, on the left: your whole infrastructure as a tree, from your Fragata Fleet down to every pool, host and VM. It is the main way to navigate.
- **The main area**: the page of the selected object, organized in tabs (dashboard, console, networks, tasks and so on, depending on the object).
- **The side panel**, on the right of tables: click the eye icon on a row to inspect an object without leaving the list.

The top bar carries the **Fleet Classic** switch, the **Third party apps** menu (with the EasyVirt DC Scope and DC NetScope integrations), a quick view of the last 24 hours of tasks, and your account menu.

## Make it yours

The **Settings** page (from the account menu) lets you pick a light, dark or automatic color mode, one of five interface themes (default, nord, solarized, dracula, monokai), and your language: the interface is translated into 21 languages, with community translations managed on Weblate.

## Navigating with the tree view

The tree view lists every connected pool with its hosts and VMs, each with a live status icon. Click any object to open its page. The counter next to a host or pool tells you how many VMs live there at a glance.

The **search field** filters the whole tree as you type, which is the fastest way to reach an object in a large infrastructure:

<UiShot light="/img/xo6/treeview-search-light.png" dark="/img/xo6/treeview-search-dark.png" alt="Filtering the tree view" url="https://your-xo/v6/#/dashboard" />

Next to the tree view, the **Administration** tab of the sidebar gives access to user management (see [Users and administration](../manage-your-infrastructure/management.md#users-and-administration)).

## Your first tour

A good way to discover Fragata Fleet in a few minutes:

1. Start on the **dashboard**: it aggregates the health of everything Fragata Fleet manages, including pool, host and VM status, resource totals, missing patches, alarms and backup health. See [How Fragata Fleet is organized](coreconcepts.md).
2. Click a **pool** in the tree view: same idea, scoped to the pool, with its networks, storage and hosts one tab away.
3. Click a **VM**: quick info, live console, snapshots, backup protection status, all in tabs.
4. Open the **Tasks** tab at any level: every operation, API call and authentication is tracked there.

When something is not available in Fragata Fleet yet, follow the marked links to Fleet Classic and finish the operation there: both interfaces act on the same objects instantly.
