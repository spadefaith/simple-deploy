require('dotenv').config();
const PORT = process.env.PORT;
const express = require('express');
const app = express();

const deploy = require('./controller/deploy');
const queue = require('./services/QueService.mjs');

app.use(express.json());


app.post('/simple-deploy',async function(req,res,next){

    // deploy({
    //     repo_url: '--branch staging git@github.com:spadefaith/gcash-service-fe.git ',
    //     repo_name: 'gcash-staging'
    // })

    queue(async ()=>{
        return deploy({
            repo_url: req.query.repo_url,
            repo_name: req.query.repo_name
        })
    })

    return res.json({status:1});
});


app.listen(PORT,function(err){
    if(err){
        console.error(err);
    } else {
        console.log('listening to port ',PORT);
    }
});



