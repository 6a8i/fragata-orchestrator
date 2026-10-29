import Component from 'base-component'
import DocumentTitle from 'react-document-title'
import every from 'lodash/every'
import Icon from 'icon'
import Link from 'link'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import PropTypes from 'prop-types'
import React from 'react'
import Shortcuts from 'shortcuts'
import themes from 'themes'
import _, { IntlProvider } from 'intl'
import { connectStore, routes } from 'utils'
import { groupBy, pick } from 'lodash'
import { Notification } from 'notification'
import { provideState } from 'reaclette'
import { ShortcutManager } from 'react-shortcuts'
import { ThemeProvider } from 'styled-components'
import { TooltipViewer } from 'tooltip'
import { Container, Row, Col } from 'grid'

import About from './about'
import Backup from './backup'
import Dashboard from './dashboard'
import Home from './home'
import Host from './host'
import Jobs from './jobs'
import Menu from './menu'
import Modal, { alert, FormModal } from 'modal'
import New from './new'
import NewVm from './new-vm'
import Pool from './pool'
import Self from './self'
import Settings from './settings'
import Sr from './sr'
import Tasks from './tasks'
import User from './user'
import Vm from './vm'
import Xostor from './xostor'
import Import from './import'

import keymap, { help } from '../keymap'
import { createCollectionWrapper, createGetObjectsOfType } from '../common/selectors'

const shortcutManager = new ShortcutManager(keymap)

const CONTAINER_STYLE = {
  display: 'flex',
  minHeight: '100vh',

  // FIXME: The size of `xo-main` matches the size of the window
  // thanks to the, flex growing feature.
  //
  // Therefore, when there is a scrollbar on the right side, `xo-main`
  // is too large (since the scrollbar uses a few, pixels) which makes
  // an almost useless horizontal scrollbar appear.
  overflow: 'hidden',
}
const BODY_WRAPPER_STYLE = {
  flex: 1,
  position: 'relative',
}
const BODY_STYLE = {
  height: '100%',
  left: 0,
  overflow: 'auto',
  position: 'absolute',
  top: 0,
  width: '100%',
}

@routes('home', {
  about: About,
  backup: Backup,
  'backup-ng/*': {
    onEnter: ({ location }, replace) => replace(location.pathname.replace('/backup-ng', '/backup')),
  },
  dashboard: Dashboard,
  home: Home,
  'hosts/:id': Host,
  jobs: Jobs,
  new: New,
  'pools/:id': Pool,
  self: Self,
  settings: Settings,
  'srs/:id': Sr,
  tasks: Tasks,
  user: User,
  'vms/new': NewVm,
  'vms/:id': Vm,
  xostor: Xostor,
  import: Import,
})
@connectStore(state => {
  const getHosts = createGetObjectsOfType('host')
  const getXsa468VulnerableVms = createGetObjectsOfType('VM').filter([
    vm => vm.vulnerabilities?.xsa468?.reason === 'pv-driver-version-vulnerable' && !vm.tags.includes('HIDE_XSA468'),
  ])
  return {
    signedUp: !!state.user,
    hosts: getHosts(state),
    xsa468VulnerableVms: getXsa468VulnerableVms(state),
  }
})
@provideState({
  computed: {
    hostsByPoolId: createCollectionWrapper((_, { hosts }) =>
      groupBy(
        map(hosts, host => pick(host, ['$poolId', 'id', 'version'])),
        '$poolId'
      )
    ),
    areHostsVersionsEqualByPool: ({ hostsByPoolId }) =>
      mapValues(hostsByPoolId, hosts => every(hosts, host => host.version === hosts[0].version)),
  },
})
export default class XoApp extends Component {
  static contextTypes = {
    router: PropTypes.object,
  }
  static childContextTypes = {
    shortcuts: PropTypes.object.isRequired,
  }
  getChildContext = () => ({ shortcuts: shortcutManager })

  componentDidMount() {
    this.refs.bodyWrapper.style.minHeight = this.refs.menu.getWrappedInstance().height + 'px'
  }

  componentDidUpdate(prev) {
    if (prev.location.pathname !== this.props.location.pathname) {
      Modal.close()
    }
  }

  _shortcutsHandler = (command, event) => {
    event.preventDefault()
    switch (command) {
      case 'GO_TO_HOSTS':
        this.context.router.push('home?t=host')
        break
      case 'GO_TO_POOLS':
        this.context.router.push('home?t=pool')
        break
      case 'GO_TO_VMS':
        this.context.router.push('home?t=VM')
        break
      case 'GO_TO_SRS':
        this.context.router.push('home?t=SR')
        break
      case 'CREATE_VM':
        this.context.router.push('vms/new')
        break
      case 'UNFOCUS':
        if (event.target.tagName === 'INPUT') {
          event.target.blur()
        }
        break
      case 'HELP':
        alert(
          <span>
            <Icon icon='shortcuts' /> {_('shortcutModalTitle')}
          </span>,
          <Container>
            {map(
              help,
              (context, contextKey) =>
                context.name && [
                  <Row className='mt-1' key={contextKey}>
                    <Col>
                      <h4>{context.name}</h4>
                    </Col>
                  </Row>,
                  ...map(
                    context.shortcuts,
                    ({ message, keys }, key) =>
                      message && (
                        <Row key={`${contextKey}_${key}`}>
                          <Col size={2} className='text-xs-right'>
                            <strong>{Array.isArray(keys) ? keys[0] : keys}</strong>
                          </Col>
                          <Col size={10}>{message}</Col>
                        </Row>
                      )
                  ),
                ]
            )}
          </Container>
        )
        break
    }
  }

  render() {
    const { signedUp, xsa468VulnerableVms } = this.props

    return (
      <IntlProvider>
        <ThemeProvider theme={themes.base}>
          <DocumentTitle title='Fragata'>
            <div>
              {Object.keys(xsa468VulnerableVms).length > 0 && (
                <div className='alert alert-danger mb-0'>
                  IMPORTANT! Some of your VMs are vulnerable.{' '}
                  <Link to='/home?s=vulnerable%3F'>Please check immediately.</Link>
                </div>
              )}
              <div style={CONTAINER_STYLE}>
                <Shortcuts
                  name='XoApp'
                  handler={this._shortcutsHandler}
                  targetNodeSelector='body'
                  stopPropagation={false}
                />
                <Menu ref='menu' />
                <div ref='bodyWrapper' style={BODY_WRAPPER_STYLE}>
                  <div style={BODY_STYLE}>{signedUp ? this.props.children : <p>Still loading</p>}</div>
                </div>
                <Modal />
                <FormModal />
                <Notification />
                <TooltipViewer />
              </div>
            </div>
          </DocumentTitle>
        </ThemeProvider>
      </IntlProvider>
    )
  }
}
