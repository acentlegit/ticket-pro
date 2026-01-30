import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect('mongodb://mongo:27017/support');

app.get('/health', (_, res) => res.send('OK'));

io.on('connection', socket => {
  console.log('socket connected', socket.id);
});

server.listen(4000, () => console.log('Backend running on 4000'));
