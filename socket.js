//@ts-check
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

//@ts-ignore

const { setCache, getCache, setSocket } = require("./store");

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
    allowRequest: (req, callback) => {
      const origin = req.headers.origin || "";
      console.log(17, origin);
      const isAllowed = [
        "localhost:8990",
        "62.72.6.44:8990",
        "86.38.203.6:8990",
      ].some((item) => {
        return origin.includes(item) || origin == item;
      });

      callback(null, isAllowed);
    },
  });
  io.engine.use(cookieParser());

  io.of("/notif").on("connection", (socket) => {
    socket.emit("message", "connected");
    setSocket(socket);
  });
};
