const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
// const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

const bcrypt = require('bcrypt');

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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  console.log(userDatabase);
  for (var userEmail in userDatabase) {
    // debugger;
    if (req.body.email === userDatabase[userEmail].email && bcrypt.compareSync(req.body.password, userDatabase[userEmail].password)) {

      req.session.user_id = userDatabase[userEmail].id;
      res.redirect("/urls");
    }
  }
    res.status(403).send("Access Forbidden")
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {

  var emailExists = false;
  var hashlength = 10;
  var newPassword = bcrypt.hashSync(req.body.password, hashlength);
  var newRandomID = generateRandomString(6, characs)
  console.log(newPassword);

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
        urls:{
        }
      }
  userDatabase[user.id] = user;

  res.redirect("/urls")
  }
});

app.get("/urls", (req, res) => {
  console.log(req.session.user_id);
  if (req.session.user_id === undefined) {
    res.redirect('/login')
  } else {
  let templateVars = {
    email: req.session.user_id,
    urls: userDatabase[req.session.user_id].urls};
  res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
    userDatabase[req.session.user_id].urls[generateRandomString(6, characs)] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let key = req.params.id;
  delete userDatabase[req.session.user_id].urls[key];
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    email: req.session.user_id,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  var shortURL = req.params.id;
  var longURL = req.body.longURL;
  userDatabase[req.session.user_id].urls[shortURL] = longURL;
  res.redirect(`/urls`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: userDatabase[req.session.user_id].urls[req.params.id],
    username: req.session.username,
    email:req.session.user_id,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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
  res.end("Hello!");
});