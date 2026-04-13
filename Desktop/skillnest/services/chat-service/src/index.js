const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db.js');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

app.use('/', require('./routes/chatRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));

// Online users map: userId -> socketId
const onlineUsers = new Map();

// Helper: create notification in DB and emit via socket
async function createNotification({ receiver_id, sender_id, sender_name, type, message, link }) {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (receiver_id, sender_id, sender_name, type, message, link, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
      [receiver_id, sender_id, sender_name, type, message, link]
    );
    const notif = result.rows[0];

    // Emit real-time if receiver is online
    const receiverSocketId = onlineUsers.get(receiver_id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_notification', notif);
    }
    return notif;
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
}

// Expose createNotification for routes
app.set('createNotification', createNotification);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User comes online
  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
    console.log('Online:', userId);
  });

  // Join private room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log('Joined room:', roomId);
  });

  // Send message — also creates notification
  socket.on('send_message', async (data) => {
    const roomId = [data.sender_id, data.receiver_id].sort().join('_');
    io.to(roomId).emit('receive_message', data);
    console.log('Message:', data.sender_id, '->', data.receiver_id);

    // Only notify if receiver is NOT in the same room
    const receiverSocket = onlineUsers.get(data.receiver_id);
    const receiverInRoom = receiverSocket
      ? io.sockets.adapter.rooms.get(roomId)?.has(receiverSocket)
      : false;

    if (!receiverInRoom) {
      await createNotification({
        receiver_id: data.receiver_id,
        sender_id: data.sender_id,
        sender_name: data.sender_name || 'Someone',
        type: 'message',
        message: `${data.sender_name || 'Someone'} sent you a message`,
        link: '/chat',
      });
    }
  });

  // Follow notification
  socket.on('follow_user', async (data) => {
    await createNotification({
      receiver_id: data.receiver_id,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      type: 'follow',
      message: `${data.sender_name} started following you`,
      link: '/users',
    });
  });

  // Friend request notification
  socket.on('send_request', async (data) => {
    await createNotification({
      receiver_id: data.receiver_id,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      type: 'connection_request',
      message: `${data.sender_name} sent you a connection request`,
      link: '/users',
    });
  });

  // Request accepted notification
  socket.on('accept_request', async (data) => {
    await createNotification({
      receiver_id: data.receiver_id,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      type: 'connection_accepted',
      message: `${data.sender_name} accepted your connection request`,
      link: '/users',
    });
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const roomId = [data.sender_id, data.receiver_id].sort().join('_');
    socket.to(roomId).emit('user_typing', { userId: data.sender_id });
  });

  socket.on('stop_typing', (data) => {
    const roomId = [data.sender_id, data.receiver_id].sort().join('_');
    socket.to(roomId).emit('user_stop_typing', { userId: data.sender_id });
  });

  // Disconnect
  socket.on('disconnect', () => {
    onlineUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log('Offline:', userId);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`chat-service running on port ${PORT}`);
});