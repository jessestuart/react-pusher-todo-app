import React, { PropTypes, Component } from 'react'
import ReactDOM from 'react-dom'
import AddChores from './components/AddChores'
import ChoresList from './components/ChoresList'
import axios from 'axios'
import config from '../config'
const pusher = new Pusher(config.key, {
  cluster: config.cluster
});

class MyChoresApp extends Component {

  constructor(props){
    super(props)
    this.state = {
      text: '',
      chores: [
        { chore: '🍴 Clean kitchen', done: false },
        { chore: '⚡️ Pay electric bill', done: false }
      ]
    }
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleCheck = this.handleCheck.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.addChore = this.addChore.bind(this)
    this.toggleChore = this.toggleChore.bind(this)
  }

  componentDidMount() {
    console.log(this.state);
    let channel = pusher.subscribe('chores');
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('subscription succeeded! 🎉');
    });
    channel.bind('new_chore', function(){console.log(this.addChore);})//this.addChore)
    channel.bind('toggle_chore', this.toggleChore)
  }

  addChore(data) {
    const newChoreAdded = this.state.chores.concat({
      chore: data,
      done: false
    })
    this.setState({
      chores: newChoreAdded
    })
  }

  toggleChore(data) {
    const changedChores = this.state.chores.map( (item) => {
      if (item.chore === data) {
        return ({ chore: item.chore, done: !(item.done) })
      }
      return item
    })
    this.setState({ chores: changedChores })
  }

  handleInputChange(e) {
    this.setState({ text: e.target.value })
  }

  handleCheck(e) {
    const clickedChore = e.target.value
    this.toggleChore(clickedChore)
    axios.post('/toggleChore', {
      chore: clickedChore,
      socketId: pusher.socket_id
    })
  }

  handleSubmit(e) {
    e.preventDefault()
    const choreToAdd = this.state.text
    this.addChore(choreToAdd)
    this.setState({
      text: ''
    })
    axios.post('/newChore', {
      chore: choreToAdd,
      socketId: pusher.socket_id
    })
  }
  render() {
    return (
      <div>
        <AddChores
          handleChange={this.handleInputChange}
          handleBtnClick={this.handleSubmit}
          text={this.state.text}
          />
        <ChoresList
          chores={this.state.chores}
          toggleCheck={this.handleCheck}
          />
      </div>
    )
  }
}

ReactDOM.render(<MyChoresApp/>, document.getElementById('app'));
