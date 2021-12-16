const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express();
/** Como estou usando json preciso de um middleware */
app.use(express.json())

const custumers = [];

/**
 * Um conta tera:
 * cpf - string (recebe do usario)
 * name - string (recebe do usuario)
 * id - uid (vamos criar)
 * statement - []
 */
app.post("/new-account", (req, res) => {
  /* estou usando os {} para desestruturar os dados e definir o que preciso */
  const { cpf, name } = req.body

  /* Agora preciso começar a codar como será feito o id da conta a ser criarda, usando a dependência UUID */
  const id = uuidv4()

  /**
   * Agora que tenho cpf, name e id eu preciso guardar tudo isso em algum lugar, para iss vou usar um BD fake
   * que seria um array aqui dentro do arquivo mesmo. Esse array se encontra no topo do arquivo, com o nome de
   * custumers.
   * Para iserir os dados dentro do array usarei a function de push para inserir algo no array criando tambem um objeto
   */
  custumers.push({
    cpf,
    name,
    id,
    statement: []
  })

  /** Dando tudo certo uso o status 201 + uma mensagem de congratulations */
  return res.status(201).send("congratulations! Your account has been created!")
})

app.listen(3333)