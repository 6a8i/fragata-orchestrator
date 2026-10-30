import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import Tags from 'tags'
import { SelectSr } from 'select-objects'

import { FormGroup } from '../../utils'

const ScheduleHealthCheck = ({ schedule, toggleHealthCheck, setHealthCheckTags, setHealthCheckSr }) => (
  <FormGroup>
    <label>
      <strong>
        <a
          className='text-info'
          rel='noreferrer'
          href='https://github.com/6a8i/fragata-orchestrator/blob/main/docs/docs/backups-and-dr/backup-features-and-settings.md#backup-health-check'
          target='_blank'
        >
          <Icon icon='info' />
        </a>{' '}
        {_('healthCheck')}
      </strong>{' '}
      <input
        type='checkbox'
        checked={schedule.healthCheckVmsWithTags !== undefined}
        onChange={toggleHealthCheck}
        name='healthCheck'
      />
    </label>
    {schedule.healthCheckVmsWithTags !== undefined && (
      <div className='mb-2'>
        <strong>{_('vmsTags')}</strong>
        <br />
        <em>
          <Icon icon='info' /> {_('healthCheckTagsInfo')}
        </em>
        <p className='h2'>
          <Tags labels={schedule.healthCheckVmsWithTags} onChange={setHealthCheckTags} />
        </p>
        <strong>{_('healthCheckChooseSr')}</strong>
        <SelectSr
          onChange={setHealthCheckSr}
          placeholder={_('healthCheckChooseSr')}
          required
          value={schedule.healthCheckSr}
        />
      </div>
    )}
  </FormGroup>
)

export default ScheduleHealthCheck
