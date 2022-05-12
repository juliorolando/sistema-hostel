const { render } = require('ejs');
const express = require('express');
const router = express.Router();
const { sequelize } = require('../connection');
const primerIndex = require('../../index');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const fs = require("fs");
const pdf = require("pdf-creator-node");
const session = require('express-session')
const passport = require('passport');
const { isLoggedIn } = require('./../../config/auth')
const flash = require('connect-flash');

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local.signin', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true,
    })(req, res, next)
});

router.get('/logout', (req, res) => {
    req.logOut();
    req.session.destroy();
    res.redirect('/login');
})

router.get('/', (req, res) => {
    res.render('webcheckin')
})

router.get('/creaPax', isLoggedIn, (req, res) => {
    const usuario = req.user.usuario;
    res.render('creaPax', { usuario: usuario })
})


router.post('/pasajeros', isLoggedIn, async (req, res) => {
    const { nombre, apellido, habitacion, celular } = req.body
    const checkin = moment(req.body.checkin).format('DD-MM-YYYY')
    const checkout = moment(req.body.checkout).format('DD-MM-YYYY')
    if (nombre == "" || apellido == "" || habitacion == "" || checkin == "" || checkout == "" || celular == "") {
        res.redirect('/')
    } else {
        const newPax = await sequelize.query(`INSERT INTO hamerica.pasajeros (nombre, apellido, celular, habitacion, checkin, checkout) VALUES ("${nombre}", "${apellido}", "${celular}", "${habitacion}", "${checkin}", "${checkout}")`,
            { type: sequelize.QueryTypes.INSERT })
        res.redirect('/pasajeros')
    }
})

router.get('/reservas/checkout', isLoggedIn, async (req, res) => {
    const usuario = req.user.usuario;
    const title = "Salidas de hoy"
    let today = new Date()
    const checkout = moment(today).format('DD-MM-YYYY')
    const reservas = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE checkout LIKE "${checkout}"`, { type: sequelize.QueryTypes.SELECT })
    res.render('reservas', { reservas: reservas, usuario: usuario, title: title })
})

router.get('/reservas/checkin', isLoggedIn, async (req, res) => {
    const usuario = req.user.usuario;
    const title = "Ingresos de hoy"
    let today = new Date()
    const checkin = moment(today).format('DD-MM-YYYY')
    const reservas = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE checkin LIKE "${checkin}"`, { type: sequelize.QueryTypes.SELECT })
    res.render('reservas', { reservas: reservas, usuario: usuario, title: title  })
})

router.get('/pasajeros', isLoggedIn, async (req, res) => {
    const usuario = req.user.usuario;
    const pasajeros = await sequelize.query(`SELECT * FROM hamerica.pasajeros ORDER BY habitacion ASC`, { type: sequelize.QueryTypes.SELECT })
    /*     
    
        //CODIGO PARA SACAR DIAS RESTANTES ANTE UN SUPUESTO VENCIMIENTO DE RESERVA.
        const hoy = new Date()
        const vto =  pasajeros[0].checkout.split('-')
        const vtoyyyymmdd = new Date(vto[2] + "-" + vto[1] + "-" + vto[0])
        const restarfechas = (hoy.getTime() - vtoyyyymmdd.getTime())
        const resultadoendias = restarfechas / (1000 * 3600 * 24)
        const diasrestantes = Math.round(resultadoendias) * -1; */


    res.render('pasajeros', { pasajeros: pasajeros, usuario: usuario })
})

router.post('/buscarnombre', isLoggedIn, async (req, res) => {
    const { nombre } = req.body
    const usuario = req.user.usuario;
    if (nombre == "") {
        res.redirect('/buscar')
    } else {
        const buscar = await sequelize.query(`SELECT * FROM hamerica.pasajeros WHERE nombre LIKE "${nombre}%"`, { type: sequelize.QueryTypes.SELECT })
        res.render('encontrado', { buscar: buscar, usuario: usuario })
    }
})
router.post('/buscarapellido', isLoggedIn, async (req, res) => {
    const usuario = req.user.usuario;
    const { apellido } = req.body
    if (apellido == "") {
        res.redirect('/buscar')
    } else {
        const buscar = await sequelize.query(`SELECT * FROM hamerica.pasajeros WHERE apellido LIKE "%${apellido}%"`, { type: sequelize.QueryTypes.SELECT })
        res.render('encontrado', { buscar: buscar, usuario: usuario })
    }
})
router.post('/buscarhabitacion', isLoggedIn, async (req, res) => {
    const usuario = req.user.usuario;
    const { habitacion } = req.body
    if (habitacion == "") {
        res.redirect('/buscar')
    } else {
        const buscar = await sequelize.query(`SELECT * FROM hamerica.pasajeros WHERE habitacion = "${habitacion}"`, { type: sequelize.QueryTypes.SELECT })
        res.render('encontrado', { buscar: buscar, usuario: usuario })
    }
})
router.get('/buscar', isLoggedIn, async (req, res) => {
    //  const buscar = await sequelize.query(`SELECT * FROM hamerica.pasajeros WHERE nombre == ${nombre}`, { type: sequelize.QueryTypes.SELECT })
    const usuario = req.user.usuario;
    res.render('buscar', { usuario: usuario })
})

router.get('/borrar/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params
    const borrar = await sequelize.query(`DELETE FROM hamerica.pasajeros WHERE id = "${id}"`, { type: sequelize.QueryTypes.DELETE })
    res.redirect(200, '/pasajeros')
})
router.get('/borrarreserva/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params
    const borrar = await sequelize.query(`DELETE FROM hamerica.reservas WHERE id = "${id}"`, { type: sequelize.QueryTypes.DELETE })
    res.redirect('/reservas')
})

router.get('/tarifas', isLoggedIn, async (req, res) => {
    /*     const dolarnacion = await axios.get(`https://api-dolar-argentina.herokuapp.com/api/all`);
        const dolaruco = await dolarnacion.data.valores.Dolar.casa210.venta._text; */
    const usuario = req.user.usuario;
    res.render('tarifas', { usuario: usuario })
})

router.get('/tarifarios', isLoggedIn, (req, res) => {
    const usuario = req.user.usuario;
    res.render('tarifarios', { usuario: usuario })
})


router.get('/registro', (req, res) => {

    res.render('registro')
})

router.post('/registro', async (req, res) => {
    const { username, clave } = req.body
    try {
        const newUser = await sequelize.query(`INSERT INTO hamerica.usuarios (usuario, clave) VALUES ("${username}", "${clave}")`,
            { type: sequelize.QueryTypes.INSERT })
        res.render('registro', {
            alert: true,
            alertTitle: "¡Usuario registrado!",
            alertMessage: `El usuario ${username} ha sido registrado.`,
            alertIcon: "success",
            showConfirmButton: false,
            timer: 5000,
            ruta: 'pasajeros',
            usuario: usuario
        })
    } catch (error) {
        res.render('registro', {
            alert: true,
            alertTitle: "¡Error!",
            alertMessage: `El usuario ${username} ya se encuentra registrado.`,
            alertIcon: "error",
            showConfirmButton: false,
            timer: 5000,
            ruta: 'registro',
            usuario: usuario
        })
    }
})

router.get('/creaReserva', isLoggedIn, (req, res) => {
    const usuario = req.user.usuario;
    res.render('creaReserva', { usuario: usuario })
})
router.post('/crearReserva', isLoggedIn, async (req, res) => {
    const { titular, cathabitacion, cantidadpax, codigoreserva, comentarios, email, telefono } = req.body
    const usuario = req.user.usuario;
    let checkin = moment(req.body.checkin).format('DD-MM-YYYY')
    let checkout = moment(req.body.checkout).format('DD-MM-YYYY')
    let vencimiento = moment(req.body.vencimiento).format('YYYY-MM-DD')
    try {
        const nuevaRva = await sequelize.query(`INSERT INTO hamerica.reservas (titular, cathabitacion, cantidadpax, checkin, checkout, codigoreserva, usuario, vencimiento, comentarios, email, telefono) VALUES ("${titular}", "${cathabitacion}", "${cantidadpax}", "${checkin}", "${checkout}", "${codigoreserva}", "${usuario}", "${vencimiento}", "${comentarios}", "${email}", "${telefono}" )`,
            { type: sequelize.QueryTypes.INSERT })
        res.render('creaReserva', {
            alert: true,
            alertTitle: "¡Reserva generada!",
            alertMessage: `El código de la reserva es: ${codigoreserva}`,
            alertIcon: "success",
            showConfirmButton: false,
            timer: 5000,
            ruta: 'reservas',
            usuario: usuario
        })
    } catch (error) {
        res.render('creaReserva', {
            alert: true,
            alertTitle: "¡Error!",
            alertMessage: `ERROR - Intentalo nuevamente con otro código de reserva.`,
            alertIcon: "error",
            showConfirmButton: false,
            timer: 5000,
            ruta: 'creaReserva',
            usuario: usuario
        })
    }
})

router.get('/reservas', isLoggedIn, async (req, res) => {
    const title = "Listado de reservas"
    const reservas = await sequelize.query(`SELECT * FROM hamerica.reservas ORDER BY checkin ASC`, { type: sequelize.QueryTypes.SELECT })
    const usuario = req.user.usuario;
    res.render('reservas', { reservas: reservas, usuario: usuario, title: title })

})


router.get('/webcheckin', (req, res) => {
    res.render('webCheckin')
})

router.post('/webcheckin', async (req, res) => {
    const fechain = moment(req.body.checkin).format('DD-MM-YYYY')
    const codigorva = req.body.codigorva
    const reserva = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE codigoreserva = "${codigorva}" AND checkin = "${fechain}"`, { type: sequelize.QueryTypes.SELECT })
    if (reserva.length !== 0) {
        res.render('checkin', { reserva: reserva })
    } else {
        res.render('webCheckin', {
            alert: true,
            alertTitle: "¡No encontramos la reserva!",
            alertMessage: `Verifica que los datos sean correctos e intentalo nuevamente.`,
            alertIcon: "error",
            showConfirmButton: false,
            timer: 5000,
        })
    }

})

router.get('/checkin', isLoggedIn, (req, res) => {
    res.send('ACCESO RESTRINGIDO')
})

router.post('/checkincompleto', isLoggedIn, (req, res) => {
    res.send('OK')
})


router.get('/creavoucher/:codigo', isLoggedIn, async (req, res) => {
    const codigorva = req.params.codigo
    const reserva = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE codigoreserva = "${codigorva}"`, { type: sequelize.QueryTypes.SELECT })
    const titularderva = reserva[0].titular.split(" ").join("");
    const numrandom = new Date().getMilliseconds()
    let options = {
        format: "A4",
        orientation: "portrait",
        border: "5mm",
        header: {
            height: "5mm",
        },
    };
    let html = fs.readFileSync("./views/voucher.html", "utf8")
    let namefile = titularderva + numrandom + '.pdf';
    let document = {
        html: html,
        data: {
            users: reserva,
        },
        path: "./" + namefile,
        type: "pdf",
    };
    pdf.create(document, options).then((res) => {
        console.log(res);
    })
        .catch((error) => {
            console.log(error);
        });
    res.redirect('/reservas')
})

router.get('/dashboard', isLoggedIn, async (req, res) => {
    let today = new Date()
    const hoy = moment(today).format('DD-MM-YYYY')
    const checksin = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE checkin LIKE "${hoy}"`, { type: sequelize.QueryTypes.SELECT })
    const checksout = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE checkout LIKE "${hoy}"`, { type: sequelize.QueryTypes.SELECT })
    //consulta que devuelve todas las reservas que no tengan la fecha 0000-00-00/null como vencimiento.
    const reservas = await sequelize.query(`SELECT * FROM hamerica.reservas WHERE vencimiento <> "0000-00-00" ORDER BY vencimiento ASC`, { type: sequelize.QueryTypes.SELECT })
    //devuelve todas las reservas - utilizado para contador de reservas confirmadas
    const reservasConfirmadas = await sequelize.query(`SELECT * FROM hamerica.reservas`, { type: sequelize.QueryTypes.SELECT })
    const pasajeros = await sequelize.query(`SELECT * FROM hamerica.pasajeros ORDER BY checkin ASC`, { type: sequelize.QueryTypes.SELECT })
    let checkinhoy = 0
    let checkouthoy = 0
    let pasajerosInhouse = 0
    let reservasconfirmadas = 0
    let usuario = req.user.usuario;
    /*    //CODIGO PARA SACAR DIAS RESTANTES DE VENCIMIENTO DE RESERVA.
        const vto = pasajeros[0].checkout.split('-')s
        const vtoyyyymmdd = new Date(vto[2] + "-" + vto[1] + "-" + vto[0])
        const restarfechas = (today.getTime() - vtoyyyymmdd.getTime())
        const resultadoendias = restarfechas / (1000 * 3600 * 24)
        const diasrestantes = Math.round(resultadoendias) * -1;
         */
    pasajerosInhouse = pasajeros.length;
    reservasconfirmadas = reservasConfirmadas.length;
    checkinhoy = checksin.length;
    checkouthoy = checksout.length;
    res.render('dashboard', {
        checkin: checkinhoy,
        checkout: checkouthoy,
        huespedes: pasajerosInhouse,
        reservasconfirmadas: reservasconfirmadas,
        reservas: reservas,
        moment: moment,
        usuario: usuario
    })
})

module.exports = router;

