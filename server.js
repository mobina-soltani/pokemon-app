const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const { Favorite, Timeline } = require("./models");

const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose
	.connect("mongodb://127.0.0.1:27017/pokemonApp")
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.log("MongoDB Connection Error:", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Needed for DELETE via fetch()
app.use(express.static(__dirname)); // Serve HTML/CSS/JS

// Session Setup
app.use(
	session({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);

// Authentication Middleware
function isAuthenticated(req, res, next) {
	if (req.session && req.session.user) {
		next();
	} else {
		res.redirect("/login");
	}
}

// add dummy users
const userArr = [
	{
		username: "admin1",
		password: "$2b$10$KKmddhaVDf.mbBzcjOFOZOav614v6qt2zBhnrZ4hInCtsR60l2rxi",
	},
	{
		username: "admin2",
		password: "$2b$10$cUGIqLjV3hBM5oTYxos3i.2nYNmasaKsLMc.O5iFLBVGwUnBpba0y",
	},
	{
		username: "admin3",
		password: "$2b$10$5Q0x1Z9j6v4a7g8z5JmXUOe1YkKq0c4G3l5Fh6Q8W9Z5E7d2f3i1y",
	},
	{
		username: "admin4",
		password: "$2b$10$7Q0x1Z9j6v4a7g8z5JmXUOe1YkKq0c4G3l5Fh6Q8W9Z5E7d2f3i1y",
	},
	{
		username: "admin5",
		password: "$2b$10$8Q0x1Z9j6v4a7g8z5JmXUOe1YkKq0c4G3l5Fh6Q8W9Z5E7d2f3i1y",
	},
	{
		username: "admin6",
		password: "$2b$10$9Q0x1Z9j6v4a7g8z5JmXUOe1YkKq0c4G3l5Fh6Q8W9Z5E7d2f3i1y",
	},
];

// Routes
app.get("/", (req, res) => {
	res.redirect("/login");
});

app.get("/login", (req, res) => {
	res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", async (req, res) => {
	const { username, password, rememberMe } = req.body;
	const user = userArr.find((user) => user.username === username);

	if (user && (await bcrypt.compare(password, user.password))) {
		req.session.user = user;

		// Remember Me logic
		if (rememberMe) {
			req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
		} else {
			req.session.cookie.expires = false;
		}

		await Timeline.create({ username, action: "Logged in" });
		res.redirect("/home");
	} else {
		res.status(401).send("Invalid credentials");
	}
});

app.get("/logout", isAuthenticated, async (req, res) => {
	await Timeline.create({
		username: req.session.user.username,
		action: "Logged out",
	});
	req.session.destroy(() => res.redirect("/login"));
});

app.get("/home", isAuthenticated, (req, res) => {
	res.sendFile(path.join(__dirname, "home.html"));
});

app.get("/timelinePage", isAuthenticated, (req, res) => {
	res.sendFile(path.join(__dirname, "timeline.html"));
});

// Add favorite Pokémon
app.get("/addFav/:pokemonname", isAuthenticated, async (req, res) => {
	const { pokemonname } = req.params;
	const username = req.session.user.username;

	try {
		const newFav = new Favorite({ username, pokemonname });
		await newFav.save();
		await Timeline.create({
			username,
			action: `Added ${pokemonname} to favorites`,
		});
		res.json({ success: true, message: `${pokemonname} added to favorites` });
	} catch (error) {
		console.error("Add favorite error:", error);
		res.status(500).send("Server error while adding favorite");
	}
});

// Get all favorites
app.get("/favorites", isAuthenticated, async (req, res) => {
	const username = req.session.user.username;

	try {
		const favorites = await Favorite.find({ username });
		res.json(favorites);
	} catch (error) {
		console.error("Error fetching favorites", error);
		res.status(500).send("Server error fetching favorites");
	}
});

// Remove a favorite
app.delete("/favorites/:pokemonname", isAuthenticated, async (req, res) => {
	const { pokemonname } = req.params;
	const username = req.session.user.username;

	try {
		await Favorite.deleteOne({ username, pokemonname });
		await Timeline.create({
			username,
			action: `Removed ${pokemonname} from favorites`,
		});
		res.json({
			success: true,
			message: `${pokemonname} removed from favorites`,
		});
	} catch (error) {
		console.error("Error removing favorite", error);
		res.status(500).send("Server error");
	}
});

// Get timeline entries
app.get("/timeline", isAuthenticated, async (req, res) => {
	const username = req.session.user.username;
	try {
		const timeline = await Timeline.find({ username }).sort({ timestamp: -1 });
		res.json(timeline);
	} catch (err) {
		console.error("Error loading timeline", err);
		res.status(500).send("Error loading timeline");
	}
});

// Delete timeline entry
app.delete("/timeline/:id", isAuthenticated, async (req, res) => {
	try {
		await Timeline.findByIdAndDelete(req.params.id);
		res.json({ success: true, message: "Deleted timeline entry" });
	} catch (err) {
		console.error("Error deleting timeline entry", err);
		res.status(500).send("Error deleting timeline entry");
	}
});

// Prevent favicon error in browser
app.get("/favicon.ico", (req, res) => res.status(204));

// Start the server
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
