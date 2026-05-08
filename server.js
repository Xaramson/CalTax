require('dotenv').config()
const express = require('express');
const path = require('path');
const { MantaClient } = require('mantahq-sdk');
const e = require('express');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

const MANTA_API_KEY = process.env.API_KEY;
const MANTA_TABLE_ID = 'tax-calculations';

const manta = new MantaClient({ sdkKey: MANTA_API_KEY });

app.post('/api/save-calculation', async (req, res) => {
    try {
        const { type, gross_income, tax_payable, effective_rate, userId } = req.body;
        const result = await manta.createRecords({
            table: MANTA_TABLE_ID,
            data: [{
                type,
                grossIncome: gross_income,
                taxPayable: tax_payable,
                effectiveRate: effective_rate,
                calculatedAt: new Date().toISOString(),
                userId
            }]
        });
        res.json({ success: true, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save calculation' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        // Fetch all records (filter on server if SDK doesn't support it)
        const response = await manta.fetchAllRecords({
            table: MANTA_TABLE_ID,
            sort: { field: 'calculated_at', order: 'desc' },
            limit: 50
        });

        // Handle both array response and object-wrapped response
        let records = Array.isArray(response) ? response : response?.data || [];
        
        // Filter by userId server-side
        const userRecords = records.filter(record => {
            return record.userid === userId;
        }).slice(0, 5);
        
        const normalizedRecords = userRecords.map(record => {
            return {
                id: record.id,
                type: record.type,
                grossIncome: record.gross_income,
                taxPayable: record.tax_payable,
                effectiveRate: record.effective_rate,
                calculatedAt: record.calculated_at,
                userId: record.userid
            };
        });

        res.json({ records: normalizedRecords });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        const response = await fetch('https://api.mantahq.com/v1/notifications/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': MANTA_API_KEY
            },
            body: JSON.stringify({ to, subject, body, type: 'text' })
        });
        const data = await response.json();
        res.json({ success: response.ok, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Email failed' });
    }
});

// The corrected catch-all route for Express 5
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));