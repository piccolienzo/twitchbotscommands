const express = require('express');
const serverless= require('serverless-http');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors())

const router = express.Router();

// Endpoint que maneja las opciones y probabilidades
app.get('/choice', (req, res) => {
    // Obtener las opciones y probabilidades de los parámetros URL (cambiados a 'q' y 'p')
    const options = req.query.q ? req.query.q.split(',') : [];
    const probabilities = req.query.p ? req.query.p.split(',').map(p => parseFloat(p)) : [];

    // Verificar que se haya enviado al menos una opción
    if (options.length === 0) {
        return res.status(400).send('Debe enviar al menos una opción');
    }

    // Caso 1: Si el número de opciones es igual al número de probabilidades
    if (options.length === probabilities.length) {
        // Las probabilidades ya están bien definidas
        if (probabilities.reduce((sum, p) => sum + p, 0) !== 100) {
            return res.status(400).send('La suma de las probabilidades debe ser 100');
        }
    }

    // Caso 2: Si el número de opciones es mayor que el número de probabilidades
    if (options.length > probabilities.length) {
        let totalProb = probabilities.reduce((sum, p) => sum + p, 0);
        let remainingProb = 100 - totalProb;

        if (remainingProb < 0) {
            return res.status(400).send('La suma de las probabilidades no puede ser mayor que 100');
        }

        // Distribuir el resto de las probabilidades proporcionalmente
        let missingCount = options.length - probabilities.length;
        let remainingProbEach = remainingProb / missingCount;

        for (let i = 0; i < missingCount; i++) {
            probabilities.push(remainingProbEach);
        }
    }

    // Caso 3: Si el número de opciones es menor que el número de probabilidades
    if (options.length < probabilities.length) {
        let extraProb = probabilities.slice(options.length); // Obtenemos las probabilidades sobrantes
        let lastProbIndex = options.length - 1;

        // Sumamos todas las probabilidades sobrantes a la última opción
        probabilities[lastProbIndex] += extraProb.reduce((sum, p) => sum + p, 0);
        probabilities.splice(options.length, probabilities.length - options.length); // Eliminamos las probabilidades sobrantes
    }

    // Generar un número aleatorio para seleccionar una opción
    let randomNum = Math.random() * 100;
    let sum = 0;
    let selectedOption = '';

    // Iterar sobre las opciones y probabilidades para seleccionar una
    for (let i = 0; i < options.length; i++) {
        sum += probabilities[i];
        if (randomNum <= sum) {
            selectedOption = options[i];
            break;
        }
    }

    // Responder con la opción seleccionada
    res.send(selectedOption);
});


app.use('/.netlify/functions/server', router);
export const handler = serverless(app);
// Iniciar el servidor
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });