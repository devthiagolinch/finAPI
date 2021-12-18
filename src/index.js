const { response } = require('express');
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express();
/** Como estou usando json preciso de um middleware */
app.use(express.json())

/**
 * Middleware que usarei para verificar em rotas espeíficas se a conta existe ou não.
 * Um middleware diferente das outras funções tem 3 requisições, a diferencial é a next,
 * ela é responsável pelo que acontecerá depois da verificação, passar para o próximo ou não.
 * Posso passar dados usando um middleware ao definir uma requisição antes do NEXT
 * que recebe os dados pre definidos (customer neste exemplo).
 */
function verifyIfAccountExists(req, res, next) {
  const {cpf} = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf)

  if(!customer) {
    return res.status(400).json({eror: "Customer not found"})
  }

  /* Aqui é onde eu instancio os dados para enviar para a rota usar */
  req.customer = customer;
  
  return next();
}

const customers = [];

/**
 * Um conta terá:
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

/**Para usar o middleware eu preciso colocar ele entre a rota e função */
app.get("/statement", verifyIfAccountExists, (req, res) => { 
  /* Para puxar os dados do middleware basta instanciar a req criada no middleware */
  const {customer} = req;
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

app.listen(3332)