// Fragata Host is built from XCP-ng: same packages, update channel and plugins, its own brand
const XCP_FAMILY_BRANDS = new Set(['XCP-ng', 'Fragata Host'])

export const isXcpFamilyBrand = brand => XCP_FAMILY_BRANDS.has(brand)
