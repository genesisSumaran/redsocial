//importar firebase
import './firebase.js';
import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

let formulario_crear = document.getElementById("formulario_crear");

formulario_crear.addEventListener("submit", function (e) {
    e.preventDefault();

    let nombre = document.getElementById("nombre").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    //===========CREAR CORREO Y PASSWORD=============
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            let user = userCredential.user;

            // Actualizar el nombre del usuario
            updateProfile(user, {
                displayName: nombre
            }).then(() => {
                console.log("Se actualizo el nombre a " + user.displayName);
                // Redirigir a la página de inicio
                window.location.href = "login.html";
            }).catch((error) => {
                console.log("Error al actualizar el nombre del usuario:", error);
            })
        })
        .catch((error) => {
            // En caso haya error, se muestra por la consola
            console.log(error.message);
        })
})