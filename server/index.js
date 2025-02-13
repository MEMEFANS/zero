const express = require('express');
const cors = require('cors');
const idoRouter = require('./ido');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/ido', idoRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
