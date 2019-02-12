const database = require('../config/db.config')('login')
const keyDB = require('../config/db.config')('keydb')

/**
 * 
 * @param {*} credentials { userCPF: string, password: string }
 */

const login = (credentials) => {
    return new Promise((resolve, reject) => {
        console.log(credentials)
        if (credentials.userCPF == undefined || credentials.userCPF == null) return reject("Invalid CPF!")
        if (credentials.password == undefined || credentials.password == null) return reject("Invalid Password!")

        console.info("Authenticating User with CPF " + credentials.userCPF + "...")
        database.find({
            selector: {
                "userCPF": credentials.userCPF,
                "password": credentials.password
            }
        }, (err, result) => {
            if (err) return reject(err)
            if (result.docs.length == 0) return reject({
                err: true,
                message: "Did not find user!"
            })
            let dbObj = result.docs[0]
            if (dbObj.userCPF != credentials.userCPF || dbObj.password != credentials.password) return reject({
                err: true,
                message: "Incorret User or Password!"
            })

            resolve(dbObj)

        })

    })
}

const signIn = (form) => {
    return new Promise((resolve, reject) => {
        if (form.userCPF == undefined || form.userCPF == null) reject("Invalid CPF")
        if (form.password == undefined || form.password == null) reject("Invalid Password")
        if (form.email == undefined || form.email == null) reject("Invalid E-mail")
        if (form.uniqueKey == undefined || form.uniqueKey == null) reject("Invalid Unique Key!")

        console.info("Signing new CPF " + form.userCPF + " with Unique Key: " + form.uniqueKey + "...")

        keyDB.find({
            selector: {
                "userCPF": form.userCPF,
                "uniqueKey": form.uniqueKey
            }
        }, (err, result) => {
            if (err) return reject(err)
            if (result.docs.length == 0)
                return reject({
                    err: true,
                    message: "This Unique Key is invalid or is being used!"
                })
            database.find({
                selector: {
                    "userCPF": form.userCPF,
                    "email": form.email
                }
            }, (err, result) => {
                if (err) return reject(err)
                if (result.docs.length != 0) return reject({
                    err: true,
                    message: "User already exists!"
                })
                database.insert(form, (err, result) => {
                    if (err) return reject(err)
                    resolve(result)
                })
            })
        })
    })
}

module.exports = {
    login: login,
    signIn: signIn
}