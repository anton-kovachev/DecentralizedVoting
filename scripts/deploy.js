const hardhat = require("hardhat");
const fs = require("fs/promises");

async function main() {
    const Voting = await hardhat.ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();
    
    writeDeploymentContent(voting, "./abi/voting.json")
}

async function writeDeploymentContent(contract, filename) {
    const data = {
        network: hardhat.network.name,
        contract: {
        address: await contract.getAddress(), 
        signerAddress: (await hardhat.ethers.provider.getSigner()).address,
        abi: contract.interface.format()
        }
    }

    const content = JSON.stringify(data, null, 2);
    fs.writeFile(filename, content);
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})