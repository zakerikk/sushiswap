const { delay } = require('nanodelay')

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await delay(2000)

  await deploy("WETH9Mock", {
    from: deployer,
    log: true,
  })
}

module.exports.skip = ({ getChainId }) =>
  new Promise(async (resolve, reject) => {
    try {
      const chainId = await getChainId()
      resolve(chainId !== "31337")
    } catch (error) {
      reject(error)
    }
  })

module.exports.tags = ["test"]
