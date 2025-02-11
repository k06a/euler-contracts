const et = require('./lib/eTestLib');

et.testSet({
    desc: "activating markets",
})


.test({
    desc: "re-activate",
    actions: ctx => [
        { from: ctx.wallet, send: 'markets.activateMarket', args: [ctx.contracts.tokens.UTST.address], },

        { call: 'markets.underlyingToEToken', args: [ctx.contracts.tokens.UTST.address], onResult: r => {
            ctx.stash.eTokenAddr = r;
        }},

        { from: ctx.wallet, send: 'markets.activateMarket', args: [ctx.contracts.tokens.UTST.address], },

        { call: 'markets.underlyingToEToken', args: [ctx.contracts.tokens.UTST.address], onResult: r => {
            et.expect(ctx.stash.eTokenAddr).to.equal(r);
        }},
    ],
})


.test({
    desc: "invalid contracts",
    actions: ctx => [
        { from: ctx.wallet, send: 'markets.activateMarket', args: [ctx.contracts.euler.address], expectError: 'e/markets/invalid-token', },

        { from: ctx.wallet, send: 'markets.activateMarket', args: [ctx.contracts.eTokens.eTST.address], expectError: 'e/markets/invalid-token', },
        { from: ctx.wallet, send: 'markets.activateMarket', args: [ctx.contracts.dTokens.dTST.address], expectError: 'e/markets/invalid-token', },
    ],
})


.test({
    desc: "no uniswap pool",
    actions: ctx => [
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], expectError: 'e/no-uniswap-pool-avail', },
    ],
})


.test({
    desc: "uniswap pool not initiated",
    actions: ctx => [
        { action: 'createUniswapPool', pair: 'TST4/WETH', fee: et.FeeAmount.MEDIUM, },
        async () => {
            await (await ctx.contracts.uniswapPools['TST4/WETH'].mockSetThrowNotInitiated(true)).wait();
        },
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], expectError: 'e/risk/uniswap-pool-not-inited', },
    ],
})


.test({
    desc: "uniswap pool other error",
    actions: ctx => [
        { action: 'createUniswapPool', pair: 'TST4/WETH', fee: et.FeeAmount.MEDIUM, },
        async () => {
            await (await ctx.contracts.uniswapPools['TST4/WETH'].mockSetThrowOther(true)).wait();
        },
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], expectError: 'e/risk/uniswap/OTHER', },
    ],
})


.test({
    desc: "uniswap pool empty error",
    actions: ctx => [
        { action: 'createUniswapPool', pair: 'TST4/WETH', fee: et.FeeAmount.MEDIUM, },
        async () => {
            await (await ctx.contracts.uniswapPools['TST4/WETH'].mockSetThrowEmpty(true)).wait();
        },
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], expectError: 'e/empty-error', },
    ],
})


.test({
    desc: "select second fee uniswap pool",
    actions: ctx => [
        { action: 'createUniswapPool', pair: 'TST4/WETH', fee: et.FeeAmount.LOW, },
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], },
        { call: 'markets.getPricingConfig', args: [ctx.contracts.tokens.TST4.address], onResult: r => {
            et.expect(r.pricingParameters).to.equal(et.FeeAmount.LOW);
        }, },
    ],
})


.test({
    desc: "select third fee uniswap pool",
    actions: ctx => [
        { action: 'createUniswapPool', pair: 'TST4/WETH', fee: et.FeeAmount.HIGH, },
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], },
        { call: 'markets.getPricingConfig', args: [ctx.contracts.tokens.TST4.address], onResult: r => {
            et.expect(r.pricingParameters).to.equal(et.FeeAmount.HIGH);
        }, },
    ],
})


.test({
    desc: "select third fee uniswap pool",
    actions: ctx => [
        { send: 'uniswapV3Factory.setPoolAddress', args: [ctx.contracts.tokens.TST4.address, ctx.contracts.tokens.WETH.address, et.FeeAmount.MEDIUM, ctx.contracts.euler.address], },
        { send: 'markets.activateMarket', args: [ctx.contracts.tokens.TST4.address], expectError: 'e/bad-uniswap-pool-addr'},
    ],
})


.run();
