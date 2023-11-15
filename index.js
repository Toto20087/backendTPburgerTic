const menu = require('./menu.json');
const mysql = require("mysql2");
const express = require("express");
const app = express();
app.use(express.json());


const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rootroot",
    database: "burgertic",
});

connection.connect((err) => {
    if (err) {
        console.error("Error conectándose: " + err);
        return;
    }

    console.log("Base de datos conectada");
});



app.get("/", (req, res) => {
    res.send("Hello World!")
});

app.listen(3000, () => {
    console.log("Server running on port 3000")
});


app.get("/menu", (req, res) => {
    res.status(200).json({menu});
    connection.query("SELECT * FROM platos", (err, rows) => {
        if (err) {
            console.error("Error consultando: " + err);
            return;
        }
    
        console.log(rows);
    });
});

app.get("/menu/:id", (req, res) => {
    const id = parseInt(req.params.id)

    if (!id){
        res.status(400).json({msg: "tenes que ingresar un id"});
        return
    }

    item = menu[id-1]

    if(!item){
        res.status(404).json({msg: "no se encontro el plato en el menu"});
        return
    }

    res.status(200).json({item:item});

    connection.query("SELECT * FROM platos WHERE id = ?", [id], (err, rows) => {
        if (err) {
            console.error("Error consultando: " + err);
            return;
        }
    
        console.log(rows);
    });



});

app.get("/combos", (req, res) => {
    res.json(menu.filter((item) => item.tipo === "combo"))

    connection.query("SELECT * FROM `platos` WHERE `tipo` = ?", ['combo'], (err, rows) => {
        if (err) {
            console.error("Error consultando: " + err);
            return;
        }
    
        console.log(rows);
    });
});


app.get("/principales", (req, res) => {
    res.json(menu.filter((item) => item.tipo === "principal"))

    connection.query("SELECT * FROM `platos` WHERE `tipo` = ?", ['principal'], (err, rows) => {
        if (err) {
            console.error("Error consultando: " + err);
            return;
        }
    
        console.log(rows);
    });
});


app.get("/postres", (req, res) => {
    res.json(menu.filter((item) => item.tipo === "postre"))

    connection.query("SELECT * FROM `platos` WHERE `tipo` = ?", ['postre'], (err, rows) => {
        if (err) {
            console.error("Error consultando: " + err);
            return;
        }
    
        console.log(rows);
    });
});

app.post('/pedido', (req, res) => {
    const pedido = req.body;
    let id_pedido = 0;
    if (!pedido.productos) {
        res.status(500).json({ msg: 'Tenes que ingresar cosas para tu pedido' });
        return;
    }
    connection.query(`INSERT INTO pedidos (id_usuarios, fecha, estado) VALUES (?, ?, ?)`, [1, new Date(), "pendiente"], (err, resultado) => {
        if (err) {
            res.status(500).json({ msg: ("Error insertando pedido: " + err) });
            return;
        }
        id_pedido = resultado.insertId;
        pedido.productos.forEach((item, i) => {
            connection.query(`INSERT INTO pedidos_platos (id_pedido, id_plato, cantidad) VALUES (?, ?, ?)`, [id_pedido, item.id, item.cantidad], (err, result) => {
                if (err) {
                    res.status(500).json({ msg: ("No se pudo registar el pedido porque " + err) });
                    return;
                }

                if (i === pedido.productos.length - 1) {
                    res.json({ id: id_pedido });
                }
            });
        });
    });
});

app.get('/pedidos/:id', (req, res) => {
    const usuarioId = req.params.id;

    const query = `
        SELECT p.id, p.fecha, p.estado, p.id_usuarios as id_usuario, pl.id as plato_id, pl.nombre as plato_nombre, pl.precio as plato_precio, pp.cantidad FROM pedidos p JOIN PEDIDOS_PLATOS pp ON p.id = pp.id_pedido JOIN platos pl ON pp.id_plato = pl.id WHERE p.id_usuarios = ?
    `;
          
            connection.query(query, [usuarioId], (error, results) => {
              if (error) {
                console.error('Error al realizar la consulta:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
              } else {

                const formattedResults = results.map(row => {
                  return {
                    id: row.id,
                    fecha: row.fecha,
                    estado: row.estado,
                    id_usuario: row.id_usuario,
                    platos: [
                      {
                        id: row.plato_id,
                        nombre: row.plato_nombre,
                        precio: row.plato_precio,
                        cantidad: row.cantidad
                      }
                    ]
                  };
                });
          
                res.json(formattedResults);
              }
            });
          });



app.post("/usuarios", (req, res) => {
    let nombre = req.body.nombre;
    let apellido = req.body.apellido;
    let email = req.body.email;
    let password = req.body.password;

    console.log(nombre, apellido, email, password);

    connection.query("INSERT INTO usuarios (nombre, apellido, email, password) VALUES (?, ?, ?, ?)", [nombre, apellido, email, password], (err, resultado) => {
        if (err) {
            res.status(500).json({ msg: ("Error insertando usuario: " + err) });
            return;
        }
        res.json({ id: resultado.insertId });   
    });
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    connection.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, resultado) => {

        let id = resultado[0].id;
        let nombre = resultado[0].nombre;
        let apellido = resultado[0].apellido;

        if (err) {
            res.status(500).json({ msg: ("Error insertando usuario: " + err) });
            return;
        }
        if (resultado.length === 0) {
            res.status(401).json({ msg: "Usuario no encontrado" });
            return;
        }

    res.json({id: id,
              nombre: nombre,
              apellido: apellido,
              email: email});   
})});
