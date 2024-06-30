const express = require("express");
const connectDB = require("./config/db");
const routes = require("./routes/index");
const cors = require("cors");
const bodyParser = require("body-parser");
const ejsLayouts = require("express-ejs-layouts");
const app = express();

// use the cors middleware with the
// origin and credentials options
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.use(cors({ origin: true, credentials: true }));

// use the body-parser middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

// use the routes module as a middleware
// for the /api/books path
app.use(routes);

// Connect Database
connectDB();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
