const { delay } = require('nanodelay')

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const DAOAddress = process.env.WALLET_ADDRESS;

  await deploy("AuroraToken", {
    from: deployer,
    args: [
      'Aurora',
      'AURORAA',
      DAOAddress,
    ],
    log: true,
    deterministicDeployment: false
  })

  await delay(2000)

  await deploy("ZakToken", {
    from: deployer,
    args: [
      'ZAKK',
      'ZAKK',
      DAOAddress,
    ],
    log: true,
    deterministicDeployment: false
  })
};
