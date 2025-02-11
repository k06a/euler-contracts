const et = require('./lib/eTestLib');

const maxSaneAmount = ethers.BigNumber.from(2).pow(112).sub(1);


et.testSet({
    desc: "maximum amount values",

    preActions: ctx => {
        let actions = [];

        for (let from of [ctx.wallet, ctx.wallet2, ctx.wallet3]) {
            actions.push({ from, send: 'tokens.TST.mint', args: [from.address, et.MaxUint256], });
            actions.push({ from, send: 'tokens.TST.approve', args: [ctx.contracts.euler.address, et.MaxUint256,], });

            actions.push({ from, send: 'tokens.TST6.mint', args: [from.address, et.MaxUint256], });
            actions.push({ from, send: 'tokens.TST6.approve', args: [ctx.contracts.euler.address, et.MaxUint256,], });
        }

        return actions;
    },
})


.test({
    desc: "deposits and withdrawals",
    actions: ctx => [
        // Reads balanceOf on TST, which returns amount too large
        { send: 'eTokens.eTST.deposit', args: [0, et.MaxUint256], expectError: 'e/amount-too-large', },

        // Specifies direct amount too large
        { send: 'eTokens.eTST.deposit', args: [0, et.MaxUint256.sub(1)], expectError: 'e/amount-too-large', },
        { send: 'eTokens.eTST.withdraw', args: [0, et.MaxUint256.sub(1)], expectError: 'e/amount-too-large', },

        // One too large
        { send: 'eTokens.eTST.deposit', args: [0, maxSaneAmount.add(1)], expectError: 'e/amount-too-large', },
        { send: 'eTokens.eTST.withdraw', args: [0, maxSaneAmount.add(1)], expectError: 'e/amount-too-large', },

        // OK, by 1
        { send: 'eTokens.eTST.deposit', args: [0, maxSaneAmount], },

        // Now another deposit to push us over the top
        { send: 'eTokens.eTST.deposit', args: [0, 1], expectError: 'e/amount-too-large', },

        // And from another account, poolSize will be too large
        { from: ctx.wallet2, send: 'eTokens.eTST.deposit', args: [0, 1], expectError: 'e/amount-too-large', },

        // Withdraw exact balance
        { send: 'eTokens.eTST.withdraw', args: [0, maxSaneAmount], },
    ],
})


.test({
    desc: "lower decimals",
    actions: ctx => [
        { send: 'tokens.TST10.mint', args: [ctx.wallet.address, et.MaxUint256], },
        { send: 'tokens.TST10.approve', args: [ctx.contracts.euler.address, et.MaxUint256,], },

        // Reads balanceOf on TST, which returns amount too large
        { send: 'eTokens.eTST10.deposit', args: [0, et.MaxUint256], expectError: 'e/amount-too-large', },

        // Specifies direct amount too large
        { send: 'eTokens.eTST10.deposit', args: [0, et.MaxUint256.sub(1)], expectError: 'e/amount-too-large', },
        { send: 'eTokens.eTST10.withdraw', args: [0, et.MaxUint256.sub(1)], expectError: 'e/amount-too-large', },

        // One too large
        { send: 'eTokens.eTST10.deposit', args: [0, maxSaneAmount.div(ethers.BigNumber.from(10).pow(18)).add(1)],
          expectError: 'e/amount-too-large', },
        { send: 'eTokens.eTST10.withdraw', args: [0, maxSaneAmount.div(ethers.BigNumber.from(10).pow(18)).add(1)],
          expectError: 'e/amount-too-large', },

        // OK, by 1
        { send: 'eTokens.eTST10.deposit', args: [0, maxSaneAmount.div(ethers.BigNumber.from(10).pow(18))], },
        { send: 'eTokens.eTST10.withdraw', args: [0, maxSaneAmount.div(ethers.BigNumber.from(10).pow(18))], },
    ],
})



.test({
    desc: "pullTokens results in euler balance being too large",

    actions: ctx => [
        { send: 'eTokens.eTST.deposit', args: [0, maxSaneAmount], },
        { from: ctx.wallet2, send: 'eTokens.eTST.deposit', args: [0, 1], expectError: 'e/amount-too-large', },
    ],
})


.test({
    desc: "increaseBalance results in totalBalances being too large",

    actions: ctx => [
        { send: 'eTokens.eTST.deposit', args: [0, maxSaneAmount], },
        { from: ctx.wallet2, send: 'eTokens.eTST.mint', args: [0, 10], expectError: 'e/amount-too-large-to-encode', },
    ],
})



.run();
