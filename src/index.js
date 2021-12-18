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
    return res.status(400).json({error: "Customer not found"})
  }

  /* Aqui é onde eu instancio os dados para enviar para a rota usar */
  req.customer = customer;
  
  return next();
}

/**
- Function getBalance com o objetivo de fazer os calculos e me retornar se tem dinheiro na conta e quanto que tem.
- Para realizaão dos cálculos vou usar a operação reduce do JS que precisa de dois parâmetros(o valor final e o inicial),
- o valor final sera a function que recebe um acumulador e um operation e vai retornar o valor final,jae o valor incial sera definido manualmente como zero .
- acumulador (responsável por armazear o valor final) e o operation (tem os dados da operação, tipo e valor). No reduce eu vou definir que
- sempre que for credit é para pegar o valor da operation e somar ao valor final(acumalador) e se não for credit vai
- subtrair o valor recebido de operation.amount.
- LEMBRANDO QUE ESSA FUNCTION PRECISA RECEBER DADOS DO STATEMENT, POR ISSO ELE SERA UM PARAMETRO RECEBIDO*/
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount
    }else{
      return acc - operation.amount
    }
  }, 0); /**Como para uma conta eu preciso do valor inicial, neste caso o segundo parametro recebido pelo reduce sera 0 */
  return balance
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

/** Hora de criar o depósito, preciso realizar um push dentro de customer.statement
 * e definir o que receber dentro do deposito. Para isso vou definir isso como statementOperation
 * e separar por tipo crédito e saque.
*/
app.post("/deposit", verifyIfAccountExists, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfAccountExists, (req, res) => {
  const { amount } = req.body /*Pegando a informação do valor de saque para fazer o balanço e extrato*/
  const { customer } = req;
  
  /**Aqui estou peando o valor final da soma deste cliente e instanciando em uma variavel para usar */
  const balance = getBalance(customer.statement);

  /*Verificando se o valor pedido é maior que o saldo, se for já sera barrado. */
  if(balance < amount) {
    return res.status(400).json({error: "insufficient funds!"})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get("/account", verifyIfAccountExists,(req, res) => {
  const { cpf } = req.headers;

  const customerAccountAccessAlowed = customers.some((customer) => customer.cpf === cpf)

  if (!customerAccountAccessAlowed) {
    return res.status(400).json({error: "Access not allowed"})
  }

  const customer = customers.find((customer) => customer.cpf === cpf)

  return res.json(customer)
})

app.listen(3333)