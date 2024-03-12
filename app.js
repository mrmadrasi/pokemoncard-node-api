const express = require('express');
const dotenv = require('dotenv');
const app = express();
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
var cors = require('cors');
const bodyParser = require('body-parser');

// Set up Global configuration access
dotenv.config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: process.env.DATABASE
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database!');
});

// enable CORS
app.use(cors());
// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
// serving static files
app.use('/uploads', express.static('uploads'));
// Middleware
app.use(express.json()); // Parse JSON request bodies

// handle storage using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({storage: storage});

app.post('/pokemon/create',upload.single('image'), (req, res,next) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send({ message: 'Please upload a file.' });
    }
    const { name,status } = req.body;
    var sql = "INSERT INTO pokemon_master (name,image,status) VALUES ('"+name+"','"+file.filename+"','"+status+"')";
    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        console.log(err);
        res.send({ success: true, message: 'create new Pokemon successfully' });
    });
});

app.put('/pokemon/update/:id',upload.single('image'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send({ message: 'Please upload a file.' });
    }
    const { name,status } = req.body;

    connection.query('UPDATE pokemon_master SET name = ?, image = ? , status = ? WHERE id = ?', [name, file.fieldname, status], (err, results, fields) => {
        if (err) throw err;

        res.send({ success: true, message: 'updated pokemon successfully' });
    });
});

app.delete('/pokemon/delete/:id', (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM pokemon_master WHERE id = ?', [id], (err, results, fields) => {
        if (err) throw err;
        res.send({ success: true, message: 'pokemon deleted successfully' });
        connection.query('DELETE FROM pokemon_master WHERE pokemon_id = ?', [id], (err, results, fields) => {
            if (err) throw err;
        });
    });
});

app.post('/ability/create', (req, res) => {
    const { pokemon_id,ability,type,damage,status } = req.body;
    var sql = "INSERT INTO pokemon_ability (pokemon_id,ability,type,damage,status) VALUES ('"+pokemon_id+"','"+ability+"','"+type+"','"+damage+"','"+status+"')";
    connection.query(sql, (err, results, fields) => {
        if (err) throw err;
        console.log(err);
        res.send({ success: true, message: 'create ability successfully' });
    });
});


app.put('/ability/update/:id',upload.single('image'), (req, res) => {
    const { pokemon_id,ability,type,damage,status } = req.body;
    connection.query('UPDATE pokemon_ability SET ability = ?,type = ?, damage = ? , status = ? WHERE pokemon_id = ?', [ability, type,damage, status], (err, results, fields) => {
        if (err) throw err;
        res.send({ success: true, message: 'updated pokemon ability successfully' });
    });
});

app.get('/pokemon/ability',(req, res) => {
    const search = req.query.search || '';
    connection.query(`SELECT * FROM pokemon_master WHERE name LIKE '%${search}%'`, (err, rows, fields) => {
        if (err) throw err;
        console.log(rows.length)
        if(rows.length > 0) {
            connection.query('SELECT * FROM pokemon_ability', (err, abilityResult, fields) => {
                if (err) throw err;
                res.send({
                    success: true,
                    data: {
                        pokemon: rows,
                        ability: abilityResult
                    }
                });
            });
        }else{
            res.send({
                success: false,
                data: {
                    pokemon: [],
                    ability: []
                }
            });
        }
    });
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});