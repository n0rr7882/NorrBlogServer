const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const authentication = require('./tools/authentication');

const models = require('./models');

const config = require('./config/config');

const app = express();

models.sequelize.sync({ force: config.reset }).then(() => {
	console.log('✓ DB connection success.');
}).catch(err => {
	console.error(err);
	console.log('✗ DB connection error. Please make sure DB is running.');
	process.exit();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
	limits: { fileSize: 50 * 1024 * 1024 }
}));

app.use(authentication);

app.use('/sign', require('./routes/sign'));
app.use('/users', require('./routes/user'));
app.use('/posts', require('./routes/post'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
	let err = new Error('404 Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500).json({
		status: { success: false, message: err.message }
	}).end();
});

module.exports = app;
