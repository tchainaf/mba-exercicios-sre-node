const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const port = 8080;

// Middleware de rate limiting (Limite de 100 requisições por minuto)
const limiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minuto
    max: 100,  // Limite de 100 requisições
    message: 'Você excedeu o limite de requisições, tente novamente mais tarde.',
});

// Aplica o rate limiter para todas as rotas
app.use(limiter);

// Função simulando chamada externa
async function externalService() {
    return 'Resposta da chamada externa';
}

// Rota que faz a chamada simulada
app.get('/api/ratelimit', async (req, res) => {
    try {
        const result = await externalService();
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Função simulando 200 chamadas na rota retelimit
async function simulateRequests() {
    const url = `http://localhost:${port}/api/ratelimit`;
    const responses = [];

    for (let i = 0; i < 200; i++) {
        try {
            const response = await axios.get(url);
            responses.push(response.data);
        } catch (error) {
            responses.push(`Requisição ${i + 1} falhou - ${error.response ? error.response.data : error.message}`);
        }
    }
    return responses;
}

// Rota que faz múltiplas chamadas afim de atingir o erro de ratelimit
app.get('/api/ratelimit-test', async (req, res) => {
    try {
        const results = await simulateRequests();
        res.send(results);
    } catch (error) {
        res.status(500).send({ erro: error.message });
    }
});

app.set('trust proxy', 1);

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});