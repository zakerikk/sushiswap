const { delay } = require('nanodelay')

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await delay(2000)

  await deploy("SushiToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["SushiToken"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
