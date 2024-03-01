const NETWORK = {
  11155111: {
    admin: "0xFE0ab16BAA265Cc1D220F624E650F70882318b30",
    contract: "0x21533A574EC5E3Bda5aCd773d02Ec92a5bd1a3eC",
    rpc: "https://rpc.sepolia.org",
    name: "sepolia",
    explorer: "https://sepolia.etherscan.io",
    USDT: "0x11155111",
  },
  56: {
    admin: "0xFE0ab16BAA265Cc1D220F624E650F70882318b30",
    contract: "0x21533A574EC5E3Bda5aCd773d02Ec92a5bd1a3eC",
    rpc: "https://rpc.ankr.com/bsc",
    name: "bsc",
    explorer: "https://bscscan.com",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
  },
  137: {
    admin: "0xFE0ab16BAA265Cc1D220F624E650F70882318b30",
    contract: "0x21533A574EC5E3Bda5aCd773d02Ec92a5bd1a3eC",
    rpc: "https://rpc.ankr.com/polygon",
    name: "matic",
    explorer: "https://polygonscan.com",
    USDT: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
};

const {
  isAddress,
  getAddress,
  providers,
  Contract,
  ethers,
} = require("ethers");

const ABI = require("./utils/contract.json");

let chainId = null;

let provider = null;

let contract = null;

async function setChain(_chainID) {
  chainId = parseInt(_chainID);

  provider = new ethers.JsonRpcProvider(NETWORK[chainId].rpc);

  contract = new Contract(NETWORK[chainId].contract, ABI, provider);
}

function toBool(str) {
  return str === "true";
}

function toHex(str) {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += "" + str.charCodeAt(i).toString(16);
  }
  return hex;
}

function hex2a(hexx) {
  var hex = hexx.toString();
  var str = "";
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function getNetwork(newChainId) {
  if (newChainId) {
    return NETWORK[newChainId];
  }
  return NETWORK[chainId];
}

async function checkAddress(_address) {
  var address = _address.trim();

  if (isAddress(address)) {
    return getAddress(address);
  } else {
    return null;
  }
}

async function encodeUSD(_boss, _cost, _initdays = 0) {
  return { link: `https://app.payhua.com/usd/${_boss}/${_cost}/${_initdays}` };
}

async function encodeSubscription(
  _networkId,
  _boss,
  _token,
  _cost,
  _initdays = 0
) {
  var input_boss = await checkAddress(_boss);
  var input_token = await checkAddress(_token);

  var obj = JSON.stringify({
    network: _networkId,
    boss: input_boss,
    token: input_token,
    cost: _cost,
    initdays: _initdays,
  });

  var hash = toHex(obj) || null;

  return { hash: hash, link: "https://app.payhua.com/check/" + hash };
}

async function decodeSubscription(_hash) {
  var data = await hex2a(_hash);
  return JSON.parse(data);
}

async function suggestAllowance(_amount) {
  var data = _amount * 365 * 10;
  return data.toString();
}

async function getUserTokenData(_token, _user) {
  var input_user = await checkAddress(_user);
  var input_token = await checkAddress(_token);

  if (input_user && input_token) {
    const datax = await contract.userBalance(input_user, input_token);
    const datap = await contract.userAllowance(input_user, input_token);

    return { balance: datax.toString(), allowance: datap.toString() };
  }
}

async function tokenDetails(_token) {
  var input_token = await checkAddress(_token);

  var decimal = await contract.getTokenDecimal(input_token);
  var name = await contract.getTokenName(input_token);
  var symbol = await contract.getTokenSymbol(input_token);

  return {
    decimal: decimal.toString(),
    symbol: symbol.toString(),
    name: name.toString(),
  };
}

async function canUserPay(_hash) {
  const data = await contract.canUserPay(_hash);
  return toBool(data.toString());
}

async function totalIds() {
  const data = await contract.storeLength();
  return data - 1;
}

async function hashing(_token, _user, _boss, _cost) {
  const datax = await contract.subscriptionHash(_token, _user, _boss, _cost);
  const datay = await contract.planHash(_token, _boss, _cost);

  return { sub: datax.toString(), plan: datay.toString() };
}

async function subscriptions(_hash) {
  const sub_object = await contract.subscriptions(_hash);
  const aliveDuration = await contract.lastPaid(_hash);
  const pendingInSec = await contract.unpaidSeconds(_hash);
  const pendingInDay = await contract.unpaidDays(_hash);
  const pendingInCost = await contract.unpaidCost(_hash);
  const active = await contract.subscriptionAlive(_hash);

  return {
    sub: sub_object.sub.toString(),
    plan: sub_object.plan.toString(),
    token: sub_object.token.toString(),
    user: sub_object.user.toString(),
    boss: sub_object.boss.toString(),
    cost: sub_object.cost.toString(),
    timestamp: aliveDuration.toString(),
    unpaidInSec: pendingInSec.toString(),
    unpaidInDay: pendingInDay.toString(),
    unpaidInCost: pendingInCost.toString(),
    active: active,
  };
}

async function getSubscriptionsByUser(_user) {
  var input_user = await checkAddress(_user);

  const max = await totalIds();
  const user = [];
  const boss = [];

  for (let index = 0; index < max; index++) {
    console.clear();
    console.log("Fetching index: " + index + " of " + max + "");

    const sub_hash = await contract.store(index);

    const subs = await subscriptions(sub_hash);

    if (subs.active) {
      if (subs.user == input_user) {
        user.push(subs.sub);
      }
      if (subs.boss == input_user) {
        boss.push(subs.sub);
      }
    }
  }

  return { user, boss };
}

function trimAddress(address) {
  return `${address.slice(0, 5)}...${address.slice(
    address.length - 5,
    address.length
  )}`;
}

async function randomSubscription() {
  const max = await totalIds();
  const random = Math.floor(Math.random() * max);

  const sub_hash = await contract.store(random);
  const data = await subscriptions(sub_hash);

  return data;
}

async function getTransfers(startBlock, endBlock) {
  const filter = contract.filters.Transfer();

  const batchSize = 1000;

  const numBatches = Math.ceil((endBlock - startBlock + 1) / batchSize);

  const foundEvents = [];

  for (let i = numBatches - 1; i >= 0; i--) {
    const startBatchBlock = startBlock + i * batchSize;
    const endBatchBlock = Math.min(endBlock, startBatchBlock + batchSize - 1);

    console.log(
      `Processing batch ${i + 1}: Blocks ${startBatchBlock} to ${endBatchBlock}`
    );

    const events = await contract.queryFilter(
      filter,
      startBatchBlock,
      endBatchBlock
    );

    events.forEach((event) => {
      if (event.event == "Transfer") {
        const objdata = {
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          sub: event.args.sub,
          token: event.args.token,
          user: event.args.user,
          boss: event.args.boss,
          amount: event.args.amount,
        };

        foundEvents.push(objdata);
      }
    });
  }

  return foundEvents;
}

module.exports = {
  setChain,
  checkAddress,
  encodeUSD,
  encodeSubscription,
  decodeSubscription,
  suggestAllowance,
  getUserTokenData,
  tokenDetails,
  canUserPay,
  totalIds,
  subscriptions,
  getSubscriptionsByUser,
  randomSubscription,
  hashing,
  getNetwork,
  trimAddress,
  getTransfers,
  ABI,
};
