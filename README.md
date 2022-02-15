# SushiSwap

https://sushi.com/

## Deploy Contracts

In this directory, copy the environment variables file:
```
cp .env.example .env
```

Update `.env` with your own variables, `WALLET_ADDRESS` and `MNEMONIC`.

### Aurora test net

```
yarn
yarn aurora_testnet:deploy
```

### Aurora main net

```
yarn
yarn aurora:deploy
```

### Execute contracts

#### MasterChef deposit, [link](https://github.com/zakerikk/sushiswap/blob/aurora/tasks/index.js#L45)
To perform this method, the wallet must have a certain number of coins
```
yarn hardhat chef_deposit --network aurora_testnet
```


#### Create pair, [link](https://github.com/zakerikk/sushiswap/blob/aurora/tasks/index.js#L62)

```
yarn hardhat create_pair --network aurora_testnet
```

#### Get pair, [link](https://github.com/zakerikk/sushiswap/blob/aurora/tasks/index.js#L77)
```
yarn hardhat get_pair --network aurora_testnet
```
