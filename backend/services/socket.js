let ioInstance = null;

const setSocketIo = (io) => {
  ioInstance = io;
};

const getSocketIo = () => ioInstance;

module.exports = {
  setSocketIo,
  getSocketIo,
};
