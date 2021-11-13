const Arbitrage = artifacts.require("Arbitrage");

module.exports = function (deployer) {
  deployer.deploy(Arbitrage);
};

//ganache-cli -f  wss://eth-mainnet.alchemyapi.io/v2/Mi_VWBlr_isqKYTXOWVXRbGNDDuLiyiQ -u 0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE -l 9999999999