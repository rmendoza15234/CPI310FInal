/*
Author: Alexander Martinez
Date: 11/24/20
Description: This web application is based on guest lecturer Chuck Dries' tutorial. It includes a basic message board along with a login system.
*/

import express from "express"; //importing express and handlebars
import exphbs from "express-handlebars";
import bcrypt from "bcrypt"; //importing bcrypt
import cookieParser from "cookie-parser"; //import cookie-parser

import sqlite3 from "sqlite3"; //importing sqlite
import { open } from "sqlite";

import { grantAuthToken, lookupUserFromAuthToken } from "./auth";
import { score } from "./game"

export const dbPromise = open({ //exporting dbPromise to use in auth.js
    filename: "data.db",
    driver: sqlite3.Database,
});

const app = express(); //express object used to interact with express functionalities
const port = 8000;

app.engine("handlebars", exphbs()); //handlebars setup
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: false })); //middleware to parse the request body
app.use("/static", express.static(__dirname + "/static")); //middleware to register the static content
app.use(cookieParser()); //middleware to use cookie-parser

app.use(async (req, res, next) => {
    const { authToken } = req.cookies;
    if(!authToken) //if the authToken does not exist, then the user is not logged in
    {
        return next(); //if there is no authToken, it moves on to the next middleware call
    }
    try
    {
        const user = await lookupUserFromAuthToken(authToken);
        req.user = user; //places the user object on the request object, so in every middleware/endpoint call afterwards will have req.user if the user is logged in
    }
    catch(exception)
    {
        return next(exception); //if an error is caught, the next function with the error parameter is called to go to the express error handling code
    }
    next(); //moves on to the next middleware call
});

app.get("/", async (req, res) => {
    //read messages from the database
    const db = await dbPromise;
    const messages = await db.all(`SELECT
        Messages.id,
        Messages.content,
        Users.username as authorName
        FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id;`); //grabs all the messages along with the user who posted the message
    console.log("messages", messages);

    res.render("home", { user: req.user }); //renders the home page
});

app.get("/game", async (req, res) => {
    //read messages from the database
    const db = await dbPromise;
    const messages = await db.all(`SELECT
        Messages.id,
        Messages.content,
        Users.username as authorName
        FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id;`); //grabs all the messages along with the user who posted the message

    res.render("game", { user: req.user }); //renders the standings page
});

app.get("/standings", async (req, res) => {
    //read messages from the database
    const db = await dbPromise;
    const messages = await db.all(`SELECT
        Messages.id,
        Messages.content,
        Users.username as authorName
        FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id;`); //grabs all the messages along with the user who posted the message

    res.render("standings", { messages: messages, user: req.user }); //renders the standings page
});

app.get("/profile", async (req, res) => {
    //read messages from the database
    const db = await dbPromise;
    const messages = await db.all(`SELECT
        Messages.id,
        Messages.content,
        Users.username as authorName
        FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id;`); //grabs all the messages along with the user who posted the message

    res.render("profile", { user: req.user }); //renders the profile page
});

app.get("/forum", async (req, res) => {
    //read messages from the database
    const db = await dbPromise;
    const messages = await db.all(`SELECT
        Messages.id,
        Messages.content,
        Users.username as authorName
        FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id;`); //grabs all the messages along with the user who posted the message
    console.log("messages", messages);

    res.render("forum", { messages: messages, user: req.user }); //renders the messages and user to the forum page
});

app.get("/register", (req, res) => { //wiring up registration page
    if(req.user)
    {
        return res.redirect("/"); //redirects to home to prevent registered users from registering again
    }
    res.render("register");
});

app.get("/login", (req, res) => { //wiring up login page
    if(req.user)
    {
        return res.redirect("/"); //redirects to home to prevent registered users from logging in again
    }
    res.render("login");
});

app.post("/register", async (req, res) => {
    const db = await dbPromise;
    const {
        username,
        email,
        password
    } = req.body;
    const passwordHash = await bcrypt.hash(password, 10); //hashes the password

    try
    {
        await db.run("INSERT INTO Users (username, email, password) VALUES (?, ?, ?);", username, email, passwordHash) //inserts the information into the Users table

        const user = await db.get("SELECT id FROM Users WHERE email=?;", email) //grabs the email of the user that just registered
        const authToken = await grantAuthToken(user.id); //keeps the user logged in if already registered
        res.cookie("authToken", authToken); //sets authToken as a cookie
        res.redirect("/"); //redirects to home page
    }
    catch(exception)
    {
        return res.render("register", { error: exception }); //renders the login page and throws an error
    }
});

app.post("/login", async (req, res) => {
    const db = await dbPromise;
    const {
        email,
        password
    } = req.body;

    try
    {
        const existingUser = await db.get("SELECT * FROM USERS WHERE email=?;", email);
        if(!existingUser) //checks if the user entered does not exist
        {
            throw "Incorrect login"; //throw an error saying Incorrect login
        }
        const passwordsMatch = await bcrypt.compare(password, existingUser.password); //compares the entered password to the user's password
        if(!passwordsMatch) //checks if the password entered does not exist
        {
            throw "Incorrect login"; //throws the same error if the user does exist but the wrong password is entered for security reasons
        }
        const authToken = await grantAuthToken(existingUser.id);
        res.cookie("authToken", authToken); //sets authToken as a cookie
        res.redirect("/"); //redirects to home page after login
    }
    catch(exception)
    {
        return res.render("login", { error: exception });
    }

});

app.post("/message", async (req, res) => {
    if(!req.user)
    {
        res.status(401); //code for not being logged in
        return res.send("must be logged in to post to the message board"); //error message if the user tries to send a message without being logged in
    }
    //write messsages to the database
    const db = await dbPromise;
    await db.run("INSERT INTO Messages (content, authorId) VALUES (?, ?);", req.body.message, req.user.id); 
    res.redirect("/forum");
});

app.post("/logout", (req, res) => { //logout function
    if(req.user) //checks if the user is logged in
    {
        res.clearCookie("authToken"); //if so, their cookie is cleared which logs the user out
    }
    console.log(req.user.username, "has logged out");
    res.redirect("/"); //redirects to the home page
})

app.use((req, res, next) => { //if none of the pages render, 404 error
    next({
        status: 404,
        message: `${req.path} not found`
    });
});

app.use((err, req, res, next) => { //error handler
    res.status(err.status || 500)
    console.log(err);
    res.render("error", { error: err.message || err });
});

const setup = async () => { //setup function
    const db = await dbPromise; //get access to the database
    await db.migrate(); //run the migration

    app.listen(port, () => { //starts the web application on localhost:8080
        console.log("listening on port", port);
    });
};

setup();