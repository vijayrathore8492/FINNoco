if (process.env.NC_DD_APM_ENABLED === 'true') {
  const tracer = require('dd-trace').init();
}
const Noco = require("../build/main/lib/Noco").default;
const express = require('express');
const cors = require('cors');
const server = express();
server.enable('trust proxy');
server.use(cors());


server.set('view engine', 'ejs');


(async () => {
  const httpServer = server.listen(process.env.PORT || 8080, async () => {
    server.use(await Noco.init({}, httpServer, server));
  })

  const keepAliveTimeoutSeconds = parseInt(process.env.NC_KEEP_ALIVE_TIMEOUT_SECONDS);
  if(Number.isFinite(keepAliveTimeoutSeconds)) httpServer.keepAliveTimeout = keepAliveTimeoutSeconds * 1000;

  server.use(await Noco.init({}, httpServer, server));
})().catch(e => console.log(e))
