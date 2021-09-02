certoraRun \
  specs/poc/Euler.sol \
  specs/poc/EToken.sol \
  specs/poc/DToken.sol \
  specs/poc/RiskManager.sol \
  specs/poc/DummyERC20.sol \
  --link \
    Euler:dt=DToken \
    Euler:et=EToken \
    Euler:rm=RiskManager \
    Euler:ut=DummyERC20 \
    EToken:rm=RiskManager \
    EToken:ut=DummyERC20 \
    DToken:rm=RiskManager \
    DToken:ut=DummyERC20 \
  --verify \
    Euler:specs/EToken.spec \
  --optimistic_loop \
  --staging \
  --cache euler_poc
  # --settings -useBitVectorTheory \
  