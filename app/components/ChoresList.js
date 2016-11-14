import React, { PropTypes, Component } from 'react'

class ChoresList extends Component {

  constructor(props) {
    super(props)
  }

  render () {
    return (
      <ul>
      {this.props.chores.map((item)=> {
        return (
          <li key={item.chore} className={item.done?'done':'pending'}>
            <span>{item.chore} </span>
            <input type='checkbox'
              checked={item.done}
              onChange={ (e) => this.props.toggleCheck(e) }
              value={item.chore} />
          </li>
        )
      })}
    </ul>)
  }
}

export default ChoresList;
