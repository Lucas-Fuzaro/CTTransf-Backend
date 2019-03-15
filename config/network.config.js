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

for(var current_org = 1; current_org == num_orgs; current_org++){
    initialSetup(current_org)
}

const initialSetup = async (current_org) => {
    console.info(`@@@ Starting ORG${current_org} ...`)

    // === Creating ADMIN Identity for that ORG ===
    await createAdm(current_org)
}

async function createAdm(current_org) {
    try {
        // Does ADMIN exists?
        const adminExistence = await wallet.exists('admin-org' + current_org.toString())
        if (adminExistence) throw new Error('Admin already exists!')

        // Connecting into the network using ADMIN Identity
        const ca = new FabricCAServices(conProfile.certificateAuthorities['ca.example.com'].url);

        // Upon channel creation, admin is automatically registered. We just need to enroll
        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        })
        const adminIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes())
        wallet.import('admin', adminIdentity)
        console.info("Successfully created admin wallet!")
    } catch (error) {
        console.error(error)
        console.log("\n\nCould not create admin wallet!")
    }
}

// === User is a employee for the Organization ===

function registerUser(userCPF) {
    return new Promise(async (resolve, reject) => {

        try {
            // Does the userCPF exists?
            const userExistence = await wallet.exists(userCPF)
            if (userExistence) reject(`${userCPF} already exists and has a wallet!`)

            // Does ADMIN exists?
            const adminExistence = await wallet.exists('admin')
            if (!adminExistence) reject('Admin user has not been enrolled yet. To register a user, you first need to enroll the admin.')

            // Connecting into the network using ADMIN wallet
            const gateway = new Gateway()
            await gateway.connect(conProfile, {
                wallet,
                identity: 'admin',
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
                enrollmentID: userCPF,
                role: 'client'
            }, adminIdentity)

            resolve({
                enrollmentID: userCPF,
                enrollmentSecret: secret
            })
        } catch (err) {
            reject(err)
        }


    })
}

// === User is a employee for the Organization ===

function enrollUser(userCPF, secret) {
    return new Promise(async (resolve, reject) => {

        try {

            // Does the userCPF exists?
            const userExistence = await wallet.exists(userCPF)
            if (userExistence) reject(`"${userCPF}" already exists and has a wallet!`)

            // Does ADMIN exists?
            const adminExistence = await wallet.exists('admin')
            if (!adminExistence) reject('Admin user has not been enrolled yet. To register a user, you first need to enroll the admin.')

            // Connecting into the network using User wallet
            const gateway = new Gateway()
            await gateway.connect(conProfile, {
                wallet,
                identity: 'admin',
                discovery: {
                    enabled: false
                }
            })
            const ca = gateway.getClient().getCertificateAuthority()

            // Enrolling user using previously generated Enrollment Secret
            const enrollIdentity = await ca.enroll({
                enrollmentID: userCPF,
                enrollmentSecret: secret
            })

            // Creating New User Wallet
            const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollIdentity.certificate, enrollIdentity.key.toBytes())
            wallet.import(userCPF, userIdentity)
            console.info(`Successfully registered and enrolled user "${userCPF}"`)
            console.info("@@ New Wallet successfully created @@")

            resolve({
                user: userCPF,
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

function connectChannel(userCPF) {
    return new Promise(async (resolve, reject) => {

        // Creating a Gateway
        const gateway = new Gateway()

        try {
            // Connection Profile Configuration
            const options = {
                identity: userCPF,
                wallet: wallet,
                discovery: {
                    enabled: false,
                    asLocalhost: true
                }
            }

            // Connecting to the Channel and Contract

            await gateway.connect(conProfile, options)
            const channel = await gateway.getNetwork('mychannel')
            const chaincode = await gateway.getContract('mycc')

            resolve({
                channel: channel,
                chaincode: chaincode
            })

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

// function revokeUser(userCPF){}

// function reenroll(username){
//     return new Promise(async (resolve, reject) => {

//         // Does the user exists?
//         const userExistence = await wallet.exists(username)
//         if (!userExistence) reject(`${username} does not exists!`)

//         // Does ADMIN exists?
//         const adminExistence = await wallet.exists('admin')
//         if (!adminExistence) reject('Admin user has not been enrolled yet. To register or delete a user, you first need to enroll the admin.')

//         // Connecting into the network using ADMIN wallet
//         const gateway = new Gateway()
//         await gateway.connect(conProfile, { wallet, identity: 'admin', discovery: { enabled: false }})
//         const ca = gateway.getClient().getCertificateAuthority()

//     })
// }