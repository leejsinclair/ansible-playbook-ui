var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var getfile = require('./routes/getfile');
var listFiles = require('./routes/listFiles');
var setfile = require('./routes/setfile');
var delfile = require('./routes/delfile');
var runfile = require('./routes/runfile');
var checkfile = require('./routes/checkfile');
var stream = require('./routes/stream');

var basicAuth = require('express-basic-auth');

var hbs = require('hbs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//app.engine('html', require('hbs').__express)

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/resource')));

// Add Authentication
if( process.env.AUTH_USER && process.env.AUTH_PASSWORD ) {
  var obj = {};
  obj[process.env.AUTH_USER] = process.env.AUTH_PASSWORD;
  app.use(basicAuth({
      'users': obj,
      'challenge': true
  }));
}

app.use('/', index);
app.use('/files', listFiles);
app.use('/getfile', getfile);
app.use('/setfile', setfile);
app.use('/delfile', delfile);
app.use('/runfile', runfile);
app.use('/checkfile', checkfile);
app.use('/stream', stream);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
