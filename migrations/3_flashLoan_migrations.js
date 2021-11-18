const FlashSwap = artifacts.require("FlashSwap");

module.exports = function (deployer, network, accounts,) {

  const owner = accounts[0];
  deployer.deploy(FlashSwap, owner);
};
