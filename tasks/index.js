const { task } = require("hardhat/config")
const { delay } = require('nanodelay')
const { constants, BigNumber } = require('ethers')

const { ethers: { constants: { MaxUint256 }}, utils: { defaultAbiCoder }} = require("ethers")
const { MINICHEF_ADDRESS } = require("@sushiswap/core-sdk")

const fs = require("fs")

function getBigNumber(amount, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals))
}

function getSortedFiles(dependenciesGraph) {
    const tsort = require("tsort")
    const graph = tsort()

    const filesMap = {}
    const resolvedFiles = dependenciesGraph.getResolvedFiles()
    resolvedFiles.forEach((f) => (filesMap[f.sourceName] = f))

    for (const [from, deps] of dependenciesGraph.entries()) {
        for (const to of deps) {
            graph.add(to.sourceName, from.sourceName)
        }
    }

    const topologicalSortedNames = graph.sort()

    // If an entry has no dependency it won't be included in the graph, so we
    // add them and then dedup the array
    const withEntries = topologicalSortedNames.concat(resolvedFiles.map((f) => f.sourceName))

    const sortedNames = [...new Set(withEntries)]
    return sortedNames.map((n) => filesMap[n])
}

function getFileWithoutImports(resolvedFile) {
    const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm

    return resolvedFile.content.rawContent.replace(IMPORT_SOLIDITY_REGEX, "").trim()
}


task("chef_deposit", "test")
  .setAction(async taskArgs => {
    const AURORA_TOKEN = await ethers.getContract("AuroraToken")
    const ZAK_TOKEN = await ethers.getContract("ZakToken")

    console.log('AURORA_TOKEN', AURORA_TOKEN)

    const sushi = await ethers.getContract("SushiToken")
    const chef = await ethers.getContract("MasterChef")

    await chef.add(100, AURORA_TOKEN.address, true)
    await delay(1000)
    await chef.add(100, ZAK_TOKEN.address, true)
    await delay(1000)
    await AURORA_TOKEN.approve(chef.address, getBigNumber(10))
    await delay(1000)
    await chef.deposit(0, getBigNumber(10))
  });

task("create_pair", "test")
  .setAction(async taskArgs => {
    const sushiMaker = await ethers.getContract("SushiMaker")

    const AURORA_TOKEN = await ethers.getContract("AuroraToken")
    const ZAK_TOKEN = await ethers.getContractAt("ZakToken")

    const factoryAddress = await sushiMaker.factory()

    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress)
    const result = await factory.createPair(AURORA_TOKEN.address, ZAK_TOKEN.address)

    console.log('result', result)
  })

task("get_pair", "test")
  .setAction(async taskArgs => {
    const sushiMaker = await ethers.getContract("SushiMaker")
    const AURORA_TOKEN = await ethers.getContractAt("AuroraToken", "0xf06c68af82a938f9a737484f4073bf89a5edb271")
    const ZAK_TOKEN = await ethers.getContractAt("AuroraToken", "0x1eFC73F83146f386B1395A79D07b92bfb8f865C9")

    const factoryAddress = await sushiMaker.factory()

    console.log('sushiMaker.UniswapV2Pair', sushiMaker.UniswapV2Pair)

    // console.log('factoryAddress', factoryAddress)

    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress)
    const result = await factory.getPair(AURORA_TOKEN.address, ZAK_TOKEN.address)

    console.log('result', result)
  })

task("attach_pair", "test")
  .setAction(async taskArgs => {
    const AURORA_TOKEN = await ethers.getContractAt("AuroraToken", "0xf06c68af82a938f9a737484f4073bf89a5edb271")
    const ZAK_TOKEN = await ethers.getContractAt("AuroraToken", "0x1eFC73F83146f386B1395A79D07b92bfb8f865C9")

    const sushiMaker = await ethers.getContract("SushiMaker")
    const factoryAddress = await sushiMaker.factory()
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress)
    const pairAddress = await factory.getPair(AURORA_TOKEN.address, ZAK_TOKEN.address)

    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress)

    // await pair.attach("0x4bD2E8Ed5608be0A938087a393Bc9c0D43073540")

    await AURORA_TOKEN.transfer(pair.address, getBigNumber(10))
    await delay(1000)
    await ZAK_TOKEN.transfer(pair.address, getBigNumber(10))
    await delay(1000)

    await pair.mint("0x23a824dd17d6571e1badd25a6247c685d6802985")
  })

task("convert", "test")
  .setAction(async taskArgs => {
    const AURORA_TOKEN = await ethers.getContractAt("AuroraToken", "0xf06c68af82a938f9a737484f4073bf89a5edb271")
    const ZAK_TOKEN = await ethers.getContractAt("AuroraToken", "0x1eFC73F83146f386B1395A79D07b92bfb8f865C9")

    const sushiMaker = await ethers.getContract("SushiMaker")
    const factoryAddress = await sushiMaker.factory()
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress)
    const pairAddress = await factory.getPair(AURORA_TOKEN.address, ZAK_TOKEN.address)

    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress)

    // await pair.attach("0x4bD2E8Ed5608be0A938087a393Bc9c0D43073540")

    // await sushiMaker.setBridge(AURORA_TOKEN.address, ZAK_TOKEN.address)
    await delay(1000)
    await pair.transfer(sushiMaker.address, getBigNumber(1))
    await delay(1000)
    await sushiMaker.convert(AURORA_TOKEN.address, ZAK_TOKEN.address)
  })


subtask("flat:get-flattened-sources", "Returns all contracts and their dependencies flattened")
    .addOptionalParam("files", undefined, undefined, types.any)
    .addOptionalParam("output", undefined, undefined, types.string)
    .setAction(async ({ files, output }, { run }) => {
        const dependencyGraph = await run("flat:get-dependency-graph", { files })
        console.log(dependencyGraph)

        let flattened = ""

        if (dependencyGraph.getResolvedFiles().length === 0) {
            return flattened
        }

        const sortedFiles = getSortedFiles(dependencyGraph)

        let isFirst = true
        for (const file of sortedFiles) {
            if (!isFirst) {
                flattened += "\n"
            }
            flattened += `// File ${file.getVersionedName()}\n`
            flattened += `${getFileWithoutImports(file)}\n`

            isFirst = false
        }

        // Remove every line started with "// SPDX-License-Identifier:"
        flattened = flattened.replace(/SPDX-License-Identifier:/gm, "License-Identifier:")

        flattened = `// SPDX-License-Identifier: MIXED\n\n${flattened}`

        // Remove every line started with "pragma experimental ABIEncoderV2;" except the first one
        flattened = flattened.replace(/pragma experimental ABIEncoderV2;\n/gm, ((i) => (m) => (!i++ ? m : ""))(0))

        flattened = flattened.trim()
        if (output) {
            console.log("Writing to", output)
            fs.writeFileSync(output, flattened)
            return ""
        }
        return flattened
    })

subtask("flat:get-dependency-graph")
    .addOptionalParam("files", undefined, undefined, types.any)
    .setAction(async ({ files }, { run }) => {
        const sourcePaths = files === undefined ? await run("compile:solidity:get-source-paths") : files.map((f) => fs.realpathSync(f))

        const sourceNames = await run("compile:solidity:get-source-names", {
            sourcePaths,
        })

        const dependencyGraph = await run("compile:solidity:get-dependency-graph", { sourceNames })

        return dependencyGraph
    })

task("flat", "Flattens and prints contracts and their dependencies")
    .addOptionalVariadicPositionalParam("files", "The files to flatten", undefined, types.inputFile)
    .addOptionalParam("output", "Specify the output file", undefined, types.string)
    .setAction(async ({ files, output }, { run }) => {
        console.log(
            await run("flat:get-flattened-sources", {
                files,
                output,
            })
        )
    })

task("accounts", "Prints the list of accounts", require("./accounts"))
task("gas-price", "Prints gas price").setAction(async function({ address }, { ethers }) {
  console.log("Gas price", (await ethers.provider.getGasPrice()).toString())
})

task("bytecode", "Prints bytecode").setAction(async function({ address }, { ethers }) {
  console.log("Bytecode", await ethers.provider.getCode(address))
})

task("feeder:feed", "Feed")
.setAction(async function({ feedDev }, { getNamedAccounts, ethers: { BigNumber }, getChainId }) {
  const { deployer, dev } = await getNamedAccounts()

  const feeder = new ethers.Wallet(process.env.FEEDER_PRIVATE_KEY, ethers.provider)

  await (await feeder.sendTransaction({
    to: deployer,
    value: BigNumber.from(1).mul(BigNumber.from(10).pow(18))
  })).wait();
})

task("feeder:return", "Return funds to feeder").setAction(async function({ address }, { ethers: { getNamedSigners } }) {
  const { deployer, dev } = await getNamedSigners()

  await (await deployer.sendTransaction({
    to: process.env.FEEDER_PUBLIC_KEY,
    value: await deployer.getBalance()
  })).wait();

  await (await dev.sendTransaction({
    to: process.env.FEEDER_PUBLIC_KEY,
    value: await dev.getBalance()
  })).wait();
})

task("erc20:approve", "ERC20 approve")
.addParam("token", "Token")
.addParam("spender", "Spender")
.addOptionalParam("deadline", MaxUint256)
.setAction(async function ({ token, spender, deadline }, { ethers: { getNamedSigner } }, runSuper) {
  const erc20 = await ethers.getContractFactory("UniswapV2ERC20")

  const slp = erc20.attach(token)

  await (await slp.connect(await getNamedSigner("dev")).approve(spender, deadline)).wait()
});

task("factory:set-fee-to", "Factory set fee to")
.addParam("feeTo", "Fee To")
.setAction(async function ({ feeTo }, { ethers: { getNamedSigner } }, runSuper) {
  const factory = await ethers.getContract("UniswapV2Factory")
  console.log(`Setting factory feeTo to ${feeTo} address`)
  await (await factory.connect(await getNamedSigner('dev')).setFeeTo(feeTo)).wait()
});

// TODO: Swap?

// TODO: Test
task("router:add-liquidity", "Router add liquidity")
.addParam("tokenA", "Token A")
.addParam("tokenB", "Token B")
.addParam("tokenADesired", "Token A Desired")
.addParam("tokenBDesired", "Token B Desired")
.addParam("tokenAMinimum", "Token A Minimum")
.addParam("tokenBMinimum", "Token B Minimum")
.addParam("to", "To")
.addOptionalParam("deadline", MaxUint256)
.setAction(async function ({ tokenA, tokenB, tokenADesired, tokenBDesired, tokenAMinimum, tokenBMinimum, to, deadline }, { ethers: { getNamedSigner } }, runSuper) {
  const router = await ethers.getContract("UniswapV2Router")
  await run("erc20:approve", { token: tokenA, spender: router.address })
  await run("erc20:approve", { token: tokenB, spender: router.address })
  await (await router.connect(await getNamedSigner("dev")).addLiquidity(tokenA, tokenB, tokenADesired, tokenBDesired, tokenAMinimum, tokenBMinimum, to, deadline)).wait()
});

// TODO: Test
task("router:add-liquidity-eth", "Router add liquidity eth")
.addParam("token", "Token")
.addParam("tokenDesired", "Token Desired")
.addParam("tokenMinimum", "Token Minimum")
.addParam("ethMinimum", "ETH Minimum")
.addParam("to", "To")
.addOptionalParam("deadline", MaxUint256)
.setAction(async function ({ token, tokenDesired, tokenMinimum, ethMinimum, to, deadline }, { ethers: { getNamedSigner } }, runSuper) {
  const router = await ethers.getContract("UniswapV2Router")
  await run("erc20:approve", { token, spender: router.address })
  await (await router.connect(await getNamedSigner("dev")).addLiquidityETH(token, tokenDesired, tokenMinimum, ethMinimum, to, deadline)).wait()
});

task("migrate", "Migrates liquidity from Uniswap to SushiSwap")
  .addOptionalParam("a", "Token A", "0xaD6D458402F60fD3Bd25163575031ACDce07538D")
  .addOptionalParam("b", "Token B", "0xc778417E063141139Fce010982780140Aa0cD5Ab")
  .setAction(require("./migrate"))

task("masterchef:add", "Add pool to masterchef")
.setAction(async function (taskArguments, { ethers: { getNamedSigner } }, runSuper) {
  const masterChef = await ethers.getContract("MasterChef")

  await (await masterChef.connect(await getNamedSigner("dev")).add(1000, '0x3e78a806b127c02b54419191571d9379819e989c', true)).wait()
});

task("masterchef:deposit", "MasterChef deposit")
.addParam("pid", "Pool ID")
.addParam("amount", "Amount")
.setAction(async function ({ pid, amount }, { ethers: { getNamedSigner } }, runSuper) {
  const masterChef = await ethers.getContract("MasterChef")

  const { lpToken } = await masterChef.poolInfo(pid)

  await run("erc20:approve", { token: lpToken, spender: masterChef.address })

  await (await masterChef.connect(await getNamedSigner("dev")).deposit(pid, amount)).wait()
});

task("masterchef:withdraw", "MasterChef withdraw")
.addParam("pid", "Pool ID")
.addParam("amount", "Amount")
.setAction(async function ({ pid, amount }, { ethers: { getNamedSigner } }, runSuper) {
  const masterChef = await ethers.getContract("MasterChef")

  const { lpToken } = await masterChef.poolInfo(pid)

  await run("erc20:approve", { token: lpToken, spender: masterChef.address })

  await (await masterChef.connect(await getNamedSigner("dev")).withdraw(pid, amount)).wait()
});

task("bar:enter", "SushiBar enter")
.addParam("amount", "Amount")
.setAction(async function ({ amount }, { ethers: { getNamedSigner } }, runSuper) {
  const sushi = await ethers.getContract("SushiToken")

  const bar = await ethers.getContract("SushiBar")

  await run("erc20:approve", { token: sushi.address, spender: bar.address })

  await (await bar.connect(await getNamedSigner("dev")).enter(amount)).wait()
});

task("bar:leave", "SushiBar leave")
.addParam("amount", "Amount")
.setAction(async function ({ amount }, { ethers: { getNamedSigner } }, runSuper) {
  const sushi = await ethers.getContract("SushiToken")

  const bar = await ethers.getContract("SushiBar")

  await run("erc20:approve", { token: sushi.address, spender: bar.address })

  await (await bar.connect(await getNamedSigner("dev")).leave(amount)).wait()
});

task("maker:serve", "SushiBar serve")
.addParam("a", "Token A")
.addParam("b", "Token B")
.setAction(async function ({ a, b }, { ethers: { getNamedSigner } }, runSuper) {
  const maker = await ethers.getContract("SushiMaker")

  await (await maker.connect(await getNamedSigner("dev")).convert(a, b, { gasLimit: 5198000 })).wait()
});


task("deploy:complex-rewarder", "Deploy ComplexRewarder")
.addParam("rewardToken", "Reward Token")
.setAction(async function ({ rewardToken }, { ethers: { getNamedSigner }, getChainId, deployments }, runSuper) {
  const { deployer, dev } = await getNamedAccounts();
  const { deploy } = deployments;

  const chainId = await getChainId();

  let miniChefAddress;

  if (chainId === "31337") {
    miniChefAddress = (await deployments.get("MiniChefV2")).address;
  } else if (chainId in MINICHEF_ADDRESS) {
    miniChefAddress = MINICHEF_ADDRESS[chainId];
  } else {
    throw Error("No MINICHEF!");
  }

  const { address } = await deploy("ComplexRewarderTime", {
    from: deployer,
    args: [rewardToken, 0, miniChefAddress],
    log: true,
    deterministicDeployment: false,
  });

  console.log(`ComplexRewarderTime deployed at ${address}`)

  const complexRewarder = await ethers.getContract("ComplexRewarderTime");

  if ((await complexRewarder.owner()) !== dev) {
    console.log("Transfer ownership of ComplexRewarderTime to dev");
    await (await complexRewarder.transferOwnership(dev, true, false)).wait();
  }
});

// task("deploy:clone-rewarder", "Deploy CloneRewarder")
// .addParam("rewardToken", "Reward Token")
// .addParam("lpToken", "LP Token")
// .addOptionalParam("rewardRate", "Reward Rate", 0)
// .setAction(async function ({ rewardToken, lpToken, rewardRate }, { getChainId, deployments }, runSuper) {
//   const { deployer, dev } = await getNamedAccounts();
//   const { deploy } = deployments;

//   const chainId = await getChainId();

//   let miniChefAddress;

//   if (chainId === "31337") {
//     miniChefAddress = (await deployments.get("MiniChefV2")).address;
//   } else if (chainId in MINICHEF_ADDRESS) {
//     miniChefAddress = MINICHEF_ADDRESS[chainId];
//   } else {
//     throw Error("No MINICHEF!");
//   }

//   const { address } = await deploy("CloneRewarderTime", {
//     from: deployer,
//     args: [miniChefAddress],
//     log: true,
//     deterministicDeployment: false,
//   });

//   console.log(`CloneRewarder deployed at ${address}`)

//   const cloneRewarder = await ethers.getContract("CloneRewarderTime");

//   const data = defaultAbiCoder.encode(['address', 'address', 'uint256', 'address'], [rewardToken, dev, rewardRate, lpToken])

//   await (await cloneRewarder.init(data)).wait()

//   if ((await complexRewarder.owner()) !== dev) {
//     console.log("Transfer ownership of CloneRewarderTime to dev");
//     await (await cloneRewarder.transferOwnership(dev, true, false)).wait();
//   }
// });
