#!/usr/bin/env node
const fs = require('fs');
const sqlite3 = require('sqlite3');
const path = require('path');

const vibeFile = process.argv[2];
const dbFile = process.argv[3];

const data = JSON.parse(fs.readFileSync(vibeFile, 'utf-8'));
const prompt = data.prompt;
const hashval = data.hash;

const agents = ['core','loop','code','coin','2244'];

const db = new sqlite3.Database(dbFile);

agents.forEach(agent => {
    const response = prompt.split('').reverse().join('') + '_js';
    db.run("INSERT INTO qbits(hash,agent,iteration,response,timestamp) VALUES (?,?,?,?,?)",
        [hashval, agent, 0, response, Date.now()/1000],
        err => { if(err) console.error(err); else console.log(`[JS] Resonance stored for ${agent}`); }
    );
});

db.close();
