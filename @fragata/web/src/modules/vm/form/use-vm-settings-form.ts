import type { EditVmPayload } from '@/modules/vm/jobs/xo-vm-edit.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type FormValidationConfig, minValue, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const MIB = 1024 ** 2

type HighAvailability = FrontXoVm['high_availability']
type Vga = NonNullable<EditVmPayload['vga']>
type VideoRam = NonNullable<EditVmPayload['videoram']>
type BootFirmware = 'bios' | 'uefi'

export type VmSettingsFormData = {
  nameLabel: string
  nameDescription: string
  autoPoweron: boolean
  highAvailability: HighAvailability
  startDelay: number
  cpus: number
  cpusMax: number
  coresPerSocket: number | ''
  cpuWeight: number | ''
  cpuCap: number | ''
  memoryMinMib: number
  memoryMaxMib: number
  memoryStaticMaxMib: number
  bootFirmware: BootFirmware
  bootOrder: string
  secureBoot: boolean
  viridian: boolean
  hasVendorDevice: boolean
  nestedVirt: boolean
  vga: Vga
  videoram: VideoRam
}

function toMib(bytes: number | undefined): number {
  return bytes === undefined ? 0 : Math.round(bytes / MIB)
}

function optionalNumber(value: number | ''): number | null {
  return value === '' ? null : Number(value)
}

export type VmSettingsForm = ReturnType<typeof useVmSettingsForm>

export function useVmSettingsForm(vm: FrontXoVm) {
  const { t } = useI18n()

  const isHvm = vm.virtualizationMode === 'hvm'

  const formData = reactive<VmSettingsFormData>({
    nameLabel: vm.name_label,
    nameDescription: vm.name_description,
    autoPoweron: vm.auto_poweron,
    highAvailability: vm.high_availability,
    startDelay: vm.startDelay,
    cpus: vm.CPUs.number,
    cpusMax: vm.CPUs.max,
    coresPerSocket: vm.coresPerSocket ?? '',
    cpuWeight: vm.cpuWeight ?? '',
    cpuCap: vm.cpuCap ?? '',
    memoryMinMib: toMib(vm.memory.dynamic[0]),
    memoryMaxMib: toMib(vm.memory.dynamic[1]),
    memoryStaticMaxMib: toMib(vm.memory.static[1]),
    bootFirmware: vm.boot.firmware === 'uefi' ? 'uefi' : 'bios',
    bootOrder: vm.boot.order ?? '',
    secureBoot: vm.secureBoot,
    viridian: vm.viridian,
    hasVendorDevice: vm.hasVendorDevice,
    nestedVirt: vm.isNestedVirtEnabled,
    vga: vm.vga === 'std' ? 'std' : 'cirrus',
    videoram: ([1, 2, 4, 8, 16] as VideoRam[]).includes(vm.videoram as VideoRam) ? (vm.videoram as VideoRam) : 4,
  })

  const config: FormValidationConfig<VmSettingsFormData> = {
    errors: {
      onSubmit: () => ({
        nameLabel: { required },
        cpus: { minValue: minValue(1) },
        cpusMax: { minValue: minValue(1) },
        memoryMinMib: { minValue: minValue(1) },
        memoryMaxMib: { minValue: minValue(1) },
        memoryStaticMaxMib: { minValue: minValue(1) },
        startDelay: { minValue: minValue(0) },
      }),
    },
  }

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, config)

  const highAvailabilityOptions = computed(() => [
    { id: 'none', label: t('ha:disabled'), value: '' as const },
    { id: 'best-effort', label: t('ha:best-effort'), value: 'best-effort' as const },
    { id: 'restart', label: t('ha:restart'), value: 'restart' as const },
  ])

  const { id: highAvailabilitySelectId } = useFormSelect('highAvailability', highAvailabilityOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const bootFirmwareOptions = computed(() => [
    { id: 'bios', label: 'BIOS', value: 'bios' as const },
    { id: 'uefi', label: 'UEFI', value: 'uefi' as const },
  ])

  const { id: bootFirmwareSelectId } = useFormSelect('bootFirmware', bootFirmwareOptions, {
    required: true,
    disabled: () => !isHvm,
    option: { label: 'label', value: 'value' },
  })

  const vgaOptions = computed(() => [
    { id: 'std', label: t('vga:standard'), value: 'std' as const },
    { id: 'cirrus', label: 'Cirrus', value: 'cirrus' as const },
  ])

  const { id: vgaSelectId } = useFormSelect('vga', vgaOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const videoramOptions = computed(() =>
    ([1, 2, 4, 8, 16] as VideoRam[]).map(size => ({ id: String(size), label: `${size} MiB`, value: size }))
  )

  const { id: videoramSelectId } = useFormSelect('videoram', videoramOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const bindings = reactive({
    nameLabel: useField('nameLabel', () => ({ label: t('name'), required: true })),
    nameDescription: useField('nameDescription', () => ({ label: t('description') })),
    autoPoweron: useField('autoPoweron', () => ({ label: t('auto-power-on') })),
    highAvailability: useSelect(highAvailabilitySelectId, () => ({ label: t('high-availability') })),
    startDelay: useField('startDelay', () => ({ label: `${t('start-delay')} (s)` })),
    cpus: useField('cpus', () => ({ label: t('vcpu-at-startup') })),
    cpusMax: useField('cpusMax', () => ({ label: t('maximum-vcpu') })),
    coresPerSocket: useField('coresPerSocket', () => ({ label: t('cores-per-socket') })),
    cpuWeight: useField('cpuWeight', () => ({ label: t('cpu-weight') })),
    cpuCap: useField('cpuCap', () => ({ label: t('cpu-cap') })),
    memoryMinMib: useField('memoryMinMib', () => ({ label: `${t('minimum-dynamic-memory')} (MiB)` })),
    memoryMaxMib: useField('memoryMaxMib', () => ({ label: `${t('maximum-dynamic-memory')} (MiB)` })),
    memoryStaticMaxMib: useField('memoryStaticMaxMib', () => ({ label: `${t('maximum-static-memory')} (MiB)` })),
    bootFirmware: useSelect(bootFirmwareSelectId, () => ({ label: t('boot-firmware') })),
    bootOrder: useField('bootOrder', () => ({ label: t('boot-order'), info: t('boot-order-hint') })),
    secureBoot: useField('secureBoot', () => ({ label: t('secure-boot') })),
    viridian: useField('viridian', () => ({ label: t('viridian') })),
    hasVendorDevice: useField('hasVendorDevice', () => ({ label: t('manage-citrix-pv-drivers-via-windows-update') })),
    nestedVirt: useField('nestedVirt', () => ({ label: t('nested-virtualization') })),
    vga: useSelect(vgaSelectId, () => ({ label: t('vga') })),
    videoram: useSelect(videoramSelectId, () => ({ label: t('video-ram') })),
  })

  /** Builds the PATCH body with only the properties that differ from the VM */
  async function validateAndBuildPayload(): Promise<EditVmPayload | undefined> {
    if (!(await validate())) {
      return undefined
    }

    const payload: EditVmPayload = {}

    if (formData.nameLabel !== vm.name_label) payload.nameLabel = formData.nameLabel
    if (formData.nameDescription !== vm.name_description) payload.nameDescription = formData.nameDescription
    if (formData.autoPoweron !== vm.auto_poweron) payload.autoPoweron = formData.autoPoweron
    if (formData.highAvailability !== vm.high_availability) payload.highAvailability = formData.highAvailability
    if (Number(formData.startDelay) !== vm.startDelay) payload.startDelay = Number(formData.startDelay)
    if (Number(formData.cpus) !== vm.CPUs.number) payload.cpus = Number(formData.cpus)
    if (Number(formData.cpusMax) !== vm.CPUs.max) payload.cpusStaticMax = Number(formData.cpusMax)
    if (optionalNumber(formData.coresPerSocket) !== (vm.coresPerSocket ?? null)) {
      payload.coresPerSocket = optionalNumber(formData.coresPerSocket)
    }
    if (optionalNumber(formData.cpuWeight) !== (vm.cpuWeight ?? null)) payload.cpuWeight = optionalNumber(formData.cpuWeight)
    if (optionalNumber(formData.cpuCap) !== (vm.cpuCap ?? null)) payload.cpuCap = optionalNumber(formData.cpuCap)
    if (Number(formData.memoryMinMib) !== toMib(vm.memory.dynamic[0])) {
      payload.memoryMin = Number(formData.memoryMinMib) * MIB
    }
    if (Number(formData.memoryMaxMib) !== toMib(vm.memory.dynamic[1])) {
      payload.memory = Number(formData.memoryMaxMib) * MIB
    }
    if (Number(formData.memoryStaticMaxMib) !== toMib(vm.memory.static[1])) {
      payload.memoryStaticMax = Number(formData.memoryStaticMaxMib) * MIB
    }
    if (isHvm && formData.bootFirmware !== (vm.boot.firmware === 'uefi' ? 'uefi' : 'bios')) {
      payload.hvmBootFirmware = formData.bootFirmware
    }
    if (isHvm && formData.bootOrder.trim() !== (vm.boot.order ?? '')) payload.bootOrder = formData.bootOrder.trim()
    if (formData.secureBoot !== vm.secureBoot) payload.secureBoot = formData.secureBoot
    if (formData.viridian !== vm.viridian) payload.viridian = formData.viridian
    if (formData.hasVendorDevice !== vm.hasVendorDevice) payload.hasVendorDevice = formData.hasVendorDevice
    if (formData.nestedVirt !== vm.isNestedVirtEnabled) payload.nestedVirt = formData.nestedVirt
    if (formData.vga !== (vm.vga === 'std' ? 'std' : 'cirrus')) payload.vga = formData.vga
    if (formData.videoram !== vm.videoram) payload.videoram = formData.videoram

    return payload
  }

  return { formData, bindings, isHvm, validateAndBuildPayload }
}
