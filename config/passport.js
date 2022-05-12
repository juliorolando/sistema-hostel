const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const { sequelize } = require('../source/connection');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
}, async (req, username, password, done) => {

  try {

    const usuario = await sequelize.query(`SELECT * FROM hamerica.usuarios WHERE usuario LIKE "${username}"`, { type: sequelize.QueryTypes.SELECT })

    if (usuario.length > 0) {
      const user = usuario[0];
      const passwordValid = await sequelize.query(`SELECT * FROM hamerica.usuarios WHERE usuario = "${username}" AND clave = "${password}"`, { type: sequelize.QueryTypes.SELECT })
      if (passwordValid.length > 0) {
        done(null, user, console.log('Bienvenido ' + user.usuario))
      } else {
        done(null, false, req.flash('message', 'Clave incorrecta.<br> Intentalo nuevamente.'))
      }
    } else {
      done(null, false, req.flash('message', 'El usuario no existe.<br> Intentalo nuevamente o crea una nueva cuenta.'))
    }
  } catch (error) {
    console.log("Catch error")
  }

}

));

passport.serializeUser((usuario, done) => {
  done(null, usuario.id)
})

passport.deserializeUser(async (id, done) => {
  const usuario = await sequelize.query(`SELECT * FROM hamerica.usuarios WHERE id = "${id}"`, { type: sequelize.QueryTypes.SELECT })
  done(null, usuario[0]);
})
