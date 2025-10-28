import { Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import { Nav } from "react-bootstrap";
import { Navbar as _Navbar } from "react-bootstrap";

const Navbar = ({ isConnected, connect, isMember, joinMembers }) => {
  return (
    <_Navbar collapseOnSelect expand="lg" bg="darw" variant="dark">
      <Container fluid>
        <_Navbar.Brand href="/">Voting</_Navbar.Brand>
        <_Navbar.Toggle />
        <_Navbar.Collapse>
          <Nav className="me-auto">
            <Nav.Link href="/votes">Votes</Nav.Link>
            <Nav.Link href="/create-vote">Create Vote</Nav.Link>
            {isConnected && !isMember && <Button variant="success" onClick={(event) => joinMembers()}>Become Member</Button>}
          </Nav>
          <Nav>
            {!isConnected ? (
              <Button onClick={(e) => { connect();}}>
                Connect to Metamask
              </Button>
            ) : (<p style={{color: "white"}}>Connected to Metamask.</p>)}
          </Nav>
        </_Navbar.Collapse>
      </Container>
    </_Navbar>
  );
};

export default Navbar;
