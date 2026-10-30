# Kubernetes

## Introduction

Fragata does not ship a Kubernetes installer: a cluster is just a set of VMs, and VMs are what Fragata and Fragata Host are good at. This page describes a simple way to run an official Kubernetes distribution called **MicroK8s** (maintained by Canonical) on Fragata VMs, and how to connect the cluster to Fragata with the community-maintained **Cloud Controller Manager**.

:::tip
One of the key benefits of MicroK8s is its automatic security updates. For example, patch releases (like 1.30.x to 1.30.x+1) are applied automatically. This saves Kubernetes admins a lot of time and effort.
:::

### Networking and CNI

MicroK8s uses **Calico**, its default Container Network Interface (CNI) plugin, to handle container networking. Calico provides secure networking and network policies for Kubernetes, and its default configuration is ready for production: no additional setup required.

If you need to adjust the Calico setup, check the [MicroK8s documentation](https://microk8s.io/docs/change-cidr) for step-by-step instructions.

:::note
The default CIDR for pods is `10.1.0.0/16`. All pods are assigned an IP address in that range.

The default service CIDR is `10.152.183.0/24`. `10.152.183.1` is reserved for the Kubernetes API, and `10.152.183.10` is used by CoreDNS.
:::

If these ranges overlap with your own network, change them before putting the cluster in production, following the MicroK8s documentation linked above.

## Before you start

Make sure your infrastructure meets these requirements:

- A running Fragata instance connected to a Fragata Host pool
- Enough resources to host the **control plane** and **worker nodes** (MicroK8s recommends 4 GB of RAM and 20 GB of disk per node; CPU and RAM can be [adjusted afterwards](#adjusting-vm-resources))
- A Debian 13 (or any Linux distribution supported by MicroK8s) VM template with **cloud-init**, see [Cloud-init and Cloudbase-init](../manage-your-infrastructure/vm-templates.md#cloud-init-and-cloudbase-init)
- Internet access from the node network: the nodes download the MicroK8s snap and its images
- For the [Cloud Controller Manager](#cloud-controller-manager): the Fragata instance must be reachable by the cluster nodes (VMs), via an FQDN or an IP address

## Creating the nodes

1. Create the VMs that will be the nodes of your cluster from your cloud-init template: one VM for a simple cluster, or three or more control plane nodes plus the workers you need for a highly available one. Give them a static IP address or a DHCP reservation, because the nodes must keep reaching each other.
2. Use a common tag on these VMs (for example the name of the cluster), so that you can easily find them all in Fragata.
3. Make sure each node can be reached over SSH.

:::tip
Creating the nodes by hand does not scale: describe them as code with the [Terraform provider](./terraform-provider.md) or the [Pulumi provider](./pulumi-provider.md), and install MicroK8s with cloud-init or [Ansible](./ansible.md).
:::

## Installing MicroK8s

On every node, install `snapd` then MicroK8s, choosing the Kubernetes version (channel) you want:

<Terminal shell title="every node — install MicroK8s">{`
sudo apt update && sudo apt install -y snapd
sudo snap install microk8s --classic --channel=1.33/stable
sudo usermod -a -G microk8s $USER
`}</Terminal>

Log out and back in for the group change to apply, then wait for the node to be ready:

<Terminal shell title="every node — wait for MicroK8s">{`
microk8s status --wait-ready
`}</Terminal>

### Building the cluster

On the first control plane node, ask for a join command for each node you want to add:

<Terminal shell title="first control plane node — generate a join command">{`
microk8s add-node
`}</Terminal>

It prints a `microk8s join <ip>:25000/<token>/<hash>` command. Run it on the node to add. For a **worker** node, append `--worker` to the command, so that it does not run a control plane. Repeat `microk8s add-node` for every node, because each token is valid only once.

A cluster with three or more control plane nodes is highly available: MicroK8s enables its `ha-cluster` add-on automatically. For the control plane to keep a stable address when a node fails, put a virtual IP in front of it, for instance with [Kube-VIP](https://kube-vip.io/).

### Add-ons

In addition to the core components of the Kubernetes control plane, you will most likely want these add-ons, enabled on a control plane node:

<Terminal shell title="control plane node — enable the usual add-ons">{`
microk8s enable dns helm3 rbac
`}</Terminal>

- **DNS:** deploys CoreDNS for internal address resolution.
- **Helm:** installs [Helm 3](https://helm.sh/), the Kubernetes package manager.
- **RBAC:** enables [Role-based access control (RBAC)](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) for authorization.

## Cloud Controller Manager {#cloud-controller-manager}

The [Cloud Controller Manager](https://github.com/vatesfr/xenorchestra-cloud-controller-manager) (CCM) is a community-maintained tool that bridges your Kubernetes cluster and the Fragata instance managing its VMs. In short, it:

- **initializes nodes**: sets the `providerID`, node addresses, taints, and Fragata labels (pool, host) on each node
- **manages the node lifecycle**: when a VM is deleted from Fragata, the associated node is automatically removed from the cluster
- **keeps labels in sync**: Fragata metadata is periodically reconciled back to the Kubernetes nodes

The [CCM repository](https://github.com/vatesfr/xenorchestra-cloud-controller-manager) is the source of truth for its features, configuration and installation (manifests and Helm chart). For the CCM to function properly, the Fragata instance must be reachable by the cluster nodes (VMs) via either an FQDN or IP address, and the CCM needs an API token to authenticate.

### Creating a token

Create an API token for the user the CCM will act as (see [REST API authentication](./restapi.md#authentication)), with a limited validity, then use it in the CCM configuration:

<Terminal shell title="create a token valid for 6 months">{`
# replace with your Fragata URL; add -k if the certificate is self-signed
curl -X 'POST' \\
  -u 'your-user@example.com:your-password' \\
  'https://your-fragata.example.com/rest/v0/users/me/authentication_tokens' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{ "description": "token for CCM", "expiresIn": "6 months" }' | jq -r '.token.id'
`}</Terminal>

:::warning
You will need to renew this token and update the `xenorchestra-cloud-controller-manager` secret in the Kubernetes cluster before it expires to maintain CCM functionality.
:::

### Viewing the current token

To view the current token configuration in the secret:

<Terminal shell title="control plane node — show the CCM configuration">{`
kubectl get secret xenorchestra-cloud-controller-manager \\
  --namespace=kube-system \\
  -o json | jq -r '.data["config.yaml"]' | base64 -d
`}</Terminal>

### Refreshing the API token

To refresh the token, generate a new one using the Fragata API and update the Kubernetes secret:

<Terminal shell title="renew the CCM token">{`
# 1. Generate a new token (replace with your Fragata URL)
# add -k if the certificate is self-signed
NEW_TOKEN=$(curl -X 'POST' \\
  --header 'Cookie: authenticationToken=<current-token>' \\
  'https://your-fragata.example.com/rest/v0/users/me/authentication_tokens' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{ "description": "token for CCM", "expiresIn": "6 months" }' | jq -r '.token.id')
# 2. Update the secret with the new token
kubectl get secret xenorchestra-cloud-controller-manager \\
  --namespace=kube-system \\
  -o json | \\
  jq --arg token "$NEW_TOKEN" '.data["config.yaml"] |= (@base64d | sub("token: .+"; "token: " + $token) | @base64)' | \\
  kubectl apply -f -
`}</Terminal>

## Using your cluster

### Connecting to your cluster

Once the cluster and its VMs are ready, SSH into a control plane node. From there, you can manage your Kubernetes cluster:

<Terminal title="control plane node — list the cluster nodes">{`
microk8s kubectl get nodes
NAME       STATUS   ROLES    AGE   VERSION
cp-1       Ready    <none>   40m   v1.33.0
cp-2       Ready    <none>   30m   v1.33.0
cp-3       Ready    <none>   31m   v1.33.0
worker-1   Ready    <none>   31m   v1.33.0
worker-2   Ready    <none>   31m   v1.33.0
worker-3   Ready    <none>   31m   v1.33.0
`}</Terminal>

### Adjusting VM resources {#adjusting-vm-resources}

The VMs of your Kubernetes cluster are regular VMs: you can adjust their CPU and RAM at any time in Fragata to match your workload needs. This gives you the flexibility to fine-tune performance or cut costs, depending on what your use case demands.

### Keeping your cluster updated

:::tip
MicroK8s handles **patch releases** automatically by design, so you always benefit from the latest security fixes and improvements without manual intervention.
:::

For **minor version upgrades** (for example, from `1.30.x` to `1.31.x`), follow the official [MicroK8s upgrade guide](https://microk8s.io/docs/upgrading). These upgrades typically involve checking the current version, refreshing the MicroK8s snap to the desired channel, and restarting the nodes if necessary:

<Terminal shell title="node — upgrade MicroK8s to a new minor release">{`
# Check current version
microk8s version
# Upgrade to a new minor release
sudo snap refresh microk8s --channel=1.31/stable
`}</Terminal>

:::warning
Always review the MicroK8s documentation for the most up-to-date instructions before performing a minor upgrade.
:::

### Managing your cluster with external tools

To manage the cluster with external tools (`kubectl`, Lens, etc.), retrieve its `kubeconfig` from a control plane node:

<Terminal title="control plane node — print the kubeconfig">{`
microk8s config
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: [...]
    server: https://10.1.134.51:16443
  name: microk8s-cluster
contexts:
- context:
    cluster: microk8s-cluster
    user: admin
  name: microk8s
current-context: microk8s
kind: Config
preferences: {}
users:
- name: admin
  user:
    client-certificate-data: LS0tLS1CRU[...]
    client-key-data: LS0tLS1CRUdJ[...]
`}</Terminal>

## Best Practices

When deploying Kubernetes clusters, it's important to plan for performance and reliability:

- Always allocate enough CPU and memory resources for both control plane and worker nodes. Using three control plane nodes ensures high availability in production environments.
- Place the VMs on shared storage to allow live migration if needed.
- For security, restrict SSH and API server access, and consider adding network policies once the cluster is running.

## Related links

- [Cloud Controller Manager](https://github.com/vatesfr/xenorchestra-cloud-controller-manager) (community-maintained)
- [Kubernetes official documentation](https://kubernetes.io/docs/home/)
- [MicroK8s official documentation](https://microk8s.io/docs)
- [CoreDNS official documentation](https://coredns.io/manual/toc/)
