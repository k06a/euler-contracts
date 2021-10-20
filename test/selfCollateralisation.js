const et = require('./lib/eTestLib');
const scenarios = require('./lib/scenarios');


et.testSet({
    desc: "self collateralisation",

    preActions: scenarios.basicLiquidity(),
})




.test({
    desc: "self collateralisation",
    actions: ctx => [
        { action: 'updateUniswapPrice', pair: 'TST/WETH', price: '1', },
        { action: 'updateUniswapPrice', pair: 'TST3/WETH', price: '1', },
        { action: 'setAssetConfig', tok: 'TST3', config: { borrowFactor: .6}, },


        { send: 'tokens.TST3.mint', args: [ctx.wallet.address, et.eth(100)], },
        { send: 'tokens.TST3.approve', args: [ctx.contracts.euler.address, et.MaxUint256,], },
        { send: 'eTokens.eTST3.deposit', args: [0, et.eth(50)], }, // extra for the pool


        { send: 'tokens.TST.mint', args: [ctx.wallet3.address, et.eth(100)], },
        { send: 'tokens.TST3.mint', args: [ctx.wallet3.address, et.eth(100)], },

        { from: ctx.wallet3, send: 'tokens.TST3.approve', args: [ctx.contracts.euler.address, et.MaxUint256,], },
        { from: ctx.wallet3, send: 'markets.enterMarket', args: [0, ctx.contracts.tokens.TST.address], },
        { from: ctx.wallet3, send: 'eTokens.eTST.deposit', args: [0, et.eth(0.5)], },

        { from: ctx.wallet3, send: 'eTokens.eTST3.mint', args: [0, et.eth(1.501)], expectError: 'e/collateral-violation' },
        { from: ctx.wallet3, send: 'eTokens.eTST3.mint', args: [0, et.eth(1.5)], },

        { callStatic: 'exec.detailedLiquidity', args: [ctx.wallet3.address], onResult: r => {
            // Balance adjusted down by SELF_COLLATERAL_FACTOR
            et.equals(r[2].status.collateralValue, 1.275); // 1.5 * 0.85
            // Remaining liability is adjusted up by asset borrow factor
            et.equals(r[2].status.liabilityValue, 1.65); // 1.275 + (0.225 / .6)
        }},

        { from: ctx.wallet3, send: 'dTokens.dTST2.borrow', args: [0, et.eth(0.001)], expectError: 'e/borrow-isolation-violation' },


        // Extra balance available as collateral

        { action: 'snapshot', },

        { from: ctx.wallet3, send: 'eTokens.eTST3.deposit', args: [0, et.eth(3)], },

        { callStatic: 'exec.detailedLiquidity', args: [ctx.wallet3.address], onResult: r => {
            et.equals(r[2].status.collateralValue, 1.5); // Limited to liability because TST3 has 0 collateral factor
            et.equals(r[2].status.liabilityValue, 1.5); // Full liability is now self-collateralised
        }},

        { action: 'setAssetConfig', tok: 'TST3', config: { collateralFactor: 0.7, }, },

        { callStatic: 'exec.detailedLiquidity', args: [ctx.wallet3.address], onResult: r => {
            // The liability is fully self-collateralised as before, with 1.5.
            // However, there is also extra collateral available: 4.5 - (1.5/.85)
            // This extra collateral is available for other borrows, adter adjusting
            // down according to the asset's collateral factor of 0.7.

            et.equals(r[2].status.collateralValue, '3.414705882352941176'); // 1.5 + ((4.5 - (1.5/.85)) * .7)
            et.equals(r[2].status.liabilityValue, 1.5); // unchanged
        }},

        { action: 'revert', },


        // Extra liability

        { from: ctx.wallet3, send: 'eTokens.eTST.deposit', args: [0, et.eth(10)], }, // extra collateral so borrow succeeds

        { from: ctx.wallet3, send: 'dTokens.dTST3.borrow', args: [0, et.eth(3)], },

        { callStatic: 'exec.detailedLiquidity', args: [ctx.wallet3.address], onResult: r => {
            // 1.5*.85=1.275 of the liability is self-collateralised. This leaves .225 of the original 1.5
            // mint and 3 of the new borrow as unmet liabilities, which are adjusted up according
            // to the borrow factor of .6.

            et.equals(r[2].status.collateralValue, 1.275); // unchanged
            et.equals(r[2].status.liabilityValue, 6.65); // 1.275 + ((0.225 + 3) / .6)
        }, },
    ],
})




.run();
