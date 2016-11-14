

# Keepin' it Real(time): Building a collaborative task list with React + Pusher

My housemates and I have the bad habit of being completely out of sync when it comes to household chores.  Busy schedules mean we rarely bump into one another and we are usually either having to wrestle the last drop out of the dish soap for a whole week (the 'I'm sure someone else will do it' fallacy) or stockpiling bottles in the cupboard like the apocalypse is coming because we all "happened" to stop by the store on the same day. But no more! I've decided to remedy the situation and today I am going to show you how to build an application that will allow us to collaborate on a list of household chores in real time so the dog gets walked and no light bulbs ever go unchanged. 

### The Challenge

Our final product will allow us to (1) add new chores, (2) mark a chore as complete and (3) have all users' lists update in real time so everyone knows when a task is complete. Wouldn't want to pay the electric bill twice! 

We will be using a Node.js server and a React client. React will allow us to easily re-render the DOM with every update and keep the state of our list. We'll also be using the [Pusher API][pusher] for all of our realtime needs. Pusher will take care of managing our WebSocket connections and allow us to subscribe to events so we never miss a toothpaste emergency. 

If you want to see what the application looks like completed, you can grab the [source code on GitHub][source].

### Setup

The first thing we're going to do is set up our environment. We have to head over to the [Pusher website][newacct] to create a free(!) account and get access to the realtime API. Once we've done that, we can save our application details in a file `config.js` :

```
module.exports = {
  app_id: YOUR_APP_ID,
  key: YOUR_APP_KEY,
  secret: YOUR_APP_SECRET, 
  cluster: YOUR_CLUSTER
}
```

In the interest of focusing on the meat of the app, I've gone ahead and set up the app [here][source]. Download de code and run [`npm install`][npm] or [`yarn`][yarn] to install all of the dependencies.


#### Client

Next we'll need to make sure our React app is ready to make use of the Pusher API so we need to make sure to include the [Pusher javascript library][pushjs] in our `index.html` file:

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>My Chores App</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <div id="app">
      Loading...
    </div>
    <script src="//js.pusher.com/3.2/pusher.min.js"></script> <!-- Pusher JS lib -->
 	<script type="text/javascript" src="bundle.js"></script>
  </body>
</html>
```

Our React app will consist of two main components: An `AddChores` component that will have a text input box and a button, and a `ChoresList` component that will render out chores and allow us to tick them off our list. 

```
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
  ```
  
Our final product will look something like this: 

  <div style="text-align: center; padding: 0px; margin: 0px;"><img src="https://github.com/elischutze/react-pusher-todo-app/blob/master/assets/choresapp.png?raw=true" width="50%"/></div>
  
### The Good Stuff

We'll start by initialising the app state to have a list of chores and some text to store the input from the box. I've thrown in a couple of chores in there to start with. Each chore is an object that contains the chore and a flag to mark whether it is completed or not:


```
constructor(props) {
    super(props)
    this.state = {
      text: '',
      chores: [
        { chore: '🍴 Clean kitchen', done: false },
        { chore: '⚡️ Pay electric bill', done: false }
      ]
    }
```

We then have to write the logic to handle adding or changing a chore from the list. Because our list might update either from our own creation or from the Pusher API socket, we'll write a generic `addChore` and `toggleChore` function:


```
  addChore(data) {
  	// state should be immutable in React so we're creating a new array with the 
  	// new data
    const newChoreAdded = this.state.chores.concat({
      chore: data,
      done: false
    })
    this.setState({
      chores: newChoreAdded
    })
  }

  toggleChore(data) {
  	// we only change the specific line item
    const changedChores = this.state.chores.map( (item) => {
      if (item.chore === data) {
        return ({ chore: item.chore, done: !(item.done) })
      }
      return item
    })
    this.setState({ chores: changedChores })
  }
  ```
  
#### User change

We can then add handlers for user actions on the app. Note that we are using our generic `addChore` and `toggleChore` functions from earlier!

```
// When we type into the text box
handleInputChange(e) {
    this.setState({ text: e.target.value })
  }
  
// When we press the add button
handleSubmit(e) {
  e.preventDefault()
  const choreToAdd = this.state.text
  this.addChore(choreToAdd)
  this.setState({
    text: ''
  })
}
// When we mark a chore as complete
handleCheck(e) {
 const clickedChore = e.target.value
 this.toggleChore(clickedChore)
}
```

If you remember from our `render()` function above, we're going to pass these event handlers to our components as props so we can decouple our business logic from our UI. 

### The Main Event

Now that we can add and check off chores from our list, we have to make the app collaborative with the rest of the house! 

To do this we need to know about two important parts of the Pusher API: Channels and Events. A channel is a namespace for a collection of events. A client can *subscribe* to a specific channel, awaiting events to be fired on it, and both the server and the client can *trigger* an event on that channel that will be broadcast to the other subscribers. In order to act on triggered events, a subscriber must *bind* events to handler functions that will be called when that event is received. 

Let me show you what that looks like in our Chores app. We'll start off by  instantiating Pusher in our React app with our app key (from our Pusher account) and some options, in this case our Pusher app cluster:

```
const pusher = new Pusher(config.key, {
  cluster: config.cluster
});
```

We then have to set up our subscription which is a connection to the server-side WebSocket. In React, the way to do this is in the `ComponentDidMount` lifecycle function.  In our case we'll be subscribing to a channel called `chores`: 

```
let channel = pusher.subscribe('chores');
```

Piece of cake! Once we're subscribed, we can bind the events that are triggered on that  channel to handler functions we define. The format looks something like: 

```
channel.bind('myEventName', myHandlerFunction);
```

Pusher has this neat feature where you can bind a handler to Pusher channel events (prexifed by `pusher:`) that return information about our connection. We can check our subscription succeded by doing the following: 

```
channel.bind('pusher:subscription_succeeded', () => {
      console.log('subscription succeeded! 🎉');
    });
```

Once we're satisfied with our connection we can bind handlers to `newChore` and `toggleChore` events that might come in from the server when other members of the household edit the list. If you recall, we've already written generic handler functions for both those actions in our React component so we can simply bind them directly to the events like so:

```
channel.bind('newChore', this.addChore);
channel.bind('toggleChore', this.toggleChore);
```

With that we are ready to handle incoming events!! 

### The Final Piece


The last thing we need to take care of, is updating our Pusher channel whenever *we* make a change so that it'll broadcast in realtime to the housemates. The way we're going to do this is by making an async `POST` HTTP request to our server that will then trigger an event on the `chores` channel. 


#### Server

Our server is an Express app and looks something like this:

```
var config = require('./config')
var bodyParser = require('body-parser');
var express = require('express')
var app = express()

app.use(express.static('public/'))
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.post('/newChore', function (req, res) {
  console.log('New chore request:', req.body);
  /* 
  --------------------------------------------------
  LOGIC FOR ADDING A NEW CHORE TO THE LIST GOES HERE
  --------------------------------------------------
  */
})

app.post('/toggleChore', function (req, res) {
  console.log('Toggle chore request:', req.body);
  /* 
  --------------------------------------------------
  LOGIC FOR CHECKING/UNCHECKING A CHORE GOES HERE
  --------------------------------------------------
  */
})

app.listen(process.env.PORT || 3000, function () {
  console.log('👂 App listening on port 3000!
  ')
})

```

The last thing we're missing is adding the [Pusher Realtime API][pusher] so we're going to go ahead and require our `config.js` file as well as the Pusher module:


```
var config = require('./config')
var Pusher = require('pusher')
```

We then have to instansiate Pusher using our app credentials:


```
var pusher = new Pusher({
  appId: config.app_id,
  key: config.key,
  secret: config.secret,
  cluster: config.cluster
});
```

and we can now fill in the logic of our endpoints with Pusher triggers like so:


```
pusher.trigger(
    'chores', // Our channel name
    'addChore', // The event name
    { chore: newChore }, // The data payload
     clientId // Options. in this case the client's socket id to avoid duplicate broadcasting
   );
```



[pusher]:https://pusher.com
[newacct]:https://pusher.com/signup
[source]: https://github.com/elischutze/react-pusher-todo-app
[pushjs]: https://github.com/pusher/pusher-js
[npm]: https://npmjs.com
[yarn]: https://yarnpkg.com