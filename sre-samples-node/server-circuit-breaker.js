const express = require('express');
const CircuitBreaker = require('opossum');
const axios = require('axios');

const app = express();
const port = 8080;

// Função simulando chamada externa com 50% de falhas
async function externalService() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const shouldFail = Math.random() > 0.8;  // Simula o percentual de falhas
            if (shouldFail) {
                reject(new Error('Falha na chamada externa'));
            } else {
                resolve('Resposta da chamada externa');
            }
        }, 2000);  // Simula uma chamada que demora 2 segundos
    });
}

// Configuração do Circuit Breaker
const breaker = new CircuitBreaker(externalService, {
    timeout: 3000,  // Tempo limite de 3 segundos para a chamada
    errorThresholdPercentage: 30,  // Abre o circuito se 30% das requisições falharem
    resetTimeout: 5000  // Tenta fechar o circuito após 5 segundos
});

// Lidando com sucesso e falhas do Circuit Breaker
breaker.fallback(() => 'Resposta do fallback...');
breaker.on('open', () => console.log('Circuito aberto!'));
breaker.on('halfOpen', () => console.log('Circuito meio aberto, testando...'));
breaker.on('close', () => console.log('Circuito fechado novamente'));
breaker.on('reject', () => console.log('Requisição rejeitada pelo Circuit Breaker'));
breaker.on('failure', () => console.log('Falha registrada pelo Circuit Breaker'));
breaker.on('success', () => console.log('Sucesso registrado pelo Circuit Breaker'));

// Rota que faz a chamada simulada com o Circuit Breaker
app.get('/api/circuitbreaker', async (req, res) => {
    try {
        const result = await breaker.fire();
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});


// Função simulando 10 chamadas na rota circuitbreaker
async function simulateRequests() {
    const url = `http://localhost:${port}/api/circuitbreaker`;
    const responses = [];

    for (let i = 0; i < 10; i++) {
        await axios.get(url)
            .then(response => { responses.push(response.data); })
            .catch(error => {
                responses.push(`Requisição ${i + 1} falhou - ${error.response ? error.response.data : error.message}`);
            });
        // Espera 1 segundo entre as chamadas para simular um intervalo
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return responses;
}

// Rota que faz múltiplas chamadas afim de atingir o erro de circuit breaker
app.get('/api/circuitbreaker-test', async (req, res) => {
    try {
        const results = await simulateRequests();
        res.send(results);
    } catch (error) {
        res.status(500).send({ erro: error.message });
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
