const et = require('./lib/eTestLib');
const scenarios = require('./lib/scenarios');


et.testSet({
    desc: "batch operations",

    preActions: ctx => [
        ...scenarios.basicLiquidity()(ctx),
        { action: 'installTestModule', id: 100, },
    ]
})




.test({
    desc: "sub-account transfers",
    actions: ctx => [
        { call: 'eTokens.eTST.balanceOf', args: [et.getSubAccount(ctx.wallet.address, 1)], assertEql: 0, },
        { call: 'eTokens.eTST.balanceOf', args: [et.getSubAccount(ctx.wallet.address, 2)], assertEql: 0, },

        { call: 'markets.getEnteredMarkets', args: [et.getSubAccount(ctx.wallet.address, 1)], assertEql: [], },

        // Do a dry-run

        { action: 'sendBatch', batch: [
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(1)], },
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 3), et.eth(1)], },
              { send: 'eTokens.eTST.transferFrom', args: [et.getSubAccount(ctx.wallet.address, 1), et.getSubAccount(ctx.wallet.address, 2), et.eth(.6)], },
              { send: 'markets.enterMarket', args: [1, ctx.contracts.tokens.TST.address], },
          ],
          deferLiquidityChecks: [ctx.wallet.address],
          dryRun:1,
          toQuery: [et.getSubAccount(ctx.wallet.address, 1), et.getSubAccount(ctx.wallet.address, 2), ctx.wallet.address],
          onResult: r => {
              //et.expect(r.gasUsed.toNumber()).to.be.lessThan(310000); // without deferLiquidityChecks, add another 30k, FIXME: unreliable when instrumented

              et.expect(r.liquidities.length).to.equal(3);
              et.expect(r.liquidities[0].length).to.equal(1);

              et.equals(r.liquidities[0][0].status.collateralValue, 0.6, .001);
              et.equals(r.liquidities[0][0].status.liabilityValue, 0);

              et.expect(r.liquidities[1].length).to.equal(0); // not entered into any markets

              et.equals(r.liquidities[2][0].status.collateralValue, 12, .1);
              et.equals(r.liquidities[2][1].status.collateralValue, 0);
          },
        },

        // Do a real one

        { action: 'sendBatch', batch: [
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(1)], },
              { send: 'eTokens.eTST.transferFrom', args: [et.getSubAccount(ctx.wallet.address, 1), et.getSubAccount(ctx.wallet.address, 2), et.eth(.6)], },
              { send: 'markets.enterMarket', args: [1, ctx.contracts.tokens.TST.address], },
          ],
        },

        { call: 'eTokens.eTST.balanceOf', args: [et.getSubAccount(ctx.wallet.address, 1)], assertEql: et.eth(.4), },
        { call: 'eTokens.eTST.balanceOf', args: [et.getSubAccount(ctx.wallet.address, 2)], assertEql: et.eth(.6), },

        { call: 'markets.getEnteredMarkets', args: [et.getSubAccount(ctx.wallet.address, 1)], assertEql: [ctx.contracts.tokens.TST.address], },
    ],
})



.test({
    desc: "call to unknown module",
    actions: ctx => [
        { action: 'sendBatch', batch: [
                { from: ctx.wallet, send: 'flashLoan.onDeferredLiquidityCheck', args: [[]] },
          ], expectError: 'e/batch/unknown-proxy-addr',
        },
    ],
})



.test({
    desc: "call to internal module",
    actions: ctx => [
        { send: 'testModule.setModuleId', args: [ctx.contracts.testModule.address, 1e7], },
        { action: 'sendBatch', batch: [
                { from: ctx.wallet, send: 'testModule.testCall', args: [] },
          ], expectError: 'e/batch/call-to-internal-module',
        },
    ],
})



.test({
    desc: "call to module not installed",
    actions: ctx => [
        { send: 'testModule.setModuleImpl', args: [ctx.contracts.testModule.address, et.AddressZero], },
        { action: 'sendBatch', batch: [
                { from: ctx.wallet, send: 'testModule.testCall' },
            ], expectError: 'e/batch/module-not-installed',
        },
    ],
})



.test({
    desc: "batch reentrancy",
    actions: ctx => [
        { action: 'sendBatch', deferLiquidityChecks: [et.getSubAccount(ctx.wallet.address, 1)], batch: [
            { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(1)], },
            { send: 'exec.batchDispatch', args: [
                [{
                    allowError: false,
                    proxyAddr: ctx.contracts.eTokens.eTST.address,
                    data: ctx.contracts.eTokens.eTST.interface.encodeFunctionData('transfer', [ctx.wallet.address, et.eth(1)])
                }],
                [et.getSubAccount(ctx.wallet.address, 1)],
            ]}
          ], expectError: 'e/batch/reentrancy',
        },
    ],
})



.test({
    desc: "defer reentrancy",
    actions: ctx => [
        { action: 'sendBatch', deferLiquidityChecks: [et.getSubAccount(ctx.wallet.address, 1)], batch: [
            { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(1)], },
            { send: 'exec.deferLiquidityCheck', args: [
                et.getSubAccount(ctx.wallet.address, 1),
                ctx.contracts.eTokens.eTST.interface.encodeFunctionData('transfer', [ctx.wallet.address, et.eth(1)]),
            ]}
          ], expectError: 'e/defer/reentrancy',
        },
    ],
})


.test({
    desc: "allow error",
    actions: ctx => [
        { action: 'sendBatch', batch: [
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(100)], },
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(1)], },
          ], expectError: 'e/insufficient-balance',
        }, 
        { action: 'sendBatch', batch: [
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(100)], allowError: true, },
              { send: 'eTokens.eTST.transfer', args: [et.getSubAccount(ctx.wallet.address, 1), et.eth(1)], },
          ],
        },
        { call: 'eTokens.eTST.balanceOf', args: [et.getSubAccount(ctx.wallet.address, 1)], assertEql: et.eth(1), },
    ],
})



.run();
