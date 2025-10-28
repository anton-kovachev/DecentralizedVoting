import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateVote from "./CreateVote";
import Votes from "./Votes";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { connect, getContract } from "./contract";

function App() {
  const [connected, setConnected] = useState(false);
  const [contract, setContract] = useState(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    window.ethereum.request({ method: "eth_accounts" }).then(
      (accounts) => {
        if (accounts.length) {
          handleInit();
        } else {
          setConnected(false);
        }
      },
      (err) => {
        alert(err);
      }
    );

    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts?.length) {
      handleInit();
      } else {
        setConnected(false);
        setContract(null);
      }
    });
  }, []);

  const handleInit = async () => {
    setConnected(true);
    const { contract, signer } = await getContract();
    setContract(contract);

    if (contract) {
      signer.getAddress().then((address) => {
        contract.isMember(address).then((result) => {
          setIsMember(result);
        });
      });
    }
  };

  const connectCallback = async () => {
    const { contract, signer } = await connect();
    setContract(contract);
    setConnected(true);
    const isMember = await contract.isMember(signer.address);
    setIsMember(isMember);
  };

  const becomeMember = async () => {
    if (!contract) {
      alert("Pleaese connect to Metamask");
      return;
    }
    if (contract) {
      try {
        await contract.join();
        alert("Joined");
        setIsMember(true);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <Router>
      <Navbar
        isConnected={connected}
        connect={connectCallback}
        isMember={isMember}
        joinMembers={becomeMember}
      />
      <div className="container">
        <Routes>
          <Route
            path="create-vote"
            element={<CreateVote contract={contract} />}
          />
          <Route path="votes" element={<Votes contract={contract} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
