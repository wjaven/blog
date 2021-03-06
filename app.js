var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var upload = require('./utils/multerUtil');

// var index = require('./routes/index');
// var users = require('./routes/users');
var routes = require('./routes/index');

var settings = require('./settings');

// 配置日志文件
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('access.log', {flags: 'a'});

var app = express();

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());


// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream: accessLog})); //保存为日志文件

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//日志文件位置
app.use(function(err, req, res, next) {
  var meta = '[' + new Date() + ']' + req.url + '/n';
  errorLog.write(meta + err.stack + '/n');
  next();
});

// app.use('/', index);
// app.use('/users', users);

app.use(upload.any());
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db, // cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, // 30days
  store: new MongoStore({
//  db: settings.db,
//  host: settings.host,
//  port: settings.port
    url: 'mongodb://'+settings.host+'/'+settings.db
  }),
  resave: true,
  saveUninitialized: true
}));

routes(app);

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

// catch 404 and forward to error handler
//app.use(function(req, res, next) {
//var err = new Error('Not Found');
//err.status = 404;
//next(err);
//});
//
//// error handler
//app.use(function(err, req, res, next) {
//// set locals, only providing error in development
//res.locals.message = err.message;
//res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//// render the error page
//res.status(err.status || 500);
//res.render('error');
//});

module.exports = app;
