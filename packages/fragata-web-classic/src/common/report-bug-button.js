import _ from 'intl'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { identity, omit } from 'lodash'
import { injectState, provideState } from 'reaclette'

import ActionButton from './action-button'
import ActionRowButton from './action-row-button'

const jsonStringify = json => JSON.stringify(json, null, 2)

const GITHUB_URL = 'https://github.com/6a8i/fragata-orchestrator/issues/new'
const GITHUB_BUG_TEMPLATE = 'bug_report.yml'

// Bug reports always go to the public issue tracker: Fragata has no commercial
// support channel.
export const reportBug = ({ title, message, formatMessage = identity } = {}) => {
  const encodedTitle = encodeURIComponent(title == null ? '' : title)
  const encodedLabels = encodeURIComponent('type: bug :bug:,status: triaging :triangular_flag_on_post:')

  let url = `${GITHUB_URL}?title=${encodedTitle}&template=${GITHUB_BUG_TEMPLATE}&labels=${encodedLabels}`

  if (message !== undefined) {
    const error = typeof message === 'string' ? message : (message.error ?? message)
    url += `&error-message=${encodeURIComponent(typeof error === 'string' ? error : jsonStringify(error))}`
  }

  window.open(url)
}

const REPORT_BUG_BUTTON_PROP_TYPES = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.oneOfType([PropTypes.instanceOf(window.Blob), PropTypes.instanceOf(window.File)]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  formatMessage: PropTypes.func,
  message: PropTypes.string,
  rowButton: PropTypes.bool,
  title: PropTypes.string,
}

const ReportBugButton = decorate([
  provideState({
    effects: {
      reportBug() {
        const { formatMessage, message, title } = this.props
        reportBug({
          formatMessage,
          message,
          title,
        })
      },
    },
    computed: {
      Button: (state, { rowButton }) => (rowButton ? ActionRowButton : ActionButton),
      buttonProps: (state, props) => omit(props, Object.keys(REPORT_BUG_BUTTON_PROP_TYPES)),
    },
  }),
  injectState,
  ({ state, effects }) => (
    <state.Button {...state.buttonProps} handler={effects.reportBug} icon='bug' tooltip={_('reportBug')} />
  ),
])

ReportBugButton.propTypes = REPORT_BUG_BUTTON_PROP_TYPES

export { ReportBugButton as default }
