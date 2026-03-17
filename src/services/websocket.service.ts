import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface WebSocketEvents {
  CARD_CREATED: 'card:created';
  CARD_UPDATED: 'card:updated';
  CARD_MOVED: 'card:moved';
  CARD_DELETED: 'card:deleted';
  COMMENT_CREATED: 'comment:created';
  COMMENT_UPDATED: 'comment:updated';
  COMMENT_DELETED: 'comment:deleted';
}

export const WS_EVENTS: WebSocketEvents = {
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_MOVED: 'card:moved',
  CARD_DELETED: 'card:deleted',
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
};

class WebSocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  private async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  private handleConnection(socket: Socket): void {
    const userId = socket.data.userId;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('disconnect', () => {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    });
  }

  emitToBoardMembers(boardId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`board:${boardId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();
