import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { getUser } from 'selectors'
import { compareCommits, getMasterCommit, serverVersion } from 'xo'
import { Container, Row, Col } from 'grid'
import { connectStore } from 'utils'

const COMMIT_ID = process.env.GIT_HEAD

const REPO_URL = 'https://github.com/6a8i/fragata-orchestrator'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={12}>
        <h2>
          <Icon icon='menu-about' /> {_('aboutFragata')}
        </h2>
      </Col>
    </Row>
  </Container>
)

@connectStore(() => ({
  user: getUser,
}))
export default class About extends Component {
  async componentWillMount() {
    serverVersion.then(serverVersion => {
      this.setState({ serverVersion })
    })

    if (COMMIT_ID !== '') {
      try {
        const commit = await getMasterCommit()
        const isOnLatest = commit.sha === COMMIT_ID
        const diff = {
          nAhead: 0,
          nBehind: 0,
        }
        if (!isOnLatest) {
          try {
            const { ahead_by, behind_by } = await compareCommits(commit.sha, COMMIT_ID)
            diff.nAhead = ahead_by
            diff.nBehind = behind_by
          } catch (err) {
            console.error(err)
            diff.nBehind = 'unknown'
          }
        }

        this.setState({
          commit: {
            isOnLatest,
            master: commit,
            diffWithMaster: diff,
            fetched: true,
          },
        })
      } catch (err) {
        console.error(err)
        this.setState({
          commit: {
            fetched: false,
          },
        })
      }
    }
  }
  render() {
    const { user } = this.props
    const { commit } = this.state
    const isAdmin = user && user.permission === 'admin'

    return (
      <Page header={HEADER} title='aboutPage' formatTitle>
        <Container className='text-xs-center'>
          {isAdmin && COMMIT_ID !== '' && (
            <Col>
              <Row key='0'>
                <Col mediumSize={6}>
                  <Icon icon='git' size={4} />
                  <h4>
                    Fragata, commit{' '}
                    <a href={`${REPO_URL}/commit/${COMMIT_ID}`} target='_blank' rel='noreferrer'>
                      {COMMIT_ID.slice(0, 5)}
                    </a>
                  </h4>
                </Col>
                <Col mediumSize={6} className={commit?.fetched === false ? 'text-warning' : ''}>
                  <Icon icon='git' size={4} />
                  <h4>
                    {commit === undefined ? (
                      _('statusLoading')
                    ) : commit.fetched ? (
                      <span>
                        Main, commit{' '}
                        <a href={commit.master.html_url} target='_blank' rel='noreferrer'>
                          {commit.master.sha.slice(0, 5)}
                        </a>
                      </span>
                    ) : (
                      _('failedToFetchLatestMasterCommit')
                    )}
                  </h4>
                </Col>
              </Row>
              {commit?.fetched && (
                <Row className={`mt-1 ${commit.isOnLatest ? '' : 'text-warning '}`}>
                  <h4>
                    {commit.isOnLatest ? (
                      <span>
                        {_('xoUpToDate')} <Icon icon='check' color='text-success' />
                      </span>
                    ) : (
                      <span>
                        {_('xoFromSourceNotUpToDate', {
                          nBehind: commit.diffWithMaster.nBehind,
                          nAhead: commit.diffWithMaster.nAhead,
                        })}{' '}
                        <Icon icon='alarm' color='text-warning' />
                      </span>
                    )}
                  </h4>
                </Row>
              )}
            </Col>
          )}
          <Row className='mt-2'>
            <Col mediumSize={4}>
              <a href={`${REPO_URL}/issues/new/choose`} target='_blank' rel='noreferrer'>
                <Icon icon='bug' size={4} />
                <h4>{_('bugTracker')}</h4>
              </a>
              <p className='text-muted'>{_('bugTrackerText')}</p>
            </Col>
            <Col mediumSize={4}>
              <a href={`${REPO_URL}/discussions`} target='_blank' rel='noreferrer'>
                <Icon icon='group' size={4} />
                <h4>{_('community')}</h4>
              </a>
              <p className='text-muted'>{_('communityText')}</p>
            </Col>
            <Col mediumSize={4}>
              <a href={`${REPO_URL}/tree/main/docs/docs`} target='_blank' rel='noreferrer'>
                <Icon icon='user' size={4} />
                <h4>{_('documentation')}</h4>
              </a>
              <p className='text-muted'>{_('documentationText')}</p>
            </Col>
          </Row>
        </Container>
      </Page>
    )
  }
}
