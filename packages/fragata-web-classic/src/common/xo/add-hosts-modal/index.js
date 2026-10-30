import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col } from 'grid'
import { connectStore } from 'utils'
import { createCollectionWrapper, createGetObjectsOfType, createSelector } from 'selectors'
import { flatten, forEach, isEmpty, map, uniq } from 'lodash'
import { getPatchesDifference } from 'xo'
import { SelectHost } from 'select-objects'

@connectStore(
  () => ({
    singleHosts: createSelector(
      (_, { pool }) => pool && pool.id,
      createGetObjectsOfType('host'),
      createCollectionWrapper((poolId, hosts) => {
        const visitedPools = {}
        const singleHosts = {}
        forEach(hosts, host => {
          const { $pool } = host
          if ($pool !== poolId) {
            const previousHost = visitedPools[$pool]
            if (previousHost !== undefined) {
              delete singleHosts[previousHost]
            } else {
              const { id } = host
              singleHosts[id] = true
              visitedPools[$pool] = id
            }
          }
        })
        return singleHosts
      })
    ),
  }),
  { withRef: true }
)
export default class AddHostsModal extends BaseComponent {
  get value() {
    return { hosts: this.state.hosts }
  }

  _getHostPredicate = createSelector(
    () => this.props.singleHosts,
    singleHosts => host => singleHosts[host.id]
  )

  _onChangeHosts = async hosts => {
    if (isEmpty(hosts)) {
      this.setState({
        hosts,
        nHostsMissingPatches: undefined,
        nPoolMissingPatches: undefined,
      })
      return
    }

    const { master } = this.props.pool
    this.setState({
      hosts,
      nHostsMissingPatches: uniq(
        flatten(await Promise.all(map(hosts, ({ id: hostId }) => getPatchesDifference(hostId, master))))
      ).length,
      nPoolMissingPatches: uniq(
        flatten(await Promise.all(map(hosts, ({ id: hostId }) => getPatchesDifference(master, hostId))))
      ).length,
    })
  }

  render() {
    const { hosts, nHostsMissingPatches, nPoolMissingPatches } = this.state
    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('hosts')}</Col>
          <Col size={6}>
            <SelectHost multi onChange={this._onChangeHosts} predicate={this._getHostPredicate()} value={hosts} />
          </Col>
        </SingleLineRow>
        <br />
        {(nHostsMissingPatches > 0 || nPoolMissingPatches > 0) && (
          <div>
            {nPoolMissingPatches > 0 && (
              <SingleLineRow>
                <Col>
                  <span className='text-danger'>
                    <Icon icon='error' />{' '}
                    {_('missingPatchesPool', {
                      nMissingPatches: nPoolMissingPatches,
                    })}
                  </span>
                </Col>
              </SingleLineRow>
            )}
            {nHostsMissingPatches > 0 && (
              <SingleLineRow>
                <Col>
                  <span className='text-danger'>
                    <Icon icon='error' />{' '}
                    {_('missingPatchesHost', {
                      nHosts: hosts.length,
                      nMissingPatches: nHostsMissingPatches,
                    })}
                  </span>
                </Col>
              </SingleLineRow>
            )}
          </div>
        )}
      </div>
    )
  }
}
