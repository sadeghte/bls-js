async function main() {
  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("BLSSignatureChecker");
  console.log("Deploying BLSSignatureChecker...");
  const contract = await Contract.deploy();
  
  // Wait for the contract to be deployed
  await contract.waitForDeployment();
  console.log("BLSSignatureChecker deployed to:", await contract.getAddress());
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });