var config = require('./config')
var bodyParser = require('body-parser');

var express = require('express')
var app = express()

var Pusher = require('pusher')
var pusher = new Pusher({
  appId: config.app_id,
  key: config.key,
  secret: config.secret,
  cluster: config.cluster
});

app.use(express.static('public/'))
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.post('/newChore', function (req, res) {
  console.log('Request: ', req.body);
  var newChore = req.body.chore
  var client = req.body.socketId
  console.log('new Chore:', newChore);
  pusher.trigger('chores', 'addChore', {
    chore: newChore
  }, client);
  // res.sendStatus(200)
})

app.post('/toggleChore', function (req, res) {
  console.log('Request: ', req.body);
  var changedChore = req.body.chore
  var client = req.body.socketId
  console.log('toggled Chore:', changedChore);
  pusher.trigger('chores', 'toggleChore', {
    chore: changedChore
  }, client);
  // res.sendStatus(200)
})

app.listen(process.env.PORT || 3000, function () {
  console.log('👂 App listening on port 3000')
})
