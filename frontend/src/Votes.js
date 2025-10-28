import { Button, Form, Card, ProgressBar } from "react-bootstrap";
import { useState, useEffect } from "react";
import { errorDecoder } from "./contract";

const Votes = ({ contract }) => {
  const [votes, setVotes] = useState([]);
  const gateWay = "https://lime-written-prawn-451.mypinata.cloud/";

  useEffect(() => {
    if (!contract) {
      return;
    }

    fetchVotes();
  }, [contract]);

  const submitVote = async (voteId, optionIdx) => {
    try {
      await contract.vote(voteId, optionIdx + 1);
      alert("Voted!");
      await fetchVotes();
    } catch (err) {
      const decodedError = await errorDecoder.decode(err);
      console.log(decodedError);
    }
  };

  const fetchVotes = async () => {
    const filter = contract.filters.Vote_Created();
    contract.queryFilter(filter).then((results) => {
      setVotesData(results);
    });

    const setVotesData = async (votesData) => {
      const promises = [];
      const newVotes = [];

      for (const voteData of votesData) {
        const [voteOwner, voteId, voteCreatedAt, voteEndsAt] = voteData.args;
        const promise = contract.getVote(voteId).then(async (vote) => {
          const [uri, owner, options, createdAt, endTime, votes] = vote;
          if (!uri) {
            return;
          }

          let newVote = {
            id: Number(voteId),
            uri,
            owner,
            createdAt: createdAt,
            endTime: endTime,
            totalVotes: votes
              .map((value) => Number(value))
              .reduce((sum, value) => sum + value, 0),
            votes: votes.map((value) => Number(value)),
          };

          try {
            await fetch(gateWay + uri)
              .then((result) => result.json())
              .then((data) => {
                newVote = {
                  ...newVote,
                  description: data.description,
                  options: data.options,
                };
              });
          } catch (err) {
            return;
          }

          newVote.didVote = await contract.didVote(
            contract.runner.address,
            newVote.id
          );

          return newVote;
        });

        promises.push(promise);
      }

      Promise.all(promises).then((newVotes) => {
        setVotes(newVotes.filter((vote) => vote?.uri));
      });
    };
  };

  return (
    <div>
      <p>Votes Page</p>
      {votes.map((vote) => (
        <Card key={vote.id} className="my-2">
          <Card.Header>{vote.description}</Card.Header>
          <Card.Body>
            {vote.options.map((option, idx) => (
              <div className="mt-1" key={Math.random() + idx}>
                <p>
                  {option}:{" "}
                  {(vote.votes[idx] / Math.max(1, vote.totalVotes)) * 100}%
                </p>
                <ProgressBar
                  now={(vote.votes[idx] / Math.max(1, vote.totalVotes)) * 100}
                  label={`${vote.votes[idx]}`}
                  className="w-100 me-2"
                />
                {!vote.didVote && (
                  <Button
                    className="m-2"
                    size="sm"
                    onClick={(e) => submitVote(vote.id, idx)}
                    variant="dark"
                  >
                    Vote
                  </Button>
                )}
              </div>
            ))}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default Votes;
