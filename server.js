const express = require("express");
const app = express();
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`server is running on http:\\localhost:${PORT}`);
});

app.get("/", (req, res) => {
    res.send("Hello world!");
});