import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect('mongodb://mongo:27017/support');

io.on('connection', socket => {
  console.log('connected', socket.id);
});

server.listen(4000, () => console.log('Backend running'));
