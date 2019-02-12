const router = require('express').Router()
const controller = require('../controller/api.controller')
const dbController = require('../controller/interface.controller')


const routeController = () => {

    router.route('/login')
        .post(login)

    router.route('/signIn')
        .post(signIn)

    return router

}

const login = async (req, res) => {
    try {
        let IDs = await controller.getAllIdentities()
        let ind = IDs.identity.indexOf(req.body.userCPF)
        if (ind !== -1) {
            let login = await dbController.login(req.body)
            res.send(login)
        } else {
            res.status(500).send({
                err: true,
                message: "User does not exists!"
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}

const signIn = async (req, res) => {
    try {
        let IDs = await controller.getAllIdentities()
        let ind = IDs.identity.indexOf(req.body.userCPF)
        if (ind === -1) {
            let signIn = await dbController.signIn(req.body)
            let registerUser = await controller.registerUser(req.body.userCPF)
            let enrollUser = await controller.enrollUser(registerUser.enrollmentID, registerUser.enrollmentSecret)
            res.send(signIn)
        } else {
            res.status(500).json({
                err: true,
                message: "User already exists!"
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports = routeController();