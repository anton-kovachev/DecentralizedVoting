const { expect } = require("chai");
const { ethers } = require("hardhat");

const getTime = async () => {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  return block.timestamp;
};

describe("Voting", () => {

  let voting, owner, addr1, addr2;

  before(async () => {
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe("Members", async () => {
    it("is not a member", async () => {
      expect(await voting.isMember(owner), false);
    });

    it("can join", async () => {
      expect(await voting.join())
        .to.emit(voting, "Member_Joined")
        .withArgs(owner, (await ethers.provider.getBlock("latest")).timestamp);
    });

    it("can't join a second time", async () => {
      await expect(voting.join())
        .to.revertedWithCustomError(voting, "Voting_AlreadyAMember_Error")
        .withArgs(owner, "You have already joined.");
    });

    it("is a member", async () => {
      expect(await voting.isMember(owner), true);
    });
  });

  describe("Vote", async () => {
    it("to be able for a member to create a vote", async () => {
      expect(
        await voting.createVote(
          "https://example-gateway.mypinata.cloud/nft-1",
          (await getTime()) + 60,
          4
        )
      )
        .to.emit(voting, "Vote_Created")
        .withArgs(
          owner,
          0,
          4,
          ethers.provider.getBlock("latest").timestamp,
          (await getTime()) + 60
        );
    });

    it("can create a vote as a member", async () => {
      expect(
        await voting.createVote(
          "https://example-gateway.mypinata.cloud/nft-1",
          (await getTime()) + 60,
          4
        )
      )
        .to.emit(voting, "Vote_Created")
        .withArgs(
          owner,
          0,
          4,
          ethers.provider.getBlock("latest").timestamp,
          (await getTime()) + 60,
        );
    });

    it("cannot create a vote if not a member", async () => {
      await expect(
        voting
          .connect(addr1)
          .createVote(
            "https://example-gateway.mypinata.cloud/nft-2",
            (await getTime()) + 60,
            4
          )
      )
        .to.be.revertedWithCustomError(voting, "Voting_NotAMember_Error")
        .withArgs(addr1, "You are not a member.");
    });

    it("cannot create a vote with more than 8 options", async () => {
      await expect(
        voting.createVote(
          "https://example-gateway.mypinata.cloud/nft-2",
          (await getTime()) + 60,
          9
        )
      )
        .to.be.revertedWithCustomError(voting, "Voting_OptionsRange_Error")
        .withArgs(
          owner,
          2,
          8,
          "Options should be between min and max range inclusive."
        );
    });

    it("cannot create a vote with less than 2 options", async () => {
      await expect(
        voting.createVote(
          "https://example-gateway.mypinata.cloud/nft-2",
          (await getTime()) + 60,
          1
        )
      )
        .to.be.revertedWithCustomError(voting, "Voting_OptionsRange_Error")
        .withArgs(
          owner,
          2,
          8,
          "Options should be between min and max range inclusive."
        );
    });

    it("cannot create a vote with less than 2 options", async () => {
      await expect(
        voting.createVote(
          "https://example-gateway.mypinata.cloud/nft-2",
          (await getTime()) + 60,
          1
        )
      )
        .to.be.revertedWithCustomError(voting, "Voting_OptionsRange_Error")
        .withArgs(
          owner,
          2,
          8,
          "Options should be between min and max range inclusive."
        );
    });

    it("cannot vote if not a member", async () => {
      await expect(voting.connect(addr1).vote(0, 2))
        .to.be.revertedWithCustomError(voting, "Voting_NotAMember_Error")
        .withArgs(addr1, "You are not a member.");
    });

    it("cannot vote if he is the owner of the vote", async () => {
      await expect(voting.vote(0, 2))
        .to.be.revertedWithCustomError(voting, "Voting_VoteCreatorsVote_Error")
        .withArgs(
          owner,
          "Since you are the owner of this vote, you can't vote for it."
        );
    });

    it("cannot vote with invalid vote option", async () => {
      expect(await voting.connect(addr1).join())
        .to.emit(voting, "Member_Joined")
        .withArgs(owner, (await ethers.provider.getBlock("latest")).timestamp);
      expect(voting.connect(addr1).vote(0, 6))
        .to.be.revertedWithCustomError(voting, "Voting_VoteOptionInvalid_Error")
        .withArgs(addr1, 0, 6, "The option selected is invalid for this vote.");
    });

    it("cannot vote for invalid voteId", async () => {
      expect(voting.connect(addr1).vote(2, 6))
        .to.be.revertedWithCustomError(voting, "Voting_InvalidVote_Error")
        .withArgs(addr1, 2, "Your vote is invalid.");
    });

    it("did not already vote", async () => {
      expect(await voting.didVote(addr1, 0)).to.be.equal(false);
    });

    it("can vote", async () => {
      expect(await voting.connect(addr1).vote(0, 2))
        .to.emit(voting, "Voted")
        .withArgs(addr1, 0, 2);
    });

    if (
      ("cannot vote if already voted",
      async () => {
        await expect(voting.connect(addr1).vote(0, 3))
          .to.be.revertedWithCustomError(voting, "Voting_AlreadyVoted_Error")
          .withArgs(addr1, 0, 3, "You have already voted for this vote.");
      })
    )
      it("did already vote", async () => {
        expect(await voting.didVote(addr1, 0)).to.be.equal(true);
      });

    it("cannot vote on expired vote", async () => {
      expect(await voting.connect(addr2).join()).to.emit(
        voting,
        "Member_Joined"
      );
      ethers.provider.send("evm_mine", [(await getTime()) + 3600]);
      await expect(voting.connect(addr2).vote(0, 2))
        .to.be.revertedWithCustomError(voting, "Voting_Ended_Error")
        .withArgs(addr2, 0, "The voting window has been closed.");
    });

    it("get vote statistics", async () => {
      const voteData = await voting.getVote(0);
      const currentTime = (
        await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
      ).timestamp;
      expect(voteData[0]).to.be.equal(
        "https://example-gateway.mypinata.cloud/nft-1"
      );
      expect(voteData[1]).to.be.equal(owner);
      expect(voteData[2]).to.be.equal(4);
      expect(voteData[5]).to.deep.equal([0n, 1n, 0n, 0n]);
    });

    it("get vote option votes", async () => {
      const voteOptionVotes = await voting.getVoteOptionVotes(0, 2);
      console.log("Vote option votes ", voteOptionVotes);
      expect(await voting.getVoteOptionVotes(0, 2)).to.be.equal(1);
    });
  });
});
