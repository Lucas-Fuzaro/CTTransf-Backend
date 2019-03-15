const networkServices = require('../config/network.config')

/**
 * 
 * @param {*} walletName - User primary key. It identifies uniquely each user in an organization
 *                         Must be formatted as: "11100011122-org1" with a total of 11 characters before the dash, all numbers
 *                         and 4 characters after it
 */

function registerUser(walletName) {
    return new Promise(async (resolve, reject) => {

        // === Getting CPF from walletName and removing all non-numeric characters ===
        const cpf = walletName.substring(0, walletName.indexOf("-")).replace(/\D/g, '')

        // === Getting Org from walletName ===
        const org = walletName.substring(walletName.indexOf("-") + 1)

        // === Checking individually for each separate part of the parameter ===
        if (cpf.length !== 11) return reject("Invalid CPF! It must be only numbers with 11 digits")
        if (org.length !== 4 || org.substring(0, 3) !== "org" || isNaN(parseInt(org[org.length - 1]))) return reject("Invalid Organization!")

        // === Checking if variable walletName is equal to treated variables. If not, return error
        if (walletName !== cpf + org) return reject("Invalid variable format!")

        // === Calling registerUser() function from network-service.js file ===
        networkServices.registerUser(walletName, org)
            .then((resp) => {
                resolve(resp)
            })
            .catch((err) => {
                reject(err)
            })

    })
}

/**
 * 
 * @param {*} walletName - User primary key. It identifies uniquely each user in an organization
 *                         Must be formatted as: "11100011122-org1" with a total of 11 characters before the dash, all numbers
 *                         and 4 characters after it
 * 
 * @param {*} secret - Password created when registered
 *                     It is a string with numbers, lowercase and uppercase characters
 */

function enrollUser(walletName, secret) {
    return new Promise(async (resolve, reject) => {

        // === Getting CPF from walletName and removing all non-numeric characters ===
        const cpf = walletName.substring(0, walletName.indexOf("-")).replace(/\D/g, '')

        // === Getting Org from walletName ===
        const org = walletName.substring(walletName.indexOf("-") + 1)

        // === Checking individually for each separate part of the parameter ===
        if (cpf.length !== 11) return reject("Invalid CPF! It must be only numbers with 11 digits")
        if (org.length !== 4 || org.substring(0, 3) !== "org" || isNaN(parseInt(org[org.length - 1]))) return reject("Invalid Organization!")

        // === Checking if variable walletName is equal to treated variables. If not, return error
        if (walletName !== cpf + org) return reject("Invalid variable format!")

        // === Calling enrollUser() function from network-service.js file ===
        networkServices.enrollUser(walletName, secret, org).then((resp) => {
            resolve(resp)
        })
        .catch((err) => {
            reject(err)
        })

    })

}

function getAllIdentities() {
    return new Promise(async (resolve, reject) => {
        // === Calling getAllIdentities() function from network-service.js file ===
        var list = await networkServices.getAllIdentities()

        // === Going by each identity and getting the label property ===
        resolve({
            identity: list.map(identity => {
                return identity.label
            })
        })
    })
}

/**
 * 
 * @param {*} car - Object. It has the following format
 *                  let car = {
 *                               plate: string,        -> ex: "ABC1234"
 *                               color: string,        -> ex: "black"
 *                               make: string,         -> ex: "fiat"
 *                               model: string,        -> ex: "uno"
 *                               mileage: string,      -> ex: "10515.65"
 *                               price: string,        -> ex: "29000.50"
 *                               owner: string,        -> ex: "11100011122"
 *                               new_owner: string     -> ex: "11100011122"
 *                  }
 *                  
 * @param {*} walletName - User CPF + User Organization.
 *                         ex: "00011100011-org1" 
 */

function createCar(car, walletName) {
    return new Promise(async (resolve, reject) => {

        // === Getting CPF from walletName and removing all non-numeric characters ===
        const cpf = walletName.substring(0, walletName.indexOf("-")).replace(/\D/g, '')

        // === Getting Org from walletName ===
        const org = walletName.substring(walletName.indexOf("-") + 1)
        
        // === Checking individually for each separate part of the parameter ===
        if (cpf.length !== 11) return reject("Invalid CPF! It must be only numbers with 11 digits")
        if (org.length !== 4 || org.substring(0, 3) !== "org" || isNaN(parseInt(org[org.length - 1]))) return reject("Invalid Organization!")
        
        // === Checking if variable walletName is equal to treated variables. If not, return error
        if (walletName !== cpf + org) return reject("Invalid variable format!")
        
        // === Checking parameters ===
        if (typeof car !== 'object') reject('Car must be an object!')
        if (typeof car == 'object' && car.length !== undefined) reject('Car must be an object, not an array!')

        try {
            if (walletName) var contract = await networkServices.connectChannel(walletName)
            else reject("Invalid User!")
            if (car.plate &&
                car.color &&
                car.make &&
                car.model &&
                car.mileage &&
                car.price &&
                car.owner &&
                car.new_owner) {

                var resp = await contract.submitTransaction("createCar", car.plate, car.color, car.make, car.model, car.mileage, car.price, car.owner, car.new_owner)
                resolve(JSON.parse(resp))
            } else reject("Invalid number of arguments!")

        } catch (err) {
            reject(err)
        }

    })

}

module.exports = {
    registerUser: registerUser,
    enrollUser: enrollUser,
    getAllIdentities: getAllIdentities,
    createCar: createCar
}