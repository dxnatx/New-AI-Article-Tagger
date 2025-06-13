# New-AI-Article-Tagger
An updated AI Tagging of Articles code that uses Node.js only and no external Machine Learning Libraries

AI Tagging of Articles
Tech: Node.js only (no external ML libraries)


POST /articles – accept title + content, auto-generate tags (e.g., top 3 most frequent words)


GET /articles


PUT /articles?id=1


DELETE /articles?id=1


With /export that returns all articles in downloadable .json format

It Store data in memory or in .json files using fs.writeFileSync and fs.readFileSync
Use http, url, fs, and querystring Node.js core modules
Use Postman or curl for testing — no UI needed.
