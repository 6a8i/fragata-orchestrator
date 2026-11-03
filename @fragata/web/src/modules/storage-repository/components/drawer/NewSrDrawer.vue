<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:new-sr') }}
    </template>

    <template #content>
      <div class="new-sr-drawer">
        <div class="section">
          <UiTitle>{{ t('general-information') }}</UiTitle>
          <div class="row">
            <!-- XOSTOR spans the hosts of the pool: they are picked with their disks below -->
            <VtsInputWrapper v-if="srKind !== 'linstor'" :label="t('host')" :message="errorFor('host')">
              <VtsSelect :id="hostSelectId" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('type')">
              <VtsSelect :id="typeSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('name')" :message="errorFor('name')">
              <UiInput v-model.trim="name" accent="brand" required />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('description')">
              <UiInput v-model.trim="description" accent="brand" />
            </VtsInputWrapper>
          </div>
        </div>

        <!-- NFS, and ISO library over NFS -->
        <div v-if="srKind === 'nfs' || (srKind === 'iso' && isoSource === 'nfs')" class="section">
          <UiTitle>{{ t('sr-form:nfs-server') }}</UiTitle>
          <div v-if="srKind === 'iso'" class="row">
            <VtsInputWrapper :label="t('sr-form:iso-source')">
              <VtsSelect :id="isoSourceSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:server')" :message="errorFor('server')">
              <UiInput v-model.trim="server" accent="brand" placeholder="192.168.1.10" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('sr-form:nfs-version')">
              <VtsSelect :id="nfsVersionSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:export-path')" :message="errorFor('path')">
              <VtsSelect v-if="nfsExports.length > 0" :id="nfsExportSelectId" accent="brand" />
              <UiInput v-else v-model.trim="path" accent="brand" placeholder="/exports/vms" />
            </VtsInputWrapper>
            <UiButton
              accent="brand"
              variant="secondary"
              size="medium"
              left-icon="fa:magnifying-glass"
              :busy="isProbing"
              :disabled="server === '' || hostId === undefined"
              @click="discoverNfsExports()"
            >
              {{ t('sr-form:discover') }}
            </UiButton>
          </div>
        </div>

        <!-- SMB, and ISO library over SMB -->
        <div v-if="srKind === 'smb' || (srKind === 'iso' && isoSource === 'smb')" class="section">
          <UiTitle>{{ t('sr-form:smb-share') }}</UiTitle>
          <div v-if="srKind === 'iso'" class="row">
            <VtsInputWrapper :label="t('sr-form:iso-source')">
              <VtsSelect :id="isoSourceSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:share')" :message="errorFor('server')">
              <UiInput v-model.trim="server" accent="brand" placeholder="//192.168.1.10/share" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('username')">
              <UiInput v-model.trim="username" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('password')">
              <UiInput v-model="password" type="password" accent="brand" />
            </VtsInputWrapper>
          </div>
        </div>

        <!-- ISO library on a local path -->
        <div v-if="srKind === 'iso' && isoSource === 'local'" class="section">
          <UiTitle>{{ t('sr-form:local-path') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:iso-source')">
              <VtsSelect :id="isoSourceSelectId" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('sr-form:path')" :message="errorFor('path')">
              <UiInput v-model.trim="path" accent="brand" placeholder="/opt/isos" />
            </VtsInputWrapper>
          </div>
        </div>

        <!-- iSCSI -->
        <div v-if="srKind === 'lvmoiscsi'" class="section">
          <UiTitle>{{ t('sr-form:iscsi-target') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:target-address')" :message="errorFor('server')">
              <UiInput v-model.trim="server" accent="brand" placeholder="192.168.1.20" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('port')">
              <UiInput v-model="port" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:chap-user')">
              <UiInput v-model.trim="username" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('sr-form:chap-password')">
              <UiInput v-model="password" type="password" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:iqn')" :message="errorFor('iqn')">
              <VtsSelect :id="iqnSelectId" accent="brand" />
            </VtsInputWrapper>
            <UiButton
              accent="brand"
              variant="secondary"
              size="medium"
              left-icon="fa:magnifying-glass"
              :busy="isProbing"
              :disabled="server === '' || hostId === undefined"
              @click="discoverIqns()"
            >
              {{ t('sr-form:discover') }}
            </UiButton>
          </div>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:lun')" :message="errorFor('lun')">
              <VtsSelect :id="lunSelectId" accent="brand" />
            </VtsInputWrapper>
            <UiButton
              accent="brand"
              variant="secondary"
              size="medium"
              left-icon="fa:magnifying-glass"
              :busy="isProbing"
              :disabled="iqn === undefined"
              @click="discoverLuns()"
            >
              {{ t('sr-form:discover') }}
            </UiButton>
          </div>
        </div>

        <!-- local LVM / EXT -->
        <div v-if="srKind === 'lvm' || srKind === 'ext'" class="section">
          <UiTitle>{{ t('sr-form:local-device') }}</UiTitle>
          <UiAlert accent="warning">{{ t('sr-form:local-device-warning') }}</UiAlert>
          <VtsInputWrapper :label="t('sr-form:device')" :message="errorFor('device')">
            <UiInput v-model.trim="device" accent="brand" placeholder="/dev/sdb" />
          </VtsInputWrapper>
        </div>

        <!-- HBA -->
        <div v-if="srKind === 'lvmohba'" class="section">
          <UiTitle>{{ t('sr-form:hba-device') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:device')" :message="errorFor('lun')">
              <VtsSelect :id="hbaSelectId" accent="brand" />
            </VtsInputWrapper>
            <UiButton
              accent="brand"
              variant="secondary"
              size="medium"
              left-icon="fa:magnifying-glass"
              :busy="isProbing"
              :disabled="hostId === undefined"
              @click="discoverHba()"
            >
              {{ t('sr-form:discover') }}
            </UiButton>
          </div>
        </div>

        <!-- ZFS -->
        <div v-if="srKind === 'zfs'" class="section">
          <UiTitle>{{ t('sr-form:zfs-pool') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="t('sr-form:zfs-pool')" :message="errorFor('path')">
              <VtsSelect :id="zfsSelectId" accent="brand" />
            </VtsInputWrapper>
            <UiButton
              accent="brand"
              variant="secondary"
              size="medium"
              left-icon="fa:magnifying-glass"
              :busy="isProbing"
              :disabled="hostId === undefined"
              @click="discoverZfs()"
            >
              {{ t('sr-form:discover') }}
            </UiButton>
          </div>
        </div>

        <!-- XOSTOR (LINSTOR replicated over the disks of several hosts) -->
        <div v-if="srKind === 'linstor'" class="section">
          <UiTitle>{{ t('sr-form:xostor-disks') }}</UiTitle>
          <UiAlert accent="warning">{{ t('sr-form:xostor-warning') }}</UiAlert>
          <UiAlert v-if="isHaEnabled" accent="danger">{{ t('sr-form:xostor-ha-enabled') }}</UiAlert>
          <div class="xostor-toolbar">
            <span class="typo-body-regular-small">{{ t('sr-form:xostor-disks-hint') }}</span>
            <UiButton
              accent="brand"
              variant="secondary"
              size="medium"
              left-icon="fa:magnifying-glass"
              :busy="isProbing"
              :disabled="hosts.length === 0"
              @click="discoverXostorDisks()"
            >
              {{ t('sr-form:discover') }}
            </UiButton>
          </div>
          <div v-for="{ host, disks, error } in xostorHosts" :key="host.id" class="xostor-host">
            <span class="typo-body-bold">{{ host.name_label }}</span>
            <UiAlert v-if="error !== undefined" accent="danger">{{ error }}</UiAlert>
            <template v-else-if="disks !== undefined">
              <span v-if="disks.length === 0" class="typo-body-regular-small">
                {{ t('sr-form:xostor-no-disk') }}
              </span>
              <UiCheckbox
                v-for="disk in disks"
                :key="disk.path"
                accent="brand"
                :model-value="isDiskSelected(host.id, disk.path)"
                @update:model-value="toggleDisk(host.id, disk.path, $event === true)"
              >
                {{ `${disk.path} (${formatSize(disk.size, 1)})` }}
              </UiCheckbox>
            </template>
          </div>
          <UiAlert v-if="submitted && missingFields.has('disks')" accent="danger">
            {{ t('job:xostor-create:disks-required') }}
          </UiAlert>
          <div class="row">
            <VtsInputWrapper :label="t('provisioning')">
              <VtsSelect :id="provisioningSelectId" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="t('xostor:replication')" :message="replicationMessage">
              <VtsSelect :id="replicationSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <UiCheckbox v-model="ignoreFileSystems" accent="brand">
            {{ t('sr-form:xostor-ignore-file-systems') }}
          </UiCheckbox>
          <span v-if="xostorUsableSize > 0" class="typo-body-regular-small">
            {{ t('sr-form:xostor-usable-size', { size: formatSize(xostorUsableSize, 1) }) }}
          </span>
        </div>

        <UiAlert v-if="probeError !== undefined" accent="danger">{{ probeError }}</UiAlert>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { NewSrPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import type { NewXostorPayload } from '@/modules/storage-repository/jobs/xo-xostor-create.job.ts'
import {
  type IscsiIqn,
  type IscsiLun,
  type HbaDevice,
  type NfsExport,
  probeIscsiIqns,
  probeIscsiLuns,
  probeHba,
  probeNfs,
  probeZfs,
} from '@/modules/storage-repository/utils/sr-probe.util.ts'
import {
  getHostBlockDevices,
  getXostorUsableSize,
  type HostBlockDevice,
  isXostorCompatibleDisk,
  type XostorProvisioning,
} from '@/modules/storage-repository/utils/xostor.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { formatSize } from '@core/utils/size.util.ts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type SrKind = 'nfs' | 'smb' | 'lvmoiscsi' | 'lvmohba' | 'lvm' | 'ext' | 'zfs' | 'iso' | 'linstor'
type IsoSource = 'nfs' | 'smb' | 'local'
type Field = 'host' | 'name' | 'server' | 'path' | 'iqn' | 'lun' | 'device' | 'disks' | 'replication'

const { poolId, hostId: fixedHostId } = defineProps<{
  poolId: string
  // when set (host storage page), the SR is created on this host
  hostId?: string
}>()

const emit = defineEmits<{
  confirm: [payload: NewSrPayload | NewXostorPayload]
  cancel: []
}>()

const { t } = useI18n()

const { hostsByPool } = useXoHostCollection()
const { useGetPoolById } = useXoPoolCollection()

const hosts = computed<FrontXoHost[]>(() => hostsByPool.value.get(poolId as FrontXoHost['$pool']) ?? [])
const pool = useGetPoolById(() => poolId as FrontXoPool['id'])
// XOSTOR installs packages and restarts the toolstacks, which HA does not allow
const isHaEnabled = computed(() => pool.value?.HA_enabled === true)

const hostId = ref<string | undefined>(fixedHostId)
const srKind = ref<SrKind>('nfs')
const isoSource = ref<IsoSource>('nfs')
const name = ref('')
const description = ref('')
const server = ref('')
const path = ref('')
const nfsVersion = ref<string>('')
const username = ref('')
const password = ref('')
const port = ref<number | string>(3260)
const iqn = ref<string>()
const lun = ref<string>()
const device = ref('')

const nfsExports = ref<NfsExport[]>([])
const iqns = ref<IscsiIqn[]>([])
const luns = ref<IscsiLun[]>([])
const hbaDevices = ref<HbaDevice[]>([])
const zfsPools = ref<{ name: string; mountpoint: string }[]>([])
const isProbing = ref(false)
const probeError = ref<string>()
const submitted = ref(false)

// XOSTOR: the block devices of each host, the disks picked on each host (device paths)
const blockDevicesByHost = ref<Record<string, HostBlockDevice[]>>({})
const diskErrorByHost = ref<Record<string, string>>({})
const selectedDisksByHost = ref<Record<string, string[]>>({})
const provisioning = ref<XostorProvisioning>('thin')
const replication = ref<string>('')
const ignoreFileSystems = ref(false)

// a different target makes previous discoveries meaningless
watch([server, srKind, isoSource, hostId], () => {
  nfsExports.value = []
  iqns.value = []
  luns.value = []
  iqn.value = undefined
  hbaDevices.value = []
  zfsPools.value = []
  lun.value = undefined
  probeError.value = undefined
})

const { id: hostSelectId } = useFormSelect(hosts, {
  model: hostId,
  required: true,
  disabled: () => fixedHostId !== undefined,
  option: { label: 'name_label', value: 'id' },
})

const typeOptions = computed(() => [
  { id: 'nfs', label: t('sr-type:nfs'), value: 'nfs' as const },
  { id: 'smb', label: t('sr-type:smb'), value: 'smb' as const },
  { id: 'lvmoiscsi', label: t('sr-type:iscsi'), value: 'lvmoiscsi' as const },
  { id: 'lvmohba', label: t('sr-type:hba'), value: 'lvmohba' as const },
  { id: 'lvm', label: t('sr-type:local-lvm'), value: 'lvm' as const },
  { id: 'ext', label: t('sr-type:local-ext'), value: 'ext' as const },
  { id: 'zfs', label: t('sr-type:zfs'), value: 'zfs' as const },
  { id: 'iso', label: t('sr-type:iso'), value: 'iso' as const },
  { id: 'linstor', label: t('sr-type:xostor'), value: 'linstor' as const },
])

const { id: typeSelectId } = useFormSelect(typeOptions, {
  model: srKind,
  required: true,
  option: { label: 'label', value: 'value' },
})

const isoSourceOptions = computed(() => [
  { id: 'nfs', label: 'NFS', value: 'nfs' as const },
  { id: 'smb', label: 'SMB', value: 'smb' as const },
  { id: 'local', label: t('sr-form:local-path'), value: 'local' as const },
])

const { id: isoSourceSelectId } = useFormSelect(isoSourceOptions, {
  model: isoSource,
  required: true,
  option: { label: 'label', value: 'value' },
})

const nfsVersionOptions = computed(() => [
  { id: 'default', label: t('default-behavior'), value: '' },
  { id: '3', label: 'NFSv3', value: '3' },
  { id: '4', label: 'NFSv4', value: '4' },
  { id: '4.1', label: 'NFSv4.1', value: '4.1' },
])

const { id: nfsVersionSelectId } = useFormSelect(nfsVersionOptions, {
  model: nfsVersion,
  required: true,
  option: { label: 'label', value: 'value' },
})

const { id: nfsExportSelectId } = useFormSelect(nfsExports, {
  model: path,
  required: true,
  searchable: true,
  option: { id: 'path', label: 'path', value: 'path' },
})

const { id: iqnSelectId } = useFormSelect(iqns, {
  model: iqn,
  required: true,
  option: { id: 'iqn', label: item => `${item.iqn} (${item.ip})`, value: 'iqn' },
})

const { id: lunSelectId } = useFormSelect(luns, {
  model: lun,
  required: true,
  option: {
    id: 'scsiId',
    label: item => `LUN ${item.id} — ${item.vendor} ${item.serial}${item.size ? ` (${item.size})` : ''}`,
    value: 'scsiId',
  },
})

const { id: hbaSelectId } = useFormSelect(hbaDevices, {
  model: lun,
  required: true,
  option: {
    id: 'scsiId',
    label: item => `${item.vendor} ${item.serial} — ${item.path} (${formatSize(item.size, 1)})`,
    value: 'scsiId',
  },
})

const { id: zfsSelectId } = useFormSelect(zfsPools, {
  model: path,
  required: true,
  option: { id: 'name', label: pool => `${pool.name} (${pool.mountpoint})`, value: 'mountpoint' },
})

const provisioningOptions = computed(() => [
  { id: 'thin', label: t('xostor:provisioning-thin'), value: 'thin' as const },
  { id: 'thick', label: t('xostor:provisioning-thick'), value: 'thick' as const },
])

const { id: provisioningSelectId } = useFormSelect(provisioningOptions, {
  model: provisioning,
  required: true,
  option: { label: 'label', value: 'value' },
})

// 1 to the number of hosts of the pool; the disks picked must then be on at least that many hosts
const replicationOptions = computed(() =>
  Array.from({ length: Math.max(hosts.value.length, 1) }, (_, index) => {
    const value = String(index + 1)
    return { id: value, label: value, value }
  })
)

watch(
  () => hosts.value.length,
  nHosts => {
    if (replication.value === '' || Number(replication.value) > Math.max(nHosts, 1)) {
      replication.value = String(Math.max(Math.min(2, nHosts), 1))
    }
  },
  { immediate: true }
)

const { id: replicationSelectId } = useFormSelect(replicationOptions, {
  model: replication,
  required: true,
  option: { label: 'label', value: 'value' },
})

const xostorHosts = computed(() =>
  hosts.value.map(host => ({
    host,
    disks: blockDevicesByHost.value[host.id]?.filter(isXostorCompatibleDisk),
    error: diskErrorByHost.value[host.id],
  }))
)

const xostorDisksByHost = computed(() => {
  const disksByHost: Record<string, string[]> = {}
  for (const { host, disks } of xostorHosts.value) {
    const available = new Set(disks?.map(disk => disk.path))
    const selected = (selectedDisksByHost.value[host.id] ?? []).filter(path => available.has(path))
    if (selected.length > 0) {
      disksByHost[host.id] = selected
    }
  }
  return disksByHost
})

const nXostorHosts = computed(() => Object.keys(xostorDisksByHost.value).length)

const xostorUsableSize = computed(() =>
  getXostorUsableSize(
    xostorHosts.value.map(({ host, disks }) => {
      const selected = new Set(xostorDisksByHost.value[host.id] ?? [])
      return (disks ?? []).filter(disk => selected.has(disk.path)).reduce((total, disk) => total + disk.size, 0)
    }),
    Number(replication.value)
  )
)

function isDiskSelected(hostId: string, path: string) {
  return selectedDisksByHost.value[hostId]?.includes(path) ?? false
}

function toggleDisk(hostId: string, path: string, selected: boolean) {
  const current = (selectedDisksByHost.value[hostId] ?? []).filter(candidate => candidate !== path)
  selectedDisksByHost.value = { ...selectedDisksByHost.value, [hostId]: selected ? [...current, path] : current }
}

function discoverXostorDisks() {
  return probe(async () => {
    const devicesByHost: Record<string, HostBlockDevice[]> = {}
    const errorByHost: Record<string, string> = {}
    await Promise.all(
      hosts.value.map(async host => {
        // a halted host cannot list its disks
        if (host.power_state !== 'Running') {
          errorByHost[host.id] = t('host:status:halted')
          return
        }
        try {
          devicesByHost[host.id] = await getHostBlockDevices(host.id)
        } catch (error) {
          errorByHost[host.id] = t('sr-form:discovery-failed', { error: (error as Error).message })
        }
      })
    )
    blockDevicesByHost.value = devicesByHost
    diskErrorByHost.value = errorByHost
  })
}

// list the disks as soon as XOSTOR is chosen
watch(srKind, kind => {
  if (kind === 'linstor' && Object.keys(blockDevicesByHost.value).length === 0 && !isProbing.value) {
    discoverXostorDisks()
  }
})

async function probe(fn: () => Promise<void>) {
  isProbing.value = true
  probeError.value = undefined
  try {
    await fn()
  } catch (error) {
    probeError.value = t('sr-form:discovery-failed', { error: (error as Error).message })
  } finally {
    isProbing.value = false
  }
}

function discoverNfsExports() {
  return probe(async () => {
    nfsExports.value = await probeNfs(hostId.value!, server.value, nfsVersion.value)
    if (nfsExports.value.length === 0) {
      probeError.value = t('sr-form:nothing-found')
    }
  })
}

function discoverIqns() {
  return probe(async () => {
    iqns.value = await probeIscsiIqns(hostId.value!, iscsiTarget())
    if (iqns.value.length === 0) {
      probeError.value = t('sr-form:nothing-found')
    }
  })
}

function discoverLuns() {
  return probe(async () => {
    luns.value = await probeIscsiLuns(hostId.value!, { ...iscsiTarget(), targetIqn: iqn.value! })
    if (luns.value.length === 0) {
      probeError.value = t('sr-form:nothing-found')
    }
  })
}

function discoverHba() {
  return probe(async () => {
    hbaDevices.value = await probeHba(hostId.value!)
    if (hbaDevices.value.length === 0) {
      probeError.value = t('sr-form:nothing-found')
    }
  })
}

function discoverZfs() {
  return probe(async () => {
    zfsPools.value = await probeZfs(hostId.value!)
    if (zfsPools.value.length === 0) {
      probeError.value = t('sr-form:zfs-nothing-found')
    }
  })
}

function iscsiTarget() {
  return {
    targetIp: server.value,
    ...(port.value !== '' && { port: Number(port.value) }),
    ...(username.value !== '' && { chapUser: username.value, chapPassword: password.value }),
  }
}

const missingFields = computed<Set<Field>>(() => {
  const missing = new Set<Field>()
  const kind = srKind.value
  if (hostId.value === undefined && kind !== 'linstor') missing.add('host')
  if (name.value === '') missing.add('name')

  const source = isoSource.value
  if (kind === 'nfs' || kind === 'smb' || kind === 'lvmoiscsi' || (kind === 'iso' && source !== 'local')) {
    if (server.value === '') missing.add('server')
  }
  if ((kind === 'nfs' || (kind === 'iso' && source !== 'smb')) && path.value === '') missing.add('path')
  if (kind === 'lvmoiscsi') {
    if (iqn.value === undefined) missing.add('iqn')
    if (lun.value === undefined) missing.add('lun')
  }
  if ((kind === 'lvm' || kind === 'ext') && device.value === '') missing.add('device')
  if (kind === 'lvmohba' && lun.value === undefined) missing.add('lun')
  if (kind === 'zfs' && path.value === '') missing.add('path')
  if (kind === 'linstor') {
    if (nXostorHosts.value === 0) missing.add('disks')
    else if (Number(replication.value) > nXostorHosts.value) missing.add('replication')
  }

  return missing
})

const replicationMessage = computed<InputWrapperMessage | undefined>(() => {
  if (submitted.value && missingFields.value.has('replication')) {
    return { content: t('xostor:replication-too-high'), accent: 'danger' }
  }
  if (replication.value === '1') {
    return { content: t('xostor:replication-1-warning'), accent: 'warning' }
  }
  return undefined
})

function errorFor(field: Field): InputWrapperMessage | undefined {
  return submitted.value && missingFields.value.has(field)
    ? { content: t('field-required'), accent: 'danger' }
    : undefined
}

function buildXostorPayload(): NewXostorPayload {
  return {
    poolId,
    name_label: name.value,
    ...(description.value !== '' && { name_description: description.value }),
    disksByHost: xostorDisksByHost.value,
    provisioning: provisioning.value,
    replication: Number(replication.value),
    ...(ignoreFileSystems.value && { ignoreFileSystems: true }),
  }
}

function buildPayload(): NewSrPayload {
  const base = {
    hostId: hostId.value!,
    name_label: name.value,
    ...(description.value !== '' && { name_description: description.value }),
  }

  switch (srKind.value) {
    case 'nfs':
      return {
        ...base,
        SR_type: 'nfs',
        device_config: {
          server: server.value,
          serverpath: path.value,
          ...(nfsVersion.value !== '' && { nfsversion: nfsVersion.value }),
        },
      }
    case 'smb':
      return {
        ...base,
        SR_type: 'smb',
        device_config: {
          server: server.value.replace(/\\/g, '/'),
          ...(username.value !== '' && { username: username.value, password: password.value }),
        },
      }
    case 'lvmoiscsi':
      return {
        ...base,
        SR_type: 'lvmoiscsi',
        device_config: {
          target: server.value,
          targetIQN: iqn.value!,
          SCSIid: lun.value!,
          ...(port.value !== '' && { port: String(port.value) }),
          ...(username.value !== '' && { chapuser: username.value, chappassword: password.value }),
        },
      }
    case 'lvmohba':
      return { ...base, SR_type: 'lvmohba', device_config: { SCSIid: lun.value! } }
    case 'zfs':
      return { ...base, SR_type: 'zfs', device_config: { location: path.value } }
    case 'lvm':
    case 'ext':
      return { ...base, SR_type: srKind.value, device_config: { device: device.value } }
    case 'iso': {
      // same device_config as fragata-server `sr.createIso`
      const source = isoSource.value
      const deviceConfig: Record<string, string> =
        source === 'local'
          ? { legacy_mode: 'true', location: path.value }
          : source === 'smb'
            ? {
                type: 'cifs',
                location: server.value.replace(/\\/g, '/'),
                ...(username.value !== '' && { username: username.value, cifspassword: password.value }),
              }
            : {
                location: `${server.value}:${path.value}`,
                ...(nfsVersion.value !== '' && { nfsversion: nfsVersion.value }),
              }

      return { ...base, SR_type: 'iso', content_type: 'iso', device_config: deviceConfig }
    }
    case 'linstor':
      // created with its own route, see buildXostorPayload()
      throw new Error('XOSTOR SRs are not created with POST /srs')
  }
}

function handleConfirm() {
  submitted.value = true

  if (missingFields.value.size > 0) {
    return
  }

  if (srKind.value === 'linstor') {
    if (!isHaEnabled.value) {
      emit('confirm', buildXostorPayload())
    }
    return
  }

  emit('confirm', buildPayload())
}
</script>

<style lang="postcss" scoped>
.new-sr-drawer {
  display: flex;
  flex-direction: column;
  gap: 3.2rem;
  margin-block-start: 1.6rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .xostor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.6rem;
  }

  .xostor-host {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2.4rem;
    align-items: end;

    & > * {
      width: auto;
    }
  }
}
</style>
