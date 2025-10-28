contract Voting {
    error Voting_AlreadyAMember_Error(address caller, string message);
    error Voting_NotAMember_Error(address caller, string message);
    error Voting_OptionsRange_Error(
        address voter,
        uint minOptions,
        uint maxOptions,
        string message
    );
    error Voting_VoteOptionInvalid_Error(address voter, uint256 voteId, uint8 option, string message);
    error Voting_VoteCreatorsVote_Error(address voter, string message);
    error Voting_InvalidVote_Error(
        address voter,
        uint256 voteId,
        string message
    );
    error Voting_AlreadyVoted_Error(
        address voter,
        uint256 voteId,
        string message
    );
    error Voting_Ended_Error(address voter, uint256 voteId, string message);

    event Vote_Created(
        address indexed owner,
        uint256 voteId,
        uint8 options,
        uint256 time,
        uint256 endtime
    );
    event Voted(address indexed voter, uint256 voteId, uint8 voteOption);
    event Member_Joined(address indexed newMember, uint256 timestamp);

    uint256 nextVoteId;
    address owner;

    struct Vote {
        string url;
        address owner;
        uint256 createdAt;
        uint256 endTime;
        uint256[] votes;
        uint8 options;
        mapping(address => bool) voted;
    }

    mapping(uint256 => Vote) votes;
    mapping(address => bool) members;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyMembers() {
        if (members[msg.sender] == false) {
            revert Voting_NotAMember_Error(msg.sender, "You are not a member.");
        }
        _;
    }

    modifier canVote(uint256 voteId) {
        if (members[msg.sender] == false) {
            revert Voting_NotAMember_Error(msg.sender, "You are not a member.");
        }

        if (votes[voteId].owner == msg.sender) {
            revert Voting_VoteCreatorsVote_Error(
                msg.sender,
                "Since you are the owner of this vote, you can't vote for it."
            );
        }

        if (votes[voteId].voted[msg.sender] == true) {
            revert Voting_AlreadyVoted_Error(
                msg.sender,
                voteId,
                "You have already voted for this vote."
            );
        }

        if (block.timestamp > votes[voteId].endTime) {
            revert Voting_Ended_Error(
                msg.sender,
                voteId,
                "The voting window has been closed."
            );
        }

        _;
    }

    modifier validOptions(uint8 options) {
        if (options < 2 || options > 8) {
            revert Voting_OptionsRange_Error(
                msg.sender,
                2,
                8,
                "Options should be between min and max range inclusive."
            );
        }
        _;
    }

    modifier validVoteOptions(uint256 voteId, uint8 option) {
        if(option > votes[voteId].options) {
            revert Voting_VoteOptionInvalid_Error(msg.sender, voteId, option, "The option selected is invalid for this vote.");
        }
        _;
    }

    modifier validVote(uint256 voteId) {
        if (voteId < 0 || voteId >= nextVoteId) {
            revert Voting_InvalidVote_Error(
                msg.sender,
                voteId,
                "Your vote is invalid."
            );
        }
        _;
    }

    function isMember(address addr) public view returns (bool member) {
        return members[addr];
    }

    function join() external {
        if (members[msg.sender]) {
            revert Voting_AlreadyAMember_Error(
                msg.sender,
                "You have already joined."
            );
        }

        members[msg.sender] = true;
        emit Member_Joined(msg.sender, block.timestamp);
    }

    function createVote(
        string memory url,
        uint256 endTime,
        uint8 options
    ) external onlyMembers validOptions(options) returns (uint256 voteId) {
        votes[nextVoteId].url = url;
        votes[nextVoteId].owner = msg.sender;
        votes[nextVoteId].createdAt = block.timestamp;
        votes[nextVoteId].endTime = endTime;
        votes[nextVoteId].votes = new uint256[](options);
        votes[nextVoteId].options = options;

        uint256 currentVoteId = nextVoteId;
        nextVoteId += 1;
        emit Vote_Created(msg.sender, currentVoteId, options, block.timestamp, endTime);
        return currentVoteId;
    }

    function vote(
        uint256 voteId,
        uint8 option
    ) external canVote(voteId) validVote(voteId) validVoteOptions(voteId, option) {
        votes[voteId].votes[option - 1] += 1;
        votes[voteId].voted[msg.sender] = true;

        emit Voted(msg.sender, voteId, option);
    }

    function getVote(
        uint256 voteId
    )
        external
        view
        returns (
            string memory url,
            address owner,
            uint8 options,
            uint256 createdAt,
            uint256 endTime,
            uint256[] memory optionsVotes
        )
    {
        return (
            votes[voteId].url,
            votes[voteId].owner,
            votes[voteId].options,
            votes[voteId].createdAt,
            votes[voteId].endTime,
            votes[voteId].votes
        );
    }

    function getVoteOptionVotes(uint256 voteId, uint8 option) external view validVote(voteId) validVoteOptions(voteId, option) returns(uint256 optionVotes) {
        return votes[voteId].votes[option - 1];
    }

    function didVote(
        address member,
        uint256 voteId
    ) external view returns (bool) {
        return votes[voteId].voted[member];
    }
}
