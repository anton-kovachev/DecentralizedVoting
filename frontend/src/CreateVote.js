import { Button, Form } from "react-bootstrap";
import { useState } from "react";

const CreateVote = ({ contract }) => {
  const [uri, setUri] = useState("");
  const [options, setOptions] = useState(2);
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e) => {
    if (!contract) {
      alert("Please connect to Metamask.");
      return;
    }
    try {
      await contract.createVote(uri, Date.parse(endDate), options);
    } catch (err) {
      alert(err.message);
      console.log(err);
    }
  };

  return (
    <div>
      <p>Create Vote Page</p>
      <Form className="m-2">
        <h2 className="d-flex justify-content-center"></h2>
        <Form.Group className="m-2">
          <label htmlFor="uri">IPFS Uri</label>
          <Form.Control
            placeholder="IPFS Uri"
            type="text"
            name="uri"
            id="uri"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="m-2">
          <label htmlFor="options">Options</label>
          <Form.Control
            placeholder="Number of options"
            type="number"
            min={2}
            max={8}
            name="options"
            id="options"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="m-2">
          <label htmlFor="endDate">End Date</label>
          <Form.Control
            placeholder="End Date"
            type="date"
            name="endDate"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mt-4">
          <Button
            variant="success"
            className="mt-2 m-2"
            type="button"
            onClick={handleSubmit}
          >
            Create
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
};

export default CreateVote;
