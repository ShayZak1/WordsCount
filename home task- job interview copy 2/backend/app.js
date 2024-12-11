const express = require('express');    // Import Express framework
const bodyParser = require('body-parser'); // Helps parse JSON from requests
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Serve the frontend files from the 'public' folder (or 'frontend' if you have that folder)
app.use(express.static(path.join(__dirname, '../frontend')));

function isLetter(char) {
    return /\p{Letter}/u.test(char);
}

function countLetters(text) {
    const counts = {};
    for (let ch of text) {
        if (isLetter(ch)) {
            let lowerCh = ch.toLowerCase();
            counts[lowerCh] = (counts[lowerCh] || 0) + 1;
        }
    }
    return counts;
}

function countWords(text) {
    const words = text.trim().split(/\s+/);
    const counts = {};
    for (let w of words) {
        let word = w.toLowerCase();
        counts[word] = (counts[word] || 0) + 1;
    }
    return counts;
}

function countWordsWithRepeat(text) {
    const wordRepeat = text.trim().split(/\s+/);
    let repCount = 0;
    for (let w of wordRepeat) {
        const letterMap = {};
        let isRepeat = false;
        for (let ch of w) {
            if (isLetter(ch)) {
                let lowChar = ch.toLowerCase();
                // Use bracket notation for object property
                letterMap[lowChar] = (letterMap[lowChar] || 0) + 1;
                if (letterMap[lowChar] > 1) {
                    isRepeat = true;
                    break;
                }
            }
        }
        if (isRepeat) repCount++;
    }
    return repCount;
}

app.post('/analyze', (req, res) => {
    const inputText = req.body.text || "";
    if (!inputText.trim()) {
        return res.status(400).json({ error: 'No Text Is Provided!' });
    }

    const lettersCount = countLetters(inputText);
    const wordCount = countWords(inputText);
    const repeatCount = countWordsWithRepeat(inputText);

    const result = {
        letter_counts: lettersCount,
        word_counts: wordCount,
        words_with_repeats: repeatCount
    };

    const db = new sqlite3.Database('history.db');
    db.run("INSERT INTO history (input_text, result_json) VALUES (?, ?)",
        [inputText, JSON.stringify(result)],
        function (err) {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({
                id: this.lastID,
                ...result
            });
        }
    );
});

app.get('/history', (req, res) => {
    const db = new sqlite3.Database('history.db');
    db.all("SELECT id, input_text FROM history ORDER BY id DESC LIMIT 15", (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows.map(r => ({ id: r.id, text: r.input_text })));
    });
});

app.get('/get_result/:id', (req, res) => {
    const entryId = req.params.id;
    const db = new sqlite3.Database('history.db');
    db.get("SELECT result_json FROM history WHERE id=?", [entryId], (err, row) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Not found' });
        }
        const result = JSON.parse(row.result_json);
        res.json(result);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
