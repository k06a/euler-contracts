task("batch:EulerBatchItems")
.addPositionalParam("jsonFilePath")
    .setAction(async (args) => {
        const et = require("../test/lib/eTestLib");
        const ctx = await et.getTaskCtx();
        const path = args.jsonFilePath;
        const filePath = require(path);

        const { abi, bytecode, } = require('../artifacts/contracts/modules/Exec.sol/Exec.json');
        const exec = new ethers.Contract(ctx.contracts.exec.address, abi, ctx.wallet);
                
        const contractNames = filePath.contracts;
        const functionNames = filePath.functions;
        const contractAddress = filePath.addresses;
        const functionArgs = filePath.args;
        
        let batchData = [];
        let encodedBatchData;
    

        if (contractNames.length == functionNames.length && functionNames.length == functionArgs.length) {
            console.log("[valid] data array lengths match")

            for (i = 0; i < functionNames.length; i++) {
                
                let contractJson = require(`../artifacts/contracts/modules/${contractNames[i]}.sol/${contractNames[i]}.json`);
                let contract = new ethers.Contract(contractAddress[i], contractJson.abi, ctx.wallet);
                
                if (typeof(contract[`${functionNames[i]}`]) !== 'function') {
                    console.log("Invalid function name", functionNames[i]);
                    return;
                }
    
                let tempBatchData = {
                    allowError: false,
                    proxyAddr: contractAddress[i],
                    data: contract.interface.encodeFunctionData(`${functionNames[i]}`, functionArgs[i])
                }
                batchData.push(tempBatchData)
            }
            encodedBatchData = exec.interface.encodeFunctionData('batchDispatch', [batchData, []]);
            console.log(encodedBatchData)
        } else {
            console.log("[error] check json data array lengths match")
            return;
        }
        // usage: NODE_ENV=alchemy npx hardhat batch:EulerBatchItems "../scripts/templates/batchDataRequest.json" --network ropsten
        // example file structure in ../scripts/templates/batchDataRequest.json
    });