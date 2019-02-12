const networkServices = require('../config/network.config')

/**
 * 
 * @param {*} userCPF - User primary key. It identifies uniquely each user in an organization
 *                      Must be formatted as: "11100011122" with a total of 11 characters, all numbers
 */

function registerUser(userCPF) {
    return new Promise(async (resolve, reject) => {

        // === Removing all non-numeric characters from userCPF ===
        userCPF = userCPF.replace(/\D/g, '')
        if (userCPF.length !== 11) reject("Invalid CPF! It must be only numbers with 11 digits")

        // === Calling registerUser() function from network-service.js file ===
        networkServices.registerUser(userCPF)
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
 * @param {*} userCPF - User primary key. It uniquely identifies each user in an organization
 *                      Must be formatted as: "11100011122" with a total of 11 characters, all numbers 
 * 
 * @param {*} secret - Password created when registered
 *                     It is a string with numbers, lowercase and uppercase characters
 */

function enrollUser(userCPF, secret) {
    return new Promise(async (resolve, reject) => {
        // === Removing all non-numeric characters from userCPF ===
        userCPF = userCPF.replace(/\D/g, '')
        if (userCPF.length !== 11) reject("Invalid CPF! It must be only numbers with 11 digits")

        // === Calling enrollUser() function from network-service.js file ===
        networkServices.enrollUser(userCPF, secret).then((resp) => {
            resolve(resp)
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
 * @param {*} user - 
 */

function createCar(car, user) {
    return new Promise(async (resolve, reject) => {
        // === Checking parameters ===
        if (typeof car !== 'object') reject('Car must be an object!')
        if (typeof car == 'object' && car.length !== undefined) reject('Car must be an object, not an array!')

        try {
            if (user) var contract = await networkServices.connectChannel(user)
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