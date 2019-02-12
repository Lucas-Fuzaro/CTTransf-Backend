# CTTransf-Backend

**- Language:** NodeJS

**- Database:** CloudantDB

**- Blockchain:** Hyperledger Fabric v1.2


## Repositories
- ## config
  **- ```connection-profile.yaml```**
  
  Configuration file for connection related information. We need it in order to communicate with the Chaincode.
      
  **- ```db.config.js```**
  
  Database Configuration File. We use `.env` to set `cloudant_username` and `cloudant_password``.

  **- ```network.config.js```**
  
  Blockchain related configuration. Identities will be registered and enrolled into Fabric CA here. It is also responsible for Gateway connection with the Chaincode.
  
- ## controller
  **- ```api.controller.js```**
  
  Controller for Blockchain related functions. It calls `network.config.js` in order to connect to the Blockchain.
  
  **- ```interface.controller.js```**
  
  Controller for the FrontEnd application. Database queries and inserts are done here.
  
- ## routes
  **- ```routes.js```**
  
  Routing for FrontEnd application. It validates basic information before sending to `interface.controller.js`.
