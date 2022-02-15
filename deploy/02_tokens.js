module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const DAOAddress = process.env.WALLET_ADDRESS;
  // const provider = ethers.provider;
  // const deployerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // console.log(
  //   'Deploying contracts with the account:',
  //   deployerWallet.address,
  // );

  // console.log(
  //   'Account balance:',
  //   (await deployerWallet.getBalance()).toString(),
  // );
  // console.log('Deploying AuroraToken...');
  // const AuroraToken = await ethers.getContractFactory('AuroraToken');
  // const auroraToken = await AuroraToken
  //   .connect(deployerWallet)
  //   .deploy(
  //     'ZAK',
  //     'ZAK',
  //     DAOAddress, // DAO wallet
  //   );
  // await auroraToken.deployed();
  // console.log('AuroraToken deployed to:', auroraToken.address);

  // console.log('Deploying ZakToken...');
  // const ZakToken = await ethers.getContractFactory('ZakToken');
  // const zakToken = await ZakToken
  //   .connect(deployerWallet)
  //   .deploy(
  //     'ZAK',
  //     'ZAK',
  //     DAOAddress, // DAO wallet
  //   );
  // await zakToken.deployed();
  // console.log('ZakToken deployed to:', zakToken.address);

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
