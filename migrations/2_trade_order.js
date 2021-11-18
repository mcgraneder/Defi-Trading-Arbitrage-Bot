const TradeOrder = artifacts.require("TradeOrder");

module.exports = function (deployer, network, accounts,) {

  const owner = accounts[0];
  deployer.deploy(TradeOrder, owner);
};
