// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract JobTrustPassport {
    address public owner;

    struct JobRecord {
        uint256 jobId;
        uint256 workerId;
        bytes32 recordHash;
        uint256 timestamp;
    }

    mapping(uint256 => JobRecord) private records;

    event JobHashRecorded(
        uint256 indexed jobId,
        uint256 indexed workerId,
        bytes32 indexed recordHash,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storeJobHash(
        uint256 jobId,
        uint256 workerId,
        bytes32 recordHash,
        uint256 timestamp
    ) external onlyOwner {
        require(jobId != 0, "Job ID required");
        require(workerId != 0, "Worker ID required");
        require(recordHash != bytes32(0), "Record hash required");
        require(timestamp != 0, "Timestamp required");
        require(records[jobId].timestamp == 0, "Job already recorded");

        records[jobId] = JobRecord(jobId, workerId, recordHash, timestamp);
        emit JobHashRecorded(jobId, workerId, recordHash, timestamp);
    }

    function getJobHash(uint256 jobId)
        external
        view
        returns (uint256, uint256, bytes32, uint256)
    {
        JobRecord memory entry = records[jobId];
        require(entry.timestamp != 0, "Job record not found");
        return (entry.jobId, entry.workerId, entry.recordHash, entry.timestamp);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner address");
        owner = newOwner;
    }
}
