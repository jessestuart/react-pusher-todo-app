import React, { PropTypes, Component } from 'react'
import ReactDOM from 'react-dom'
import AddChores from './components/AddChores'
import ChoresList from './components/ChoresList'
import axios from 'axios'
const key = "bbe790a322271f8ea80a"
const cluster = "eu"
const pusher = new Pusher(key, {
  cluster: cluster
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
    var channel = pusher.subscribe('chores');
    channel.bind('pusher:subscription_succeeded', function() {
      console.log('subscription succeeded! 🎉');
    });
    channel.bind('newChore', this.addChore)
    channel.bind('toggleChore', this.toggleChore)
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
    }).then((response) => {
      console.log(response);
    }).catch((error) => {
      console.log(error);
    });
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
    }).then((response) => {
      console.log(response);
    }).catch((error) => {
      console.log(error);
    });
    console.log(this.state);
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
