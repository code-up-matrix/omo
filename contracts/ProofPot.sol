// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Testnet community contributions, paid directly to an immutable recipient.
/// @dev A receipt proves a transfer and terms hash, not delivery or charity legitimacy.
contract ProofPot {
    struct Campaign { address creator; address payable recipient; bytes32 termsHash; uint64 deadline; }
    mapping(bytes32 => Campaign) public campaigns;
    mapping(bytes32 => bool) public receipts;
    bool private entered;
    event CampaignCreated(bytes32 indexed campaignId, address indexed creator, address recipient, bytes32 termsHash, uint64 deadline);
    event Contribution(bytes32 indexed campaignId, bytes32 indexed receiptId, address indexed contributor, address recipient, uint256 amount, bytes32 termsHash);
    modifier nonReentrant() { require(!entered, "reentrant"); entered=true; _; entered=false; }
    function createCampaign(bytes32 id, address payable recipient, bytes32 termsHash, uint64 deadline) external {
        require(id!=bytes32(0) && recipient!=address(0) && termsHash!=bytes32(0), "invalid campaign");
        require(campaigns[id].creator==address(0), "campaign exists");
        require(deadline>block.timestamp && deadline<=block.timestamp+365 days, "invalid deadline");
        campaigns[id]=Campaign(msg.sender,recipient,termsHash,deadline);
        emit CampaignCreated(id,msg.sender,recipient,termsHash,deadline);
    }
    function contribute(bytes32 id, bytes32 receiptId) external payable nonReentrant {
        Campaign memory c=campaigns[id];
        require(c.creator!=address(0) && block.timestamp<=c.deadline, "campaign unavailable");
        require(msg.value>0 && receiptId!=bytes32(0), "invalid contribution");
        require(!receipts[receiptId], "receipt exists");
        receipts[receiptId]=true;
        (bool sent,)=c.recipient.call{value:msg.value}("");
        require(sent, "transfer failed");
        emit Contribution(id,receiptId,msg.sender,c.recipient,msg.value,c.termsHash);
    }
}
