var
	fs = require('fs'),
	https = require('https'),
	express = require('express'),
	app = express(),
	session = session = require('express-session'),
	FileStore = require('session-file-store')(session),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	users = [{id:0, name:'admin', password:'admin'}, {id:1, name:'tester', password:'tester'}];

function authenticate(username, password, done)
{
	for (var i = 0; i < users.length; i++)
	{
		if (username != users[i].name)
		{
			continue;
		}
		if (password != users[i].password)
		{
			return done(null, false, {message: 'Incorrect password.'});
		}
		return done(null, users[i]);
	}
	return done(null, false, {message: 'Incorrect username.'});
}

function serializeUser(user, done)
{
	done(null, user.id);
}

function deserializeUser(id, done)
{
	for (var i = 0; i < users.length; i++)
	{
		if (users[i].id != id)
		{
			continue;
		}
		done(null, users[i]);
		return;
	}
	done(null, false);
}

passport.use('local-login', new LocalStrategy(authenticate));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(session({
	store: new FileStore(),
	secret: 'luck',
	resave: false,
	saveUninitialized: false,
	cookie: {secure:true} }));
app.use(passport.initialize());
app.use(passport.session());

function getRoot(req, res)
{
	res.sendFile('index.html', {root:'./'});
}

function postLogin(req, res)
{
	res.cookie('username', req.user.name, {secure:true });
	req.session.save(function(err) {
		res.redirect('/');
	});
}

function getLogout(req, res)
{
	res.clearCookie('username');
	req.logout();
	req.session.save(function(err) {
		res.redirect('/');
	});
}

app.get('/', getRoot);
app.post('/login', passport.authenticate('local-login'), postLogin);
app.get('/logout', getLogout);

https.createServer({
	key: fs.readFileSync('newkey.pem'),
	cert: fs.readFileSync('cert.pem')
}, app).listen(443, function () { console.log('listening 443'); });

express().get('*',function (req, res) {
	res.redirect('https://' + req.hostname + req.originalUrl);
}).listen(80)
