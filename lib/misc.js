'use strict';

const path = require('path');
const httpServer = require('http-server');

const cm = 1 / 2.54;
const mm = 1 / 25.4;
const q = 1 / 101.6;
const inch = 1;
const pc = 1 / 6;
const pt = 1 / 72;
const px = 1 / 96;
const presetPageSize = {
  'a5': [148*mm, 210*mm],
  '4': [210*mm, 297*mm],
  'A3': [297*mm, 420*mm],
  'B5': [176*mm, 250*mm],
  'B4': [250*mm, 353*mm],
  'JIS-B5': [182*mm, 257*mm],
  'JIS-B4': [257*mm, 364*mm],
  'letter': [8.5*inch, 11*inch],
  'legal': [8.5*inch, 14*inch],
  'ledger': [11*inch, 17*inch],
};

module.exports = {
  convertSizeToInch,
  findPort,
  getBrokerUrl,
  launchBrokerServer,
  launchSourceServer,
};

function convertSizeToInch(size) {
  if (size in presetPageSize) {
    return presetPageSize[size];
  }

  const splitted = size.split(',');
  if (splitted.length !== 2) {
    throw new Error(`Cannot parse size : ${size}`);
  }
  const ret = splitted.map(str => {
    const match = str.trim().toLowerCase().match(/^([\d\.]+)([\w]*)$/);
    if (!match) {
      throw new Error(`Cannot parse size : ${str}`);
    }
    const num = +match[1];
    const unit = match[2];
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error(`Cannot parse size : ${str}`);
    }
    switch (unit) {
      case 'cm':
        return num*cm;
      case 'mm':
        return num*mm;
      case 'q':
        return num*q;
      case 'in':
        return num*inch;
      case 'pc':
        return num*pc;
      case 'pt':
        return num*pt;
      case '':
      case 'px':
        return num*px;
      default:
        throw new Error(`Cannot parse size : ${str}`);
    }
  });

  return ret;
}

function findPort() {
  const portfinder = require('portfinder');
  portfinder.basePort = 13000;
  return portfinder.getPortPromise();
}

function getBrokerUrl(sourcePort, sourceIndex, brokerPort) {
  const sourceUrl = `http://127.0.0.1:${sourcePort}/${sourceIndex}`;
  return `http://localhost:${brokerPort}/broker/index.html?render=${encodeURIComponent(sourceUrl)}`;
}

function launchBrokerServer() {
  return new Promise((resolve) => {
    findPort().then(port => {
      console.log(`Launching broker server... http://localhost:${port}`);
      const server = httpServer.createServer({
        root: path.resolve(__dirname, '..'),
        cache: -1,    // disable caching,
        cors: true,
      });
      server.listen(port, () => resolve({ server, port }));
    });
  });
}

function launchSourceServer(root) {
  return new Promise((resolve) => {
    findPort().then(port => {
      console.log(`Launching source server... http://localhost:${port}`);
      const server = httpServer.createServer({
        root,
        cache: -1,    // disable caching,
        cors: true,
      });
      server.listen(port, () => resolve({ server, port }));
    });
  });
}
