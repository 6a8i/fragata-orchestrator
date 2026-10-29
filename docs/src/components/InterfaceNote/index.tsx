import React from 'react'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'

/**
 * Standard header note for task pages whose screenshots and procedures
 * are (still) Fleet Classic based: states what Fragata Fleet covers today and links the
 * comparison page. One component so the wording and look evolve in one
 * place as Fragata Fleet grows.
 */
export default function InterfaceNote({ children }: { children?: React.ReactNode }): JSX.Element {
  return (
    <div className={styles.note}>
      <span className={styles.badge}>Fleet Classic · Fragata Fleet</span>
      <div className={styles.body}>
        {children ?? (
          <>
            This page describes the Fleet Classic interface. This area is not available in Fragata Fleet yet: use the{' '}
            <strong>Fleet Classic</strong> link in the top-right corner of Fragata Fleet.
          </>
        )}{' '}
        <Link to='/discover-xen-orchestra/xo6vsxo5'>See what lives where</Link>.
      </div>
    </div>
  )
}
