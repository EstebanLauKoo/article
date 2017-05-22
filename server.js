/* Note Taker (18.2.6)
 * backend
 * ==================== */

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose")
// Requiring our models
var Note = require("./models/Note.js")
var Article = require("./models/Article.js")
//Scraper
var request = require("request")
var cheerio = require("cheerio")

mongoose.Promise = Promise;

var PORT = 4000
var app = express();

// Set the app up with morgan, body-parser, and a static folder
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

var exphbs = require("express-handlebars")

app.engine("handlebars", exphbs({ defaultLayout: "main"}))
app.set("view engine", "handlebars")

//Makes public a static dir.
app.use(express.static("public"));

// Database configuration
var databaseUrl = "articles";
var collections = ["notes"];


// Hook mongojs config to db variable
mongoose.connect("mongodb://localhost/homeworkArticles")
var db = mongoose.connection

// Log any mongojs errors to console
db.on("error", function(error) {
  console.log("Database Error:", error);
});

db.once("open", function () {
    console.log("Mongoose connection successful")
})


// Routes
// ======
// Create a new note or replace an existing note

app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note the db
    newNote.save(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Otherwise
        else {
            // Use the article id to find and update it's note
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
            // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // Or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});

// Simple index route
app.get("/", function(req, res) {
    //scrape
    request("https://www.reddit.com/r/nottheonion", function (error, response, html) {
        if (error)
            throw error;

        var $ = cheerio.load(html)

        var result = {}

        $("p.title").each(function (i, element) {
            var title = $(this).text()
            var link = $(element).children().attr("href")

            result.title = $(this).text()
            result.link = $(element).children().attr("href")

            var entry = new Article(result)

            console.log(entry)

            entry.save(function (err, doc) {
                if (err) {
                    throw err
                }
                else {
                    console.log(doc)
                }
            })
        })
    })

    Article.find({}, function (error, doc) {
        var hbsObject = {
            Article: doc
        }
        if (error)
            throw error
        else {
            res.render("index", hbsObject)
        }
    })
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
    // ..and populate all of the notes associated with it
        .populate("note")
        // now, execute our query
        .exec(function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});
// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
