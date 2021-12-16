const { response } = require('express');
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express();
/** Como estou usando json preciso de um middleware */
app.use(express.json())

const customers = [];

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

  /** Como parte da regra de negocios não é possivel ter mais de uma conta popr CPF, então preciso
   * validar o CPF antes de salvar os dados inseridos dentro do meu DB.
   * Para isso usar o metodo SOME possibilita apenas saber se é true ou false e não tenho informações completas
   * como eu teria se usa-se o find. Aqui neste caso só preciso do true ou false msm.
   */
  const customerAlredyExists = customers.some(
    (customer) => customer.cpf === cpf
  )

  if (customerAlredyExists) {
    return res.status(400).json({error: "customer alredy exists!"});
  }

  /**
   * Agora que tenho cpf, name e id eu preciso guardar tudo isso em algum lugar, para iss vou usar um BD fake
   * que seria um array aqui dentro do arquivo mesmo. Esse array se encontra no topo do arquivo, com o nome de
   * customer.
   * Para iserir os dados dentro do array usarei a function de push para inserir algo no array criando tambem um objeto
   */
  customers.push({
    cpf,
    name,
    /* Agora preciso começar a codar como será feito o id da conta a ser criarda, usando a dependência UUID */
    id: uuidv4(),
    statement: []
  })

  /** Dando tudo certo uso o status 201 + uma mensagem de congratulations */
  return res.status(201).send("congratulations! Your account has been created!")
});

app.get("/statement/:cpf", (req, res) => {
  const {cpf} = req.params;

  const customer = customers.find((customer) => customer.cpf === cpf)

  if(!customer) {
    return res.status(400).json({eror: "Customer not found"})
  }
  
  return res.json(customer.statement)
})

app.get("/account/:cpf", (req, res) => {
  const { cpf } = req.params;

  const customerAccountAccessAlowed = customers.some((customer) => customer.cpf === cpf)

  if (!customerAccountAccessAlowed) {
    return res.status(400).json({error: "Access not allowed"})
  }

  const customer = customers.find((customer) => customer.cpf === cpf)

  return res.json(customer)
})
 
app.get("/accounts", (req, res) => { 
  return res.json(customers)
 });

app.listen(3333)