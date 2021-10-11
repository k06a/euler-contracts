spec=certora/spec/MarketsAssets.spec

if [ -z "$3" ]
  then
    echo "Incorrect number of arguments"
    echo ""
    echo "Usage: (from git root)"
    echo "  ./certora/scripts/`basename $0` [contract] [rule] [message describing the run]"
    echo ""
    echo "Possible contracts:"
    ls -p certora/munged/modules | grep -v / | xargs basename -s .sol | sed 's/\(.*\)/  \1/g'
    echo ""
    echo "possible rules:"
    # TODO: this is pretty terrible:
    grep "^rule\|^invariant" ${spec} \
        | sed 's/^[a-z]* \(.*\)*(.*$/  \1/'
    exit 1
fi

contract=$1
rule=$2
msg=$3
shift 3

make -C certora munged

certoraRun certora/munged/modules/${contract}.sol \
  certora/helpers/DummyERC20A.sol \
  certora/munged/modules/EToken.sol   \
  --verify ${contract}:${spec} \
  --solc solc8.0 \
  --solc_args '["--optimize"]' \
  --short_output \
  --rule ${rule} \
  --settings -postProcessCounterExamples=true,-enableStorageAnalysis=true \
  --loop_iter 1 --optimistic_loop \
  --msg "M and A ${contract} ${rule} ${msg}" --staging \
  --link ${contract}:eTokenImpl=EToken \
  $*
