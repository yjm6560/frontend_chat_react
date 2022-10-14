const serverInfo = {
    ip : process.env.SERVER_IP,
    port : process.env.SERVER_PORT,
    url : `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}`
}

export { serverInfo };
