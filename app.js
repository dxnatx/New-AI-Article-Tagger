const http = require('http');
const url = require('url');
const fs = require('fs');
const querystring = require('querystring');

const DATA_FILE = 'data.json';
let articles = [];

// Load articles from file on startup
function loadArticles() {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        if (data) {
            articles = JSON.parse(data);
            console.log('Articles loaded from data.json');
        }
    }
}

// Save articles to file
function saveArticles() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), 'utf8');
    console.log('Articles saved to data.json');
}

// Simple tag generation: top 3 most frequent words
function generateTags(content) {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = {};
    for (const word of words) {
        // Exclude common stopwords and very short words
        if (word.length > 2 && !['the', 'and', 'a', 'an', 'in', 'of', 'for', 'is', 'on', 'with', 'as', 'at', 'be', 'to', 'this', 'that', 'it'].includes(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    }

    const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
    return sortedWords.slice(0, 3);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;
    const query = parsedUrl.query;

    res.setHeader('Content-Type', 'application/json');

    // Enable CORS for testing with Postman/curl if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (path === '/articles') {
        if (method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const { title, content } = JSON.parse(body);
                    if (!title || !content) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ message: 'Title and content are required.' }));
                        return;
                    }
                    const id = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
                    const tags = generateTags(content);
                    const newArticle = { id, title, content, tags };
                    articles.push(newArticle);
                    saveArticles();
                    res.writeHead(201);
                    res.end(JSON.stringify(newArticle));
                } catch (error) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ message: 'Invalid JSON body.', error: error.message }));
                }
            });
        } else if (method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(articles));
        } else if (method === 'PUT') {
            const articleId = parseInt(query.id);
            if (isNaN(articleId)) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid article ID.' }));
                return;
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const { title, content } = JSON.parse(body);
                    const articleIndex = articles.findIndex(a => a.id === articleId);

                    if (articleIndex === -1) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ message: 'Article not found.' }));
                        return;
                    }

                    if (title) articles[articleIndex].title = title;
                    if (content) {
                        articles[articleIndex].content = content;
                        articles[articleIndex].tags = generateTags(content); // Re-generate tags on content update
                    }

                    saveArticles();
                    res.writeHead(200);
                    res.end(JSON.stringify(articles[articleIndex]));
                } catch (error) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ message: 'Invalid JSON body.', error: error.message }));
                }
            });
        } else if (method === 'DELETE') {
            const articleId = parseInt(query.id);
            if (isNaN(articleId)) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid article ID.' }));
                return;
            }

            const initialLength = articles.length;
            articles = articles.filter(a => a.id !== articleId);

            if (articles.length < initialLength) {
                saveArticles();
                res.writeHead(200);
                res.end(JSON.stringify({ message: `Article with ID ${articleId} deleted.` }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Article not found.' }));
            }
        } else {
            res.writeHead(405);
            res.end(JSON.stringify({ message: 'Method Not Allowed' }));
        }
    } else if (path === '/export' && method === 'GET') {
        res.setHeader('Content-Disposition', 'attachment; filename="articles.json"');
        res.writeHead(200);
        res.end(JSON.stringify(articles, null, 2));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    loadArticles(); // Load articles when the server starts
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser (or use Postman/curl)`);
}); 

