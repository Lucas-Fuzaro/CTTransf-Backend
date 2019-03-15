const fs = require('fs')
const path = require('path')
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network')
const FabricCAServices = require('fabric-ca-client');
const yaml = require('js-yaml')

// Connection Profile Path -> Reading File -> yaml to JSON
const conProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'connection-profile.yaml'), 'utf8'))

// Wallet: filesystem of users certificates and keys
const wallet = new FileSystemWallet(path.join(process.cwd(), 'wallet'))

// Getting ENV
const num_orgs = process.env.NUM_ORGS
const channel_name = process.env.CHANNEL_NAME
const contract_name = process.env.CONTRACT_NAME

// === Initiating all organizations ===
for(var current_org = 1; current_org == num_orgs; current_org++){
    initialSetup(current_org)
}

const initialSetup = async (current_org) => {
    console.info(`\n\n@@@ Starting ORG${current_org} @@@\n\n`)

    // === Creating ADMIN Identity for each ORG ===
    await createAdm(current_org)
}

async function createAdm(current_org) {
    try {
        // === Formatting variable ===
        current_org = "org" + current_org.toString()

        // Does ADMIN exists?
        const adminExistence = await wallet.exists('admin-' + current_org)
        if (adminExistence) throw new Error('Admin already exists!')

        // Connecting into the network using ADMIN Identity
        const ca = new FabricCAServices(conProfile.certificateAuthorities['ca-' + current_org].url);

        // Upon channel creation, ADMIN is automatically registered. We just need to enroll
        const enrollment = await ca.enroll({
            enrollmentID: 'admin-' + current_org,
            enrollmentSecret: 'adminpw'
        })
        if (current_org[current_org.length - 1] == "1") const orgMSP = "DealerMSP"
        if (current_org[current_org.length - 1] == "2") const orgMSP = "InsurerMSP"
        if (current_org[current_org.length - 1] == "3") const orgMSP = "RegistryMSP"

        const adminIdentity = X509WalletMixin.createIdentity(orgMSP, enrollment.certificate, enrollment.key.toBytes())
        wallet.import('admin-' + current_org, adminIdentity)
        console.info("Successfully created ADMIN wallet!")

    } catch (error) {
        console.error(error)
        console.log("\n\nCould not create ADMIN wallet!")
    }
}

// === User is a employee for the Organization ===

function registerUser(walletName, org) {
    return new Promise(async (resolve, reject) => {

        try {
            // Does the userCPF exists?
            const userExistence = await wallet.exists(walletName)
            if (userExistence) reject(`${walletName} already exists and has a wallet!`)

            // Does ADMIN exists?
            const adminExistence = await wallet.exists('admin-' + org)
            if (!adminExistence) reject('ADMIN user has not been enrolled yet. To register a user, you first need to enroll the admin.')

            // Connecting into the network using ADMIN wallet
            const gateway = new Gateway()
            await gateway.connect(conProfile, {
                wallet,
                identity: 'admin-' + org,
                discovery: {
                    enabled: false
                }
            })
            const ca = gateway.getClient().getCertificateAuthority()

            // Getting ADMIN Identity
            const adminIdentity = gateway.getCurrentIdentity()

            // Creating an Enrollment Secret for the new user
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: walletName,
                role: 'client'
            }, adminIdentity)

            resolve({
                enrollmentID: walletName,
                enrollmentSecret: secret
            })
        } catch (err) {
            reject(err)
        }


    })
}

// === User is a employee for the Organization ===

function enrollUser(walletName, secret, org) {
    return new Promise(async (resolve, reject) => {

        try {
            // Does the userCPF exists?
            const userExistence = await wallet.exists(walletName)
            if (userExistence) reject(`"${walletName}" already exists and has a wallet!`)

            // Does ADMIN exists?
            const adminExistence = await wallet.exists('admin-' + org)
            if (!adminExistence) reject('ADMIN user has not been enrolled yet. To register a user, you first need to enroll the ADMIN.')

            // Connecting into the network using User wallet
            const gateway = new Gateway()
            await gateway.connect(conProfile, {
                wallet,
                identity: 'admin-' + org,
                discovery: {
                    enabled: false
                }
            })
            const ca = gateway.getClient().getCertificateAuthority()

            // Enrolling user using previously generated Enrollment Secret
            const enrollIdentity = await ca.enroll({
                enrollmentID: walletName,
                enrollmentSecret: secret
            })

            if (org == "org1") const orgMSP = "DealerMSP"
            if (org == "org2") const orgMSP = "InsurerMSP"
            if (org == "org3") const orgMSP = "RegistryMSP"

            // Creating New User Wallet
            const userIdentity = X509WalletMixin.createIdentity(orgMSP, enrollIdentity.certificate, enrollIdentity.key.toBytes())
            wallet.import(walletName, userIdentity)
            console.info(`Successfully enrolled user "${walletName}"`)
            console.info("@@ New Wallet successfully created @@")

            resolve({
                user: walletName,
                identity: userIdentity
            })
        } catch (err) {
            reject(err)
        }
    })
}

function getAllIdentities() {
    return new Promise(async (resolve, reject) => {
        const list = await wallet.list()
        resolve(list)
    })
}

function connectChannel(walletName) {
    return new Promise(async (resolve, reject) => {

        // Creating a Gateway
        const gateway = new Gateway()

        try {
            // Connection Profile Configuration
            const options = {
                identity: walletName,
                wallet: wallet,
                discovery: {
                    enabled: false,
                    asLocalhost: true
                }
            }

            // Connecting to the Channel and Contract

            await gateway.connect(conProfile, options)
            const channel = await gateway.getNetwork(channel_name)
            const chaincode = await channel.getContract(contract_name)

            resolve(chaincode)

        } catch (err) {

            reject(err)

        }
    })
}

module.exports = {
    registerUser: registerUser,
    enrollUser: enrollUser,
    getAllIdentities: getAllIdentities,
    connectChannel: connectChannel
}