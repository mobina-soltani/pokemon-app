const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const app = express();
const PORT = 3000;

app.listen(PORT, () => {
	console.log(`server is running on http:\\localhost:${PORT}`);
});

app.get("/", (req, res) => {
	res.redirect("/login");
});

app.get("/home", (req, res) => {
	res.sendFile(__dirname + "/index.html");
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
];

app.use(express.urlencoded({ extended: true }));
app.post("/login", (req, res) => {
	const { username, password } = req.body;
	const user = userArr.find(
		(user) => user.username === username && user.password === password
	);

	if (user) {
		res.redirect("/home");
	} else {
		res.status(401).send("invalid credentials");
	}
});
