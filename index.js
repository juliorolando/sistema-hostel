const express = require('express');
const app = express();
const cors = require('cors')
const { sequelize } = require('./source/connection');
const path = require('path')
const bodyparser = require('body-parser')
const moment = require('moment');
const session = require('express-session')
const passport = require('passport');
const flash = require('connect-flash');

/* const flashMessageMiddleware = require('./config/middlewares'); */


// 2:25:09
app.use(session({ 
    secret: 'brbead',
    resave: false,
    saveUninitialized: false,

 }))

 app.use(flash());
/* 
app.use(flashMessageMiddleware.flashMessage);
 */


require('./config/passport');

app.use(bodyparser.urlencoded({limit: '5000mb', extended: true, parameterLimit: 100000000000}));
app.use(cors());
app.use(express.json());
app.set('views', path.join(__dirname + '/views'))
app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    next()
})

app.use(require('./source/routes/index'))

/* app.use((req, res, next) => {
    app.locals.error = req.flash('error')
    next()
}) */



app.listen(3000, console.log("Server on - port: 3000"))


