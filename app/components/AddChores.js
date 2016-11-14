import React, { PropTypes, Component } from 'react'

class AddChores extends Component {

  constructor(props) {
    super(props)
  }

  render () {
    return (<div>
      <input type='text'
      onChange={ (e) => this.props.handleChange(e) } value={this.props.text}
      />
      <button onClick={(e)=>this.props.handleBtnClick(e)} >
        Add Chores
      </button>
    </div>
  )
  }
}

export default AddChores;
