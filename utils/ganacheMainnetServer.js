//i ended up not useing this file as it was earier to 
//just fork mainnet using ganache-cli and unlocking a hwale acocount
//which also had WETH and DAI hoerver i am keeping this because
//initialising a server like this can be useful in some other cases

require("dotenv").config();

const { ethers } = require("ethers");
const ganache = require("ganache-core");

const PORT = 8545;

// fork off mainnet with a specific account preloaded with 1000 ETH
const server = ganache.server({
  port: PORT,
  fork: process.env.MAINNET_NODE_URL,
  network_id: 1,
  accounts: [
    {
      secretKey: process.env.PRIV_KEY_TEST,
      balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
    },
    {
      secretKey: process.env.PRIV_KEY_DEPLOY,
      balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
    },
  ],
});

server.listen(PORT, (err, chain) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Forked off of node: ${process.env.MAINNET_NODE_URL}\n`);
    console.log(`Test private key:\n`);
    console.log(`\t${process.env.PRIV_KEY_TEST}`);
    console.log(`\nTest chain started on port ${PORT}, listening...`);
  }
});