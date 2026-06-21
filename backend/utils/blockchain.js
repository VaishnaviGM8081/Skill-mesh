const { ethers } = require('ethers');
require('dotenv').config();

const RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.TRUST_PASSPORT_CONTRACT_ADDRESS;

if (!RPC_URL) throw new Error('POLYGON_AMOY_RPC_URL is required');
if (!PRIVATE_KEY) throw new Error('BLOCKCHAIN_PRIVATE_KEY is required');
if (!CONTRACT_ADDRESS) throw new Error('TRUST_PASSPORT_CONTRACT_ADDRESS is required');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "jobId", "type": "uint256" },
      { "internalType": "uint256", "name": "workerId", "type": "uint256" },
      { "internalType": "bytes32", "name": "recordHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "storeJobHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "jobId", "type": "uint256" }
    ],
    "name": "getJobHash",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "bytes32", "name": "", "type": "bytes32" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

function generateJobRecordHash({
  jobId,
  workerId,
  customerId,
  customerRating,
  completionTimestamp,
  disputeStatus,
  trustScoreContribution
}) {
  const normalized = `${jobId}|${workerId}|${customerId}|${customerRating}|${completionTimestamp}|${disputeStatus ? '1' : '0'}|${trustScoreContribution}`;
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

async function storeJobHashOnChain({ jobId, workerId, recordHash, timestamp }) {
  const tx = await contract.storeJobHash(jobId, workerId, recordHash, timestamp);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

async function getJobHashOnChain(jobId) {
  const [onChainJobId, onChainWorkerId, onChainHash, onChainTimestamp] = await contract.getJobHash(jobId);
  return {
    jobId: Number(onChainJobId.toString()),
    workerId: Number(onChainWorkerId.toString()),
    recordHash: onChainHash,
    timestamp: Number(onChainTimestamp.toString()),
  };
}

module.exports = {
  generateJobRecordHash,
  storeJobHashOnChain,
  getJobHashOnChain,
};
