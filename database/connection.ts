import {Sequelize} from 'sequelize';


const db = new Sequelize('curso_node','root','',{

    host: 'localhost',
    dialect: 'mysql',
    //logging:false

});


export default db;