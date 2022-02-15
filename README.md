# SushiSwap

https://sushi.com/

## Deploy Contracts

In this directory, copy the environment variables file:
```
cp .env.example .env
```

Update `.env` with your own variables

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

#### MasterChef deposit

```
yarn hardhat chef_deposit --network aurora_testnet
```

#### Create pair

```
yarn hardhat create_pair --network aurora_testnet
```

#### Get pair
```
yarn hardhat get_pair --network aurora_testnet
```
