const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: "thisisasecret",
  maxAge: 24 * 60 * 60 * 1000
}))
app.use('/styles', express.static(__dirname + '/styles'));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "P8oWzh": "http://www.theweathernetwork.com"
};

const userDatabase = {
  "userID1" : {
    id: "userID1",
    email: "young@gmail.com",
    password: bcrypt.hashSync("asdf", 10),
    urls:{
      "P8oWzh": "http://www.weathernetwork.com"
    }
  }
};

function generateRandomString(length, characs) {
  var result = '';
    for (var i = length; i > 0; --i) {
      result += characs[Math.floor(Math.random() * characs.length)];
  }
  return result;
}

const characs= generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/");
  } else {
    res.render("urls_login");
  }
});

app.post("/login", (req, res) => {
  var emailMatches = false;

  for (var userEmail in userDatabase) {
    if (req.body.email === userDatabase[userEmail].email && bcrypt.compareSync(req.body.password, userDatabase[userEmail].password)) {
      req.session.user_id = userDatabase[userEmail].id;
    }
  }
  if (!emailMatches) {
    res.redirect("/");
  } else {
    res.status(401).send("Error 401: Username or password is incorrect.")
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/");
  } else {
    res.render("urls_register");
  }
});

app.post("/register", (req, res) => {
  var emailExists = false;
  var hashlength = 10;
  var newPassword = bcrypt.hashSync(req.body.password, hashlength);
  var newRandomID = generateRandomString(6, characs)

  for (var userKey in userDatabase) {
    if (req.body.email === userDatabase[userKey].email) {
      emailExists = true
    }
  }
  if (emailExists) {
    res.status(400).send("ERROR: Email provided is already registered.")
  } else if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("ERROR: Email and/or password was left blank.")
  } else {
    req.session.user_id = newRandomID;
      let user = {
        id: newRandomID,
        email: req.body.email,
        password: newPassword,
        urls:{}
      }
    userDatabase[user.id] = user;
    res.redirect("/urls")
  }
});


app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.status(401).send(`Error 401: Access Denied. Log in or register to continue. <br> <br> <a href="/login"> Login </a> <br> <br> <a href="/register"> Register </a>`);
  } else {
    let templateVars = {
      email: userDatabase[req.session.user_id].email,
      urls: userDatabase[req.session.user_id].urls
    }
    res.status(200).render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (userDatabase[req.session.user_id]) {
    let shortURL = generateRandomString(6, characs)
    userDatabase[req.session.user_id].urls[shortURL] = req.body.longURL;
    let shortLink = "/urls/" + shortURL
    res.redirect(shortLink);
  } else {
    res.status(401).send(`Error 401: Access Denied. Log in or register to continue. <br> <br> <a href="/login"> Login </a> <br> <br> <a href="/register"> Register </a>`);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.status(401).send(`Error 401: Access Denied. Log in or register to continue. <br> <br> <a href="/login"> Login </a> <br> <br> <a href="/register"> Register </a>`);
  } else {
    let templateVars = {
     email: userDatabase[req.session.user_id].email,
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (!req.params.id) {
    res.status(404).send("Error 404: Link does not exist.")
  } else if (req.session.user_id === undefined) {
    res.status(401).send(`Error 401: Access Denied. Log in or register to continue. <br> <br> <a href="/login"> Login </a> <br> <br> <a href="/register"> Register </a>`)
  } else if (userDatabase[req.session.user_id].urls[req.params.id] === undefined) {
    res.status(403).send("Error 403: Access Denied.")
  } else {
    let templateVars = {
    shortURL: req.params.id,
    longURL: userDatabase[req.session.user_id].urls[req.params.id],
    email:userDatabase[req.session.user_id].email,
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let key = req.params.id;
  delete userDatabase[req.session.user_id].urls[key];
  res.redirect('/urls');
});

app.post("/urls/:id/update", (req, res) => {
  if (!userDatabase[req.session.user_id].urls[req.params.id]) {
  res.status(404).send("Error 404: Link does not exist.")
} else if (req.session.user_id === undefined) {
  res.status(401).send(`Error 401: Access Denied. Log in or register to continue. <br> <br> <a href="/login"> Login </a> <br> <br> <a href="/register"> Register </a>`)
} else if (userDatabase[req.session.user_id].urls[req.params.id] === undefined) {
  res.status(403).send("Error 403: Access Denied.")
} else {
  var shortURL = req.params.id;
  var longURL = req.body.longURL;
  userDatabase[req.session.user_id].urls[shortURL] = longURL;
  res.redirect(`/urls`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send(`Error 401: Access Denied. Log in or register to continue. <br> <br> <a href="/login"> Login </a> <br> <br> <a href="/register"> Register </a>`)
  } else {
  let longURL = userDatabase[req.session.user_id].urls[req.params.shortURL];
  res.redirect(longURL);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls')
  } else {
    res.redirect('/login');
  }
});