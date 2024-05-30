async function main() {
  await hre.run("verify:verify", {
    address: process.env.ADDRESS,
    constructorArguments: [
    // Constructor arguments go here
    ],
  });
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });