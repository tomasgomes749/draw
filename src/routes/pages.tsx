import * as React from 'react'
import { Route, Switch } from 'react-router-dom'
import { uniqueId, memoize } from 'lodash'

import GS from 'pages/cl/gs'
import Last16 from 'pages/cl/last16'

import { fetchPots, parseGS } from 'utils/fetch-parse-pots'
import getCountryFlagUrl from 'utils/getCountryFlagUrl'
import prefetchImage from 'utils/prefetchImage'
import currentSeason from 'utils/currentSeason'
import delay from 'utils/delay'
import { GSTeam } from 'utils/team'

import Overlay from 'components/Overlay'

interface Props {
  season: number,
  dummyKey: string,
  onSeasonChange: (tournament: string, stage: string, season?: number) => void,
}

interface State {
  key: string,
  pots: GSTeam[][] | null,
  waiting: boolean,
  error: string | null,
  season: number, // for error handling (so that we know the previous season)
}

class Pages extends React.PureComponent<Props, State> {
  state = {
    key: uniqueId(),
    pots: null,
    waiting: false,
    error: null,
    season: currentSeason,
  }

  unlisten: (() => void) | undefined

  componentDidMount() {
    const { season } = this.getMatchParams()
    this.fetchData(season ? +season : currentSeason)
  }

  componentWillReceiveProps(nextProps: Props) {
    const { props } = this
    const { season, dummyKey } = nextProps
    if (props.season !== season) {
      this.fetchData(season)
    } else if (props.dummyKey !== dummyKey) {
      this.setState({
        key: dummyKey,
      })
    }
  }

  getMatchParams() {
    const { params } = this.props.match
    return {
      ...params,
      season: params.season ? +params.season : currentSeason,
    }
  }

  async fetchData(season: number) {
    this.setState({
      waiting: true,
    })
    try {
      const pots = await this.getPots(season)
      await this.prefetchImages(pots)
      this.setState({
        pots,
        waiting: false,
        error: null,
        key: uniqueId(),
        season,
      })
    } catch (err) {
      this.onFetchError(err)
    }
  }

  async onFetchError(err) {
    this.setState({
      waiting: false,
      error: 'Could not fetch data',
    })
    await delay(1000)
    console.error(err)
    const { tournament, stage } = this.getMatchParams()
    const { pots, season } = this.state
    const newSeason = pots && season !== currentSeason ? season : undefined
    this.props.onSeasonChange(tournament, stage, newSeason)
    this.setState({
      error: null,
    })
  }

  getPots = memoize(async (season: number) => {
    const data = await fetchPots(season)
    return parseGS(data)
  })

  prefetchImages(pots: GSTeam[][]) {
    const promises: Promise<void>[] = []
    for (const pot of pots) {
      const urls = pot.map(team => getCountryFlagUrl(team.country))
      promises.push(...urls.map(prefetchImage))
    }
    return Promise.all(promises)
  }

  getOverlay = (props) => (
    <Overlay
      {...props}
      noAnimation={!this.state.pots}
    />
  )

  getPopup() {
    const { error, waiting } = this.state
    const WrappedOverlay = this.getOverlay
    if (!navigator.onLine) {
      return <WrappedOverlay>you're offline</WrappedOverlay>
    }
    if (error) {
      return <WrappedOverlay>{error}</WrappedOverlay>
    }
    if (waiting) {
      return <WrappedOverlay>wait...</WrappedOverlay>
    }
    return null
  }

  render() {
    const { pots, key } = this.state
    return (
      <div>
        {this.getPopup()}
        {pots &&
          <Switch>
            <Route path="/cl/gs">
              <GS
                pots={pots}
                key={key}
              />
            </Route>
            <Route path="/cl/last16">
              <Last16
                pots={pots}
                key={key}
              />
            </Route>
          </Switch>
        }
      </div>
    )
  }
}

export default Pages