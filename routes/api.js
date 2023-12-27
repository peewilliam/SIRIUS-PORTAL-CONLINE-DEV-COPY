const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const multer = require('multer');

// const {db} = require('../functions/dbExcel');
const {commission} = require('../functions/commission');

// Configurando o middleware para aceitar uploads de arquivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota para lidar com o upload do arquivo
router.post('/upload', upload.single('file'), async (req, res) => {
    try {

      res.status(200).json(resultados);
    } catch (error) {
      res.status(500).send('Erro ao processar o arquivo XLSX.');
    }
});

router.post('/commissionByUser', async (req, res, next) => {
 const {UserId, type} = req.body

  try {
    const result = await commission.getByUser(UserId, type)
      res.status(200).json(result)
  } catch (error) {
      res.status(404).json('error')   
  }
  
});

router.post('/listUser', async (req, res, next) => {
   try {
     const result = await commission.listUser()

     res.status(200).json(result)
   } catch (error) {
 
       res.status(404).json('error')   
   }
   
});

router.post('/getValuesCommisionsByUser', async (req, res, next) => {
  const {UserId} = req.body
try {
    const result = await commission.getValuesCommisionsByUser(UserId)
    res.status(200).json(result)
} catch (error) {
    res.status(404).json('error')   
}

});

router.post('/RegisterCommission', async (req, res, next) => {
  const {body} = req.body
try {
  const result = await commission.RegisterCommission(body)
    res.status(200).json(result)
} catch (error) {
    res.status(404).json('error')   
}

});

router.post('/ComissionHistory', async (req, res, next) => {
try {
  const result = await commission.ComissionHistory()
    res.status(200).json(result)
} catch (error) {
    res.status(404).json('error')   
}
});

router.post('/ContentComissionHistory', async (req, res, next) => {
  const {id} = req.body
  try {
    const result = await commission.ContentComissionHistory(id)
      res.status(200).json(result)
  } catch (error) {
    console.log(error)
      res.status(404).json(error)   
  }
  });
 



module.exports = router;