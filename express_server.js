const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use('/styles', express.static(__dirname + '/styles'));
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "P8oWzh": "http://www.theweathernetwork.com"
};

const userDatabase = {
    userID1 : {
      id: "randomID",
      email: "young@gmail.com",
      password: "asdf"
  }
};

function generateRandomString(length, characs) {
    var result = '';
    for (var i = length; i > 0; --i) {
    result += characs[Math.floor(Math.random() * characs.length)];
   }
    return result;
}

function generateRandomID(length, user) {
    var result = '';
    for (var i = length; i > 0; --i) {
    result += user[Math.floor(Math.random() * user.length)];
   }
    return result;
}

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.email);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  for (var userEmail in userDatabase) {
    if (req.body.email === userDatabase[userEmail].email && req.body.password === userDatabase[userEmail].password) {
      res.cookie("user_id", userDatabase[userEmail].id);
      res.redirect("/urls");
    }
  }
    res.status(403).send("Access Forbidden")
});

//LOGIN

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {

  var emailExists = false;

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
      res.cookie("user_id", [req.body.email]);
      let user = {
        id: generateRandomID(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        email: req.body.email,
        password: req.body.password
      }
  userDatabase[user.id] = user;

  res.redirect("/urls")
  }
});

//REGISTER

app.get("/urls", (req, res) => {
  let templateVars = {
    email: req.cookies["user_id"],
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  // console.log(delete urlDatabase[key]);
  let key = req.params.id;
  delete urlDatabase[key];
  res.redirect('/urls');
});

//INDEX

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  var longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//NEW

app.post("/urls/:id/update", (req, res) => {
  var shortURL = req.params.id;
  var longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});

//SHOW

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