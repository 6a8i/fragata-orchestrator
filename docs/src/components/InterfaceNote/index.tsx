import React from 'react'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'

/**
 * Standard header note for task pages whose screenshots and procedures
 * are (still) Fragata Classic based: states what Fragata covers today and links the
 * comparison page. One component so the wording and look evolve in one
 * place as Fragata grows.
 */
export default function InterfaceNote({ children }: { children?: React.ReactNode }): JSX.Element {
  return (
    <div className={styles.note}>
      <span className={styles.badge}>Fragata Classic · Fragata</span>
      <div className={styles.body}>
        {children ?? (
          <>
            This page describes the Fragata Classic interface. This area is not available in Fragata yet: use the{' '}
            <strong>Fragata Classic</strong> link in the top-right corner of Fragata.
          </>
        )}{' '}
        <Link to='/discover-xen-orchestra/xo6vsxo5'>See what lives where</Link>.
      </div>
    </div>
  )
}
