const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const PORT = 3000;
const app = express();

app.use(
	session({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);

app.set("view engine", "ejs");

mongoose
	.connect("mongodb://127.0.0.1:27017/pokemonApp")
	.then(() => console.log("MongoDB conected"))
	.catch((err) => console.log("MongoDB Connection Error:", err));

const favSchema = new mongoose.Schema({
	username: String,
	pokemonname: String,
});

const favorite = mongoose.model("favorite", favSchema);

function isAuthenticated(req, res, next) {
	if (req.session && req.session.user) {
		next();
	} else {
		res.redirect("/login");
	}
}

app.listen(PORT, () => {
	console.log(`server is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
	res.redirect("/login");
});

app.get("/login", (req, res) => {
	res.sendFile(__dirname + "/login.html");
});

const userArr = [
	{ username: "admin1", password: "admin1" },
	{ username: "admin2", password: "admin2" },
	{ username: "user1", password: "user1" },
	{ username: "user2", password: "user2" },
	{ username: "user3", password: "user3" },
	{ username: "Mahsa", password: "Maria" },
];

app.use(express.urlencoded({ extended: true }));

app.post("/login", (req, res) => {
	const { username, password } = req.body;
	const user = userArr.find(
		(user) => user.username === username && user.password === password
	);

	if (user) {
		req.session.user = user;
		res.redirect("/home");
	} else {
		res.status(401).send("invalid credentials");
	}
});

app.get("/addFav/:pokemonname", isAuthenticated, async (req, res) => {
	const pokemonname = req.params.pokemonname;
	const username = req.session.user.username;

	try {
		const newFav = new favorite({ username, pokemonname });
		await newFav.save();
		res.json({ success: true, message: `${pokemonname} added to favorites` });
	} catch (error) {
		console.log(error);
		res.status(500).send("server error while adding favorites");
	}
});

app.get("/favorites", isAuthenticated, async (req, res) => {
	const username = req.session.user.username;
	try {
		const favorites = await favorite.find({ username: username });
		res.json(favorites);
	} catch (error) {
		console.error("error fetching favorites", error);
		res.status(500).send("server error fetching favorites");
	}
});

const timelineSchema = new mongoose.Schema({
	title: String,
	description: String,
	date: Date,
	username: String,
});

const Timeline = mongoose.model("Timeline", timelineSchema);

app.use(isAuthenticated);
app.get("/home", (req, res) => {
	//res.sendFile(__dirname + "/index.html");
	res.render("index", { username: req.session.user.username });
});
