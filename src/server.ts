
import app from "./app";
import WebSocket from "ws";
import sessionParser from "./session-parser";
import { Game } from "./game";
import logger from "./logger";

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    logger.log('info', `App is running at http://localhost:${app.get("port")} in ${app.get("env")} mode`);
    logger.log('info', "  Press CTRL-C to stop\n");
});
  //
  // Create HTTP server by ourselves.
  //
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on('upgrade', (request, socket, head) => {
    logger.log('info', 'Parsing session from request...');

    sessionParser(request, socket, () => {
      if (!request.session.userId) {
        logger.log('warn', 'someone tried to open a socket without a session.');
        socket.destroy();
        return;
      }

      logger.log('info', `Session is parsed as ${request.session.userId}`);

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  });

  wss.on('connection', (ws, request) => {
    // hacky workaround to use express-session with ws.
    const userId = (request as any).session.userId;

    Game.wsConnections.set(userId.toString(), ws);

    ws.on('message', (message) => {
      logger.log('info', `Received message ${message} from user ${userId}`);
    });

    ws.on('close', () => {
      Game.wsConnections.delete(userId.toString());
    });
  });

export default server;