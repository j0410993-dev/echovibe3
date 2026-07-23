const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (index.html, CSS, JS, assets) from the current directory
app.use(express.static(__dirname));

// Fallback route: send index.html for any unhandled routes (useful for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`EchoVibe server is running on port ${PORT}`);
});
