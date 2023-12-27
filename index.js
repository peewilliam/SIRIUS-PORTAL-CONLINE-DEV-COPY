// Import packages
const express = require('express');
const http = require('http'); // Add this line
const path = require('path');


// Middlewares
const app = express();

app.use(express.json());


// Create an HTTP server using the Express app
const server = http.createServer(app); // Replace 'app' with your Express app instance


// Import routes pages
const listApp = require('./routes/app');
const api = require('./routes/api');



// Statics
app.use('/assets', express.static(path.join(__dirname, 'public/assets')))
// app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')))


// Routes

app.use('/api', api);
app.use('/', listApp);



// connection
const port = process.env.PORT || 9001;
server.listen(port, () =>
  console.log(`Listening to port http://localhost:${port} Node.js v${process.versions.node}!`)
);
