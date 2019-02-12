module.exports = db => {
    require('dotenv').load()

    let Cloudant = require('cloudant')

    let username = process.env.cloudant_username || 'nodejs'
    let password = process.env.cloudant_password

    let con = Cloudant({ account: username, password: password})
    let database = con.db.use(db)

    return database
}