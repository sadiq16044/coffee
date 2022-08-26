const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// //Connect to MongoDb
// const url = "mongodb://localhost:27017/test";

// mongoose.connect(url);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'error connection: '));
// db.once('open', () => console.log('connected to Mongodb'));

//Init app
const app = express();

//view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//set public folder
app.use(express.static(path.join(__dirname, 'public')));

// body parser middleware
// parse application/x www form urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// set routes
const pages = require('./routes/pages.js');

app.use('/', pages);

////// if no routes found send error
// app.use(function(req, res, next) {
//     res.render('404.ejs');
// });

//start the server
const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});