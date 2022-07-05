
// const { network, getNamedAccounts, deployments, run, ethers } = require("hardhat")
const { getNamedAccounts, deployments, network, ethers } = require("hardhat")

const { developmentChains, networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS }
    = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = "1000000000000000000000"

module.exports = async function({getNamedAccounts, deployments}) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts();
    console.log("deployer :1", deployer)
    console.log("deploy : 2", deploy)
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    if (chainId == 31337) {
        // create VRFV2 Subscription
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        // Usually, you'd need the link token on a real network
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const waitBlockConfirmations = (chainId == 31337)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------------------------------")

    // const entranceFee = networkConfig[chainId]["entranceFee"]
    // const gasLane = networkConfig[chainId]["gasLane"]
    // const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    // const interval = networkConfig[chainId]["interval"]
    // const args = [vrfCoordinatorV2Address,
    //     entranceFee, gasLane, subscriptionId,
    //     callbackGasLimit, interval]
    const args = [ vrfCoordinatorV2Address, subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["interval"],
        networkConfig[chainId]["entranceFee"],
        networkConfig[chainId]["callbackGasLimit"],
         ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    }
    log("-----------------------------------")
}

module.exports.tags = ["all", "raffle"]