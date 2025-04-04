const express = require('express');
const { bulkhead } = require('cockatiel');
const axios = require('axios');

const app = express();
const port = 8080;

// Configurando bulkhead com cockatiel (Máximo de 2 requisições simultâneas)
const bulkheadPolicy = bulkhead(2);

// Função simulando chamada externa
async function externalService() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Resposta da chamada externa');
        }, 2000);  // Simula uma chamada que demora 2 segundos
    });
}

// Rota que faz a chamada simulada
app.get('/api/bulkhead', async (req, res) => {
    try {
        const result = await bulkheadPolicy.execute(() => externalService());
        res.send(result);
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Função simulando 3 chamadas na rota bulkhead
async function simulateRequests() {
    const url = `http://localhost:${port}/api/bulkhead`;

    const requests = Array.from({ length: 3 }, (_, i) => {
        return axios.get(url)
            .then(response => { return response.data; })
            .catch(error => {
                return `Requisição ${i + 1} falhou - ${error.response ? error.response.data : error.message}`;
            });
    });

    // Aguarda todas as Promises serem resolvidas
    return Promise.all(requests);
}

// Rota que faz múltiplas chamadas afim de atingir o erro de bulkhead
app.get('/api/bulkhead-test', async (req, res) => {
    try {
        const results = await simulateRequests();

        // Espera 1 segundo entre as chamadas para simular um intervalo
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Chama novamente para simular mais chamadas
        const moreResults = await simulateRequests();
        
        results.push(...moreResults);
        res.send(results);
    } catch (error) {
        res.status(500).send({ erro: error.message });
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
