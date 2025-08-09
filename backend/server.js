const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para ler dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Usuário fixo para simulação
const usuarioFixo = {
  email: 'admin@007digital.com.br',
  senha: '123456'
};

// Rota para processar o login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (email === usuarioFixo.email && senha === usuarioFixo.senha) {
    res.status(200).send('Login bem-sucedido!');
  } else {
    res.status(401).send('E-mail ou senha incorretos.');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
