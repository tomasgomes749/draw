import * as React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import getCurrentSeason from 'utils/getCurrentSeason'
import SelectSeason from './SelectSeason'
import GithubButton from './GithubButton'

const Root = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 10px;
  padding-bottom: 10px;
  font-size: 16px;

  @media (max-width: 999px) {
    padding-top: 15px;
    padding-bottom: 15px;
    font-size: 32px;
  }
`

const StyledLink = styled(Link)`
  margin-left: 5px;
  margin-right: 5px;
`

interface Props {
  location: any,
  onSeasonChange: (tournament: string, stage: string, season: number) => void,
}

class TopPanel extends React.PureComponent<Props> {

  onSeasonChange = (e) => {
    const [tournament, stage, season] = e.target.value.split('-')
    this.props.onSeasonChange(tournament, stage, +season)
  }

  render() {
    const {
      location,
    } = this.props
    const season = getCurrentSeason(location)
    return (
      <Root>
        <SelectSeason
          defaultSeason={season}
          start={2003}
          onChange={this.onSeasonChange}
        />
        {
          location &&
            <StyledLink to={location.pathname}>
              Restart
            </StyledLink>
        }
        {/*<Link to="/">Change mode</Link> |*/}
        <GithubButton />
      </Root>
    )
  }
}

export default TopPanel
