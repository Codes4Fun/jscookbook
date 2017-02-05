var
	fs = require('fs'),
	connect = require('connect'),
	session = require('express-session'),
	SessionFileStore = require('session-file-store')(session),
	passport = require('passport'),
	PassportLocal = require('passport-local').Strategy;

function authenticate(username, password, done)
{
	if (username != 'flyn')
	{
		return done(null, false, {message: 'Incorrect username.'});
	}
	if (password != 'tron')
	{
		return done(null, false, {message: 'Incorrect password.'});
	}
	return done(null, 'flyn');
}

function serializeUser(user, done)
{
	done(null, user);
}

function deserializeUser(id, done)
{
	done(null, id);
}

passport.use('local-login', new PassportLocal(authenticate));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);



var app = connect();
app.use(session({
	store: new SessionFileStore({ttl:60*60*24*7}),
	secret: 'luck',
	resave: false,
	saveUninitialized: false,
	cookie: {secure:true} }));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local-login'), postLogin);
app.get('/logout', getLogout);
app.get('*', getAllWriteCookie);
app.get('*', getAll);

require('https').createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
}, app).listen(443, function () { console.log('listening 443'); });

connect().use(function (req, res) {
	res.writeHead(302, {
  		'Location': 'https://' + req.hostname + req.path
	});
	res.end();
}).listen(80)
