var
	fs = require('fs'),
	express = require('express'),
	session = require('express-session'),
	NedbSessionStore = require('nedb-session-store')(session),
	passport = require('passport'),
	PassportLocal = require('passport-local').Strategy,
	NeDB = require('nedb'),
	bcrypt = require('bcrypt-nodejs');

function hashPassword(password)
{
	return bcrypt.hashSync(password);
}

function validatePassword(hash, password)
{
	return bcrypt.compareSync(password, hash);
}

var db = new NeDB({ filename: 'user.db', autoload: true });
db.find({ name : { $exists: true }}, function (err, users) {
	if (users.length == 0)
	{
		db.insert({
			name : 'flyn',
			password : hashPassword('tron'),
		});
	}
	else console.log(users);
});

function login(username, password, done)
{
	db.findOne({ name: username }, function (err, user)
	{
		if (err) { return done(err); }
		if (!user)
		{
			return done(null, false, { message: 'Incorrect username.' });
		}
		if (!validatePassword(user.password,password))
		{
			return done(null, false, { message: 'Incorrect password.' });
		}
		return done(null, user);
	});
}

function signup(username, password, done)
{
	db.findOne({ name: username }, function (err, user)
	{
		if (err) { return done(err); }
		if (user)
		{
			return done(null, false, { message: 'Username exists.' });
		}
		db.insert({
			name : username,
			password : hashPassword(password),
		}, function (err, user) {
			if (err) { return done(err); }
			return done(null, user);
		});
	});
}

function serializeUser(user, done)
{
	done(null, user._id);
}

function deserializeUser(id, done)
{
	db.findOne({ _id: id}, function (err, user)
	{
		if (err) { return done(err); }
		done(null, user);
	});
}

passport.use('local-login', new PassportLocal(login));
passport.use('local-signup', new PassportLocal(signup));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

function getFavicon(req, res)
{
	res.sendFile('favicon.ico', {root:'./'});
}

function postLogin(req, res)
{
	req.session.save(function(err) {
		res.redirect('/');
	});
}

function postSignup(req, res)
{
	req.session.save(function(err) {
		res.redirect('/');
	});
}

function getLogout(req, res)
{
	req.logout();
	req.session.save(function(err) {
		res.redirect('/');
	});
}

function getDelete(req, res)
{
	if (!req.user)
	{
		res.redirect('/');
	}
	db.remove({_id:req.user._id}, {}, function (err, count) { console.log('delete',err,count)});
	req.logout();
	req.session.save(function(err) {
		res.redirect('/');
	});
}

function getAllWriteCookie(req, res, next)
{
	if (req.user)
	{
		res.cookie('username', req.user.name, {secure:true});
	}
	else
	{
		res.clearCookie('username');
	}
	next();
}

function getAll(req, res)
{
	console.log(req.user? req.user.name : undefined, req.originalUrl);
	res.sendFile('index.html', {root:'./'});
}

app = express();
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(session({
	store: new NedbSessionStore({filename: 'session.db'}),
	secret: 'luck',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure:true,
		maxAge:1000*60*60*24*7
	}
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/favicon.ico', getFavicon);
app.post('/login', passport.authenticate('local-login'), postLogin);
app.post('/signup', passport.authenticate('local-signup'), postSignup);
app.get('/logout', getLogout);
app.get('/delete', getDelete);
app.get('*', getAllWriteCookie);
app.get('*', getAll);

require('https').createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
}, app).listen(443, function () { console.log('listening 443'); });

express().get('*',function (req, res) {
	res.redirect('https://' + req.hostname + req.originalUrl);
}).listen(80)
