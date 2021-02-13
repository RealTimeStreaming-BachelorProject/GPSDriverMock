// The signals we want to handle
var signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
};

export function listenForSignals(socket: SocketIOClient.Socket) {
  // Create a listener for each of the signals that we want to handle
  Object.keys(signals).forEach((signal) => {
    process.on(signal, () => {
      shutdown(signal, (signals as any)[signal], socket);
    });
  });
}
// Do any necessary shutdown logic for our application here
const shutdown = (signal: any, value: any, socket: SocketIOClient.Socket) => {
  console.log(`\nServer stopped by ${signal} with value ${value}`);
  socket.disconnect();
  process.exit(0);
};
