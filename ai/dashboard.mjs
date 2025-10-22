import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = express();
const PORT = 8082;

const TMP_DIR = path.resolve(new URL('.', import.meta.url).pathname, "../tmp");

// Serve static HTML
app.get("/", (req, res) => {
    fs.readFile(path.resolve(TMP_DIR, "dashboard.html"), "utf8", (err, data) => {
        if(err) return res.status(500).send("Dashboard not ready.");
        res.type("html").send(data);
    });
});

// API: Return latest qbits as JSON
app.get("/api/qbits", (req, res) => {
    const files = fs.readdirSync(TMP_DIR).filter(f => f.endsWith(".json"));
    const result = files.map(f => JSON.parse(fs.readFileSync(path.join(TMP_DIR, f), "utf8")));
    res.json(result);
});

// API: Syntax-highlight Python using Pygments
app.get("/api/highlight/python/:filename", (req, res) => {
    const file = path.join(TMP_DIR, req.params.filename);
    if(!fs.existsSync(file)) return res.status(404).send("File not found.");

    exec(`pygmentize -f html -O full,style=monokai "${file}"`, (err, stdout, stderr) => {
        if(err) return res.status(500).send(stderr);
        res.type("html").send(stdout);
    });
});

// API: Raw JSON for JS/HTML/CSS, handled by Prism.js in dashboard.html
app.get("/api/raw/:filename", (req, res) => {
    const file = path.join(TMP_DIR, req.params.filename);
    if(!fs.existsSync(file)) return res.status(404).send("File not found.");
    res.type("json").send(fs.readFileSync(file, "utf8"));
});

app.listen(PORT, () => {
    console.log(`[API] Local dashboard API running on :${PORT}`);
});
